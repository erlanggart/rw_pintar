<?php
/**
 * API: Kas RT
 * Manages the RT cash register: income (pemasukan) & expenses (pengeluaran).
 *
 * Roles:
 *  - rt        : full CRUD, scoped to own rt_id
 *  - rw        : read-only, scoped to own RW
 *  - desa      : read-only, scoped to own desa
 *  - superadmin: read-only (full scope)
 *
 * Transactions sourced from iuran (iuran_id IS NOT NULL) cannot be
 * created / edited / deleted directly; they are managed via iuran_warga.php.
 */
require_once __DIR__ . '/../config/database.php';

$user = authenticate();
authorize($user, ['superadmin', 'desa', 'rw', 'rt']);

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// ── Helpers ────────────────────────────────────────────────────────────────

function buildKasScope(array $user, array $filters): array {
    $conditions = [];
    $types      = '';
    $params     = [];

    if ($user['role'] === 'rt') {
        $conditions[] = 'k.rt_id = ?';
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

    if (!empty($filters['rt_id']) && $user['role'] !== 'rt') {
        $conditions[] = 'k.rt_id = ?';
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
    if (!empty($filters['jenis'])) {
        $conditions[] = 'k.jenis = ?';
        $types  .= 's';
        $params[] = $filters['jenis'];
    }
    if (!empty($filters['bulan'])) {
        $conditions[] = 'MONTH(k.tanggal) = ?';
        $types  .= 'i';
        $params[] = (int) $filters['bulan'];
    }
    if (!empty($filters['tahun'])) {
        $conditions[] = 'YEAR(k.tanggal) = ?';
        $types  .= 'i';
        $params[] = (int) $filters['tahun'];
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
        'jenis'   => $_GET['jenis']   ?? '',
        'bulan'   => $_GET['bulan']   ?? '',
        'tahun'   => $_GET['tahun']   ?? '',
    ];

    // ── GET ?action=saldo → summary per rt_id ─────────────────────────────
    if (isset($_GET['action']) && $_GET['action'] === 'saldo') {
        [$where, $types, $params] = buildKasScope($user, $filters);

        $sql = "SELECT
                    k.rt_id,
                    rt.nomor_rt,
                    rw.nomor_rw,
                    d.nama_desa,
                    COALESCE(SUM(CASE WHEN k.jenis='pemasukan'   THEN k.jumlah ELSE 0 END), 0) AS total_pemasukan,
                    COALESCE(SUM(CASE WHEN k.jenis='pengeluaran' THEN k.jumlah ELSE 0 END), 0) AS total_pengeluaran,
                    COALESCE(SUM(CASE WHEN k.jenis='pemasukan'   THEN k.jumlah
                                      WHEN k.jenis='pengeluaran' THEN -k.jumlah ELSE 0 END), 0) AS saldo
                FROM kas_rt k
                JOIN rt  ON k.rt_id = rt.id
                JOIN rw  ON rt.rw_id = rw.id
                JOIN desa d ON rw.desa_id = d.id
                $where
                GROUP BY k.rt_id, rt.nomor_rt, rw.nomor_rw, d.nama_desa";

        $stmt = $db->prepare($sql);
        if ($types && $params) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        jsonResponse($rows);
    }

    // ── GET ?action=saldo_bulan → monthly summary ─────────────────────────
    if (isset($_GET['action']) && $_GET['action'] === 'saldo_bulan') {
        [$where, $types, $params] = buildKasScope($user, $filters);

        $sql = "SELECT
                    YEAR(k.tanggal)  AS tahun,
                    MONTH(k.tanggal) AS bulan,
                    COALESCE(SUM(CASE WHEN k.jenis='pemasukan'   THEN k.jumlah ELSE 0 END), 0) AS total_pemasukan,
                    COALESCE(SUM(CASE WHEN k.jenis='pengeluaran' THEN k.jumlah ELSE 0 END), 0) AS total_pengeluaran,
                    COALESCE(SUM(CASE WHEN k.jenis='pemasukan'   THEN k.jumlah
                                      WHEN k.jenis='pengeluaran' THEN -k.jumlah ELSE 0 END), 0) AS saldo_bulan
                FROM kas_rt k
                JOIN rt  ON k.rt_id = rt.id
                JOIN rw  ON rt.rw_id = rw.id
                JOIN desa d ON rw.desa_id = d.id
                $where
                GROUP BY YEAR(k.tanggal), MONTH(k.tanggal)
                ORDER BY tahun DESC, bulan DESC";

        $stmt = $db->prepare($sql);
        if ($types && $params) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        jsonResponse($rows);
    }

    // ── GET single record ─────────────────────────────────────────────────
    if (!empty($_GET['id'])) {
        $id = (int) $_GET['id'];
        [$where, $types, $params] = buildKasScope($user, $filters);

        $andClause = $types ? ' AND ' . substr($where, 6) : '';
        $sql = "SELECT k.*, rt.nomor_rt, rw.nomor_rw, d.nama_desa, u.nama_lengkap AS created_by_name
                FROM kas_rt k
                JOIN rt  ON k.rt_id = rt.id
                JOIN rw  ON rt.rw_id = rw.id
                JOIN desa d ON rw.desa_id = d.id
                JOIN users u ON k.created_by = u.id
                WHERE k.id = ? $andClause";

        $stmt = $db->prepare($sql);
        $allTypes  = 'i' . $types;
        $allParams = array_merge([$id], $params);
        $stmt->bind_param($allTypes, ...$allParams);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        if (!$row) {
            jsonResponse(['error' => 'Data tidak ditemukan'], 404);
        }
        jsonResponse($row);
    }

    // ── GET list ──────────────────────────────────────────────────────────
    [$where, $types, $params] = buildKasScope($user, $filters);

    $sql = "SELECT k.*, rt.nomor_rt, rw.nomor_rw, d.nama_desa, u.nama_lengkap AS created_by_name,
                   iw.bulan AS iuran_bulan, iw.tahun AS iuran_tahun,
                   iw_k.kepala_keluarga AS iuran_kepala_keluarga
            FROM kas_rt k
            JOIN rt  ON k.rt_id = rt.id
            JOIN rw  ON rt.rw_id = rw.id
            JOIN desa d ON rw.desa_id = d.id
            JOIN users u ON k.created_by = u.id
            LEFT JOIN iuran_warga iw ON k.iuran_id = iw.id
            LEFT JOIN keluarga iw_k  ON iw.keluarga_id = iw_k.id
            $where
            ORDER BY k.tanggal DESC, k.id DESC";

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
    jsonResponse(['error' => 'Hanya akun RT yang dapat mengubah data kas'], 403);
}

$rtId = (int) $user['rt_id'];

// ── POST – add kas transaction ────────────────────────────────────────────

if ($method === 'POST') {
    $body       = json_decode(file_get_contents('php://input'), true) ?? [];
    $jenis      = in_array($body['jenis'] ?? '', ['pemasukan', 'pengeluaran'], true) ? $body['jenis'] : null;
    $kategori   = trim((string) ($body['kategori']  ?? 'Lainnya'));
    $jumlah     = (int) ($body['jumlah']    ?? 0);
    $keterangan = trim((string) ($body['keterangan'] ?? ''));
    $tanggal    = trim((string) ($body['tanggal']    ?? ''));

    if (!$jenis) {
        jsonResponse(['error' => 'Jenis (pemasukan/pengeluaran) wajib diisi'], 400);
    }
    if ($jumlah <= 0) {
        jsonResponse(['error' => 'Jumlah harus lebih dari 0'], 400);
    }
    if (!$tanggal || !strtotime($tanggal)) {
        jsonResponse(['error' => 'Tanggal tidak valid'], 400);
    }
    if ($kategori === '') {
        $kategori = 'Lainnya';
    }

    $stmt = $db->prepare("INSERT INTO kas_rt (rt_id, jenis, kategori, jumlah, keterangan, tanggal, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param('ississi', $rtId, $jenis, $kategori, $jumlah, $keterangan, $tanggal, $user['id']);
    if (!$stmt->execute()) {
        jsonResponse(['error' => 'Gagal menyimpan transaksi kas'], 500);
    }

    jsonResponse(['success' => true, 'id' => $db->insert_id], 201);
}

// ── PUT – edit kas transaction ────────────────────────────────────────────

if ($method === 'PUT') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int) ($_GET['id'] ?? $body['id'] ?? 0);
    if (!$id) {
        jsonResponse(['error' => 'ID diperlukan'], 400);
    }

    $stmt = $db->prepare("SELECT * FROM kas_rt WHERE id = ? AND rt_id = ? LIMIT 1");
    $stmt->bind_param('ii', $id, $rtId);
    $stmt->execute();
    $existing = $stmt->get_result()->fetch_assoc();
    if (!$existing) {
        jsonResponse(['error' => 'Transaksi tidak ditemukan atau bukan milik RT ini'], 404);
    }
    if ($existing['iuran_id'] !== null) {
        jsonResponse(['error' => 'Transaksi iuran tidak dapat diedit langsung. Edit melalui halaman Iuran Warga.'], 403);
    }

    $jenis      = in_array($body['jenis'] ?? '', ['pemasukan', 'pengeluaran'], true) ? $body['jenis'] : $existing['jenis'];
    $kategori   = isset($body['kategori'])   ? trim((string) $body['kategori'])   : $existing['kategori'];
    $jumlah     = isset($body['jumlah'])     ? (int) $body['jumlah']             : (int) $existing['jumlah'];
    $keterangan = array_key_exists('keterangan', $body) ? trim((string) $body['keterangan']) : $existing['keterangan'];
    $tanggal    = isset($body['tanggal'])    ? trim((string) $body['tanggal'])    : $existing['tanggal'];

    if ($jumlah <= 0) {
        jsonResponse(['error' => 'Jumlah harus lebih dari 0'], 400);
    }
    if (!$tanggal || !strtotime($tanggal)) {
        jsonResponse(['error' => 'Tanggal tidak valid'], 400);
    }
    if ($kategori === '') {
        $kategori = 'Lainnya';
    }

    $stmt = $db->prepare("UPDATE kas_rt SET jenis=?, kategori=?, jumlah=?, keterangan=?, tanggal=? WHERE id=?");
    $stmt->bind_param('ssissi', $jenis, $kategori, $jumlah, $keterangan, $tanggal, $id);
    if (!$stmt->execute()) {
        jsonResponse(['error' => 'Gagal memperbarui transaksi kas'], 500);
    }

    jsonResponse(['success' => true]);
}

// ── DELETE ────────────────────────────────────────────────────────────────

if ($method === 'DELETE') {
    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) {
        jsonResponse(['error' => 'ID diperlukan'], 400);
    }

    $stmt = $db->prepare("SELECT id, iuran_id FROM kas_rt WHERE id = ? AND rt_id = ? LIMIT 1");
    $stmt->bind_param('ii', $id, $rtId);
    $stmt->execute();
    $existing = $stmt->get_result()->fetch_assoc();
    if (!$existing) {
        jsonResponse(['error' => 'Transaksi tidak ditemukan atau bukan milik RT ini'], 404);
    }
    if ($existing['iuran_id'] !== null) {
        jsonResponse(['error' => 'Transaksi iuran tidak dapat dihapus langsung. Hapus melalui halaman Iuran Warga.'], 403);
    }

    $stmt = $db->prepare("DELETE FROM kas_rt WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();

    jsonResponse(['success' => true]);
}

jsonResponse(['error' => 'Method tidak didukung'], 405);
