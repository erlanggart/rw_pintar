<?php
/**
 * API: Iuran Warga
 * Manages monthly dues per household (keluarga) per RT.
 *
 * Roles:
 *  - rt        : full CRUD, scoped to own rt_id
 *  - rw        : read-only, scoped to own RW
 *  - desa      : read-only, scoped to own desa
 *  - superadmin: read-only (full scope)
 */
require_once __DIR__ . '/../config/database.php';

$user = authenticate();
authorize($user, ['superadmin', 'desa', 'rw', 'rt']);

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Return the single rt_id the authenticated RT user owns.
 * Returns 0 for non-RT roles (caller must handle separately).
 */
function ownRtId(array $user): int {
    return ($user['role'] === 'rt') ? (int) $user['rt_id'] : 0;
}

/**
 * Build a WHERE clause + param binding to scope iuran_warga rows
 * to what the current user is allowed to see.
 * Accepts optional filters: rt_id, rw_id, desa_id, bulan, tahun, status.
 */
function buildIuranScope(mysqli $db, array $user, array $filters): array {
    $conditions = [];
    $types      = '';
    $params     = [];

    // ---- role-based scope ------------------------------------------------
    if ($user['role'] === 'rt') {
        $conditions[] = 'iw.rt_id = ?';
        $types  .= 'i';
        $params[] = (int) $user['rt_id'];
    } elseif ($user['role'] === 'rw') {
        $conditions[] = 'rt.rw_id = ?';
        $types  .= 'i';
        $params[] = (int) $user['rw_id'];
    } elseif ($user['role'] === 'desa') {
        $conditions[] = 'rw.desa_id = ?';
        $types  .= 'i';
        $params[] = (int) $user['desa_id'];
    }
    // superadmin: no forced scope

    // ---- optional query filters ------------------------------------------
    if (!empty($filters['rt_id']) && $user['role'] !== 'rt') {
        $conditions[] = 'iw.rt_id = ?';
        $types  .= 'i';
        $params[] = (int) $filters['rt_id'];
    }
    if (!empty($filters['rw_id']) && in_array($user['role'], ['superadmin', 'desa'], true)) {
        $conditions[] = 'rt.rw_id = ?';
        $types  .= 'i';
        $params[] = (int) $filters['rw_id'];
    }
    if (!empty($filters['desa_id']) && $user['role'] === 'superadmin') {
        $conditions[] = 'rw.desa_id = ?';
        $types  .= 'i';
        $params[] = (int) $filters['desa_id'];
    }
    if (!empty($filters['bulan'])) {
        $conditions[] = 'iw.bulan = ?';
        $types  .= 'i';
        $params[] = (int) $filters['bulan'];
    }
    if (!empty($filters['tahun'])) {
        $conditions[] = 'iw.tahun = ?';
        $types  .= 'i';
        $params[] = (int) $filters['tahun'];
    }
    if (!empty($filters['status'])) {
        $conditions[] = 'iw.status = ?';
        $types  .= 's';
        $params[] = $filters['status'];
    }

    $where = $conditions ? ('WHERE ' . implode(' AND ', $conditions)) : '';
    return [$where, $types, $params];
}

// ── GET ────────────────────────────────────────────────────────────────────

if ($method === 'GET') {
    $filters = [
        'rt_id'   => $_GET['rt_id']   ?? '',
        'rw_id'   => $_GET['rw_id']   ?? '',
        'desa_id' => $_GET['desa_id'] ?? '',
        'bulan'   => $_GET['bulan']   ?? '',
        'tahun'   => $_GET['tahun']   ?? '',
        'status'  => $_GET['status']  ?? '',
    ];

    // ── GET single record by id ──────────────────────────────────────────
    if (!empty($_GET['id'])) {
        $id = (int) $_GET['id'];
        [$where, $types, $params] = buildIuranScope($db, $user, $filters);

        $sql = "SELECT iw.*,
                       k.no_kk, k.kepala_keluarga, k.alamat,
                       rt.nomor_rt, rw.nomor_rw, d.nama_desa
                FROM iuran_warga iw
                JOIN keluarga k  ON iw.keluarga_id = k.id
                JOIN rt          ON iw.rt_id = rt.id
                JOIN rw          ON rt.rw_id = rw.id
                JOIN desa d      ON rw.desa_id = d.id
                WHERE iw.id = ?";
        if ($types) {
            $sql .= " AND " . substr($where, 6); // remove leading "WHERE "
            $types = 'i' . $types;
            array_unshift($params, $id);
        } else {
            $types = 'i';
            $params = [$id];
        }

        $stmt = $db->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        if (!$row) {
            jsonResponse(['error' => 'Data tidak ditemukan'], 404);
        }
        jsonResponse($row);
    }

    // ── GET list ─────────────────────────────────────────────────────────
    [$where, $types, $params] = buildIuranScope($db, $user, $filters);

    $sql = "SELECT iw.*,
                   k.no_kk, k.kepala_keluarga, k.alamat,
                   rt.nomor_rt, rw.nomor_rw, d.nama_desa
            FROM iuran_warga iw
            JOIN keluarga k  ON iw.keluarga_id = k.id
            JOIN rt          ON iw.rt_id = rt.id
            JOIN rw          ON rt.rw_id = rw.id
            JOIN desa d      ON rw.desa_id = d.id
            $where
            ORDER BY iw.tahun DESC, iw.bulan DESC, k.kepala_keluarga ASC";

    $stmt = $db->prepare($sql);
    if ($types && $params) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    jsonResponse($rows);
}

// ── Mutative methods: RT only ───────────────────────────────────────────────

if ($method !== 'GET' && $user['role'] !== 'rt') {
    jsonResponse(['error' => 'Hanya akun RT yang dapat mengubah data iuran'], 403);
}

$rtId = (int) $user['rt_id'];

// ── POST – create / upsert iuran ───────────────────────────────────────────

if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    $keluargaId  = (int) ($body['keluarga_id']  ?? 0);
    $bulan       = (int) ($body['bulan']        ?? 0);
    $tahun       = (int) ($body['tahun']        ?? 0);
    $jumlah      = (int) ($body['jumlah']       ?? 0);
    $status      = in_array($body['status'] ?? '', ['belum', 'lunas'], true) ? $body['status'] : 'belum';
    $keterangan  = trim((string) ($body['keterangan'] ?? ''));

    if (!$keluargaId || !$bulan || !$tahun || $jumlah <= 0) {
        jsonResponse(['error' => 'Keluarga, bulan, tahun, dan jumlah wajib diisi'], 400);
    }
    if ($bulan < 1 || $bulan > 12) {
        jsonResponse(['error' => 'Bulan tidak valid'], 400);
    }

    // verify keluarga belongs to this RT
    $stmt = $db->prepare("SELECT id FROM keluarga WHERE id = ? AND rt_id = ? LIMIT 1");
    $stmt->bind_param('ii', $keluargaId, $rtId);
    $stmt->execute();
    if (!$stmt->get_result()->fetch_assoc()) {
        jsonResponse(['error' => 'Keluarga tidak ditemukan di RT ini'], 404);
    }

    // upsert
    $stmt = $db->prepare("
        INSERT INTO iuran_warga (rt_id, keluarga_id, bulan, tahun, jumlah, status, keterangan, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            jumlah = VALUES(jumlah),
            status = VALUES(status),
            keterangan = VALUES(keterangan),
            updated_at = CURRENT_TIMESTAMP
    ");
    $stmt->bind_param('iiiiissi', $rtId, $keluargaId, $bulan, $tahun, $jumlah, $status, $keterangan, $user['id']);
    if (!$stmt->execute()) {
        jsonResponse(['error' => 'Gagal menyimpan data iuran'], 500);
    }

    // get the row id (insert or existing)
    $iuranId = $stmt->insert_id ?: (function() use ($db, $rtId, $keluargaId, $bulan, $tahun) {
        $s = $db->prepare("SELECT id FROM iuran_warga WHERE rt_id=? AND keluarga_id=? AND bulan=? AND tahun=? LIMIT 1");
        $s->bind_param('iiii', $rtId, $keluargaId, $bulan, $tahun);
        $s->execute();
        return (int) ($s->get_result()->fetch_assoc()['id'] ?? 0);
    })();

    // sync kas_rt: if lunas → ensure pemasukan exists; if belum → remove it
    syncKasFromIuran($db, $iuranId, $rtId, $bulan, $tahun, $jumlah, $status, $user['id']);

    jsonResponse(['success' => true, 'id' => $iuranId], 201);
}

// ── PUT – update iuran ─────────────────────────────────────────────────────

if ($method === 'PUT') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int) ($_GET['id'] ?? $body['id'] ?? 0);
    if (!$id) {
        jsonResponse(['error' => 'ID diperlukan'], 400);
    }

    // verify ownership
    $stmt = $db->prepare("SELECT * FROM iuran_warga WHERE id = ? AND rt_id = ? LIMIT 1");
    $stmt->bind_param('ii', $id, $rtId);
    $stmt->execute();
    $existing = $stmt->get_result()->fetch_assoc();
    if (!$existing) {
        jsonResponse(['error' => 'Data tidak ditemukan atau bukan milik RT ini'], 404);
    }

    $jumlah     = isset($body['jumlah'])     ? (int) $body['jumlah']     : (int) $existing['jumlah'];
    $status     = in_array($body['status'] ?? '', ['belum', 'lunas'], true) ? $body['status'] : $existing['status'];
    $keterangan = array_key_exists('keterangan', $body) ? trim((string) $body['keterangan']) : $existing['keterangan'];

    if ($jumlah <= 0) {
        jsonResponse(['error' => 'Jumlah harus lebih dari 0'], 400);
    }

    $stmt = $db->prepare("UPDATE iuran_warga SET jumlah=?, status=?, keterangan=? WHERE id=?");
    $stmt->bind_param('issi', $jumlah, $status, $keterangan, $id);
    if (!$stmt->execute()) {
        jsonResponse(['error' => 'Gagal memperbarui data iuran'], 500);
    }

    syncKasFromIuran($db, $id, $rtId, (int)$existing['bulan'], (int)$existing['tahun'], $jumlah, $status, $user['id']);

    jsonResponse(['success' => true]);
}

// ── DELETE – remove iuran ──────────────────────────────────────────────────

if ($method === 'DELETE') {
    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) {
        jsonResponse(['error' => 'ID diperlukan'], 400);
    }

    $stmt = $db->prepare("SELECT id FROM iuran_warga WHERE id = ? AND rt_id = ? LIMIT 1");
    $stmt->bind_param('ii', $id, $rtId);
    $stmt->execute();
    if (!$stmt->get_result()->fetch_assoc()) {
        jsonResponse(['error' => 'Data tidak ditemukan atau bukan milik RT ini'], 404);
    }

    // Remove linked kas entry first
    $stmt2 = $db->prepare("DELETE FROM kas_rt WHERE iuran_id = ?");
    $stmt2->bind_param('i', $id);
    $stmt2->execute();

    $stmt3 = $db->prepare("DELETE FROM iuran_warga WHERE id = ?");
    $stmt3->bind_param('i', $id);
    $stmt3->execute();

    jsonResponse(['success' => true]);
}

jsonResponse(['error' => 'Method tidak didukung'], 405);

// ── Helper: sync kas_rt from iuran status ──────────────────────────────────

function syncKasFromIuran(mysqli $db, int $iuranId, int $rtId, int $bulan, int $tahun, int $jumlah, string $status, int $userId): void {
    $tanggal = sprintf('%04d-%02d-01', $tahun, $bulan);

    if ($status === 'lunas') {
        // upsert pemasukan
        $stmt = $db->prepare("
            INSERT INTO kas_rt (rt_id, jenis, kategori, jumlah, keterangan, tanggal, iuran_id, created_by)
            VALUES (?, 'pemasukan', 'Iuran Warga', ?, 'Iuran warga bulan ke-? tahun ?', ?, ?, ?)
            ON DUPLICATE KEY UPDATE jumlah = VALUES(jumlah), tanggal = VALUES(tanggal)
        ");
        // Use proper upsert based on iuran_id uniqueness
        // First check if exists
        $check = $db->prepare("SELECT id FROM kas_rt WHERE iuran_id = ? LIMIT 1");
        $check->bind_param('i', $iuranId);
        $check->execute();
        $existing = $check->get_result()->fetch_assoc();

        $keterangan = "Iuran warga bulan {$bulan} tahun {$tahun}";

        if ($existing) {
            $upd = $db->prepare("UPDATE kas_rt SET jumlah=?, tanggal=?, keterangan=? WHERE iuran_id=?");
            $upd->bind_param('issi', $jumlah, $tanggal, $keterangan, $iuranId);
            $upd->execute();
        } else {
            $ins = $db->prepare("INSERT INTO kas_rt (rt_id, jenis, kategori, jumlah, keterangan, tanggal, iuran_id, created_by) VALUES (?, 'pemasukan', 'Iuran Warga', ?, ?, ?, ?, ?)");
            $ins->bind_param('iissii', $rtId, $jumlah, $keterangan, $tanggal, $iuranId, $userId);
            $ins->execute();
        }
    } else {
        // status = 'belum' → remove kas entry if exists
        $del = $db->prepare("DELETE FROM kas_rt WHERE iuran_id = ?");
        $del->bind_param('i', $iuranId);
        $del->execute();
    }
}
