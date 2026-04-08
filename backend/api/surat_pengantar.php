<?php
require_once __DIR__ . '/../config/database.php';

$user = authenticate();
authorize($user, ['superadmin', 'desa', 'rw', 'rt']);

$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

/**
 * Resolve the desa_id for the current authenticated user.
 */
function resolveDesaId(mysqli $db, array $user): int {
    if ($user['role'] === 'desa') {
        return (int) ($user['desa_id'] ?? 0);
    }

    if ($user['role'] === 'rw') {
        $stmt = $db->prepare("SELECT desa_id FROM rw WHERE id = ? LIMIT 1");
        $stmt->bind_param('i', $user['rw_id']);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        return (int) ($row['desa_id'] ?? 0);
    }

    if ($user['role'] === 'rt') {
        $stmt = $db->prepare("SELECT rw.desa_id FROM rt JOIN rw ON rt.rw_id = rw.id WHERE rt.id = ? LIMIT 1");
        $stmt->bind_param('i', $user['rt_id']);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        return (int) ($row['desa_id'] ?? 0);
    }

    // superadmin: resolve from query param or return 0
    return (int) ($_GET['desa_id'] ?? 0);
}

/**
 * Get the next register number for a given desa/month/year.
 */
function getNextRegisterNumber(mysqli $db, int $desaId, int $bulan, int $tahun): int {
    $stmt = $db->prepare("SELECT COALESCE(MAX(nomor_register), 0) + 1 AS next_register FROM surat_pengantar WHERE desa_id = ? AND bulan = ? AND tahun = ?");
    $stmt->bind_param('iii', $desaId, $bulan, $tahun);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    return (int) $row['next_register'];
}

switch ($method) {
    case 'GET':
        // GET ?action=next_nomor  → return next register number
        if (isset($_GET['action']) && $_GET['action'] === 'next_nomor') {
            $desaId = resolveDesaId($db, $user);
            if ($desaId <= 0) {
                jsonResponse(['error' => 'Desa tidak ditemukan untuk akun ini'], 400);
            }

            $bulan = (int) date('n');
            $tahun = (int) date('Y');
            $nextRegister = getNextRegisterNumber($db, $desaId, $bulan, $tahun);
            $nomorSurat = "500/{$nextRegister}/{$bulan}/{$tahun}";

            jsonResponse([
                'nomor_register' => $nextRegister,
                'bulan' => $bulan,
                'tahun' => $tahun,
                'nomor_surat' => $nomorSurat,
                'desa_id' => $desaId,
            ]);
        }

        // GET ?id=X  → single surat detail
        if (isset($_GET['id'])) {
            $suratId = (int) $_GET['id'];
            $desaId = resolveDesaId($db, $user);

            $query = "SELECT sp.*, p.nik, p.nama_lengkap, p.tempat_lahir, p.tanggal_lahir, p.jenis_kelamin, p.agama, p.status_perkawinan, p.pekerjaan, p.kewarganegaraan, p.hubungan_keluarga,
                             k.no_kk, k.alamat, k.kelurahan, k.kecamatan AS kecamatan_kk, k.kabupaten AS kabupaten_kk, k.provinsi AS provinsi_kk, k.rt_id,
                             rt.nomor_rt, rt.alamat_sekretariat, rw.nomor_rw, rw.desa_id,
                             d.nama_desa, d.kecamatan, d.kabupaten, d.provinsi,
                             rt.nama_ketua AS ketua_rt, rw.nama_ketua AS ketua_rw,
                             u.nama_lengkap AS created_by_name
                      FROM surat_pengantar sp
                      JOIN penduduk p ON sp.penduduk_id = p.id
                      JOIN keluarga k ON p.keluarga_id = k.id
                      JOIN rt ON k.rt_id = rt.id
                      JOIN rw ON rt.rw_id = rw.id
                      JOIN desa d ON rw.desa_id = d.id
                      JOIN users u ON sp.created_by = u.id
                      WHERE sp.id = ?";

            if ($user['role'] !== 'superadmin') {
                $query .= " AND sp.desa_id = ?";
                $stmt = $db->prepare($query);
                $stmt->bind_param('ii', $suratId, $desaId);
            } else {
                $stmt = $db->prepare($query);
                $stmt->bind_param('i', $suratId);
            }

            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();

            if (!$result) {
                jsonResponse(['error' => 'Surat pengantar tidak ditemukan'], 404);
            }

            jsonResponse($result);
        }

        // GET (list) → list surat pengantar
        $desaId = resolveDesaId($db, $user);

        $query = "SELECT sp.id, sp.nomor_surat, sp.keperluan, sp.created_at,
                         p.nama_lengkap, p.nik,
                         rt.nomor_rt, rw.nomor_rw,
                         u.nama_lengkap AS created_by_name
                  FROM surat_pengantar sp
                  JOIN penduduk p ON sp.penduduk_id = p.id
                  JOIN keluarga k ON p.keluarga_id = k.id
                  JOIN rt ON k.rt_id = rt.id
                  JOIN rw ON rt.rw_id = rw.id
                  JOIN users u ON sp.created_by = u.id
                  WHERE 1=1";
        $params = [];
        $types = '';

        if ($user['role'] === 'rt') {
            $query .= " AND k.rt_id = ?";
            $params[] = $user['rt_id'];
            $types .= 'i';
        } elseif ($user['role'] === 'rw') {
            $query .= " AND rt.rw_id = ?";
            $params[] = $user['rw_id'];
            $types .= 'i';
        } elseif ($user['role'] === 'desa') {
            $query .= " AND sp.desa_id = ?";
            $params[] = $desaId;
            $types .= 'i';
        } elseif ($user['role'] === 'superadmin' && $desaId > 0) {
            $query .= " AND sp.desa_id = ?";
            $params[] = $desaId;
            $types .= 'i';
        }

        $query .= " ORDER BY sp.created_at DESC";

        $stmt = $db->prepare($query);
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $result = $stmt->get_result();

        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }

        jsonResponse($data);
        break;

    case 'POST':
        $input = getInput();
        $pendudukId = (int) ($input['penduduk_id'] ?? 0);
        $keperluan = trim($input['keperluan'] ?? '');
        $keterangan = trim($input['keterangan'] ?? '');

        if ($pendudukId <= 0 || $keperluan === '') {
            jsonResponse(['error' => 'Penduduk dan keperluan harus diisi'], 400);
        }

        $desaId = resolveDesaId($db, $user);
        if ($desaId <= 0) {
            jsonResponse(['error' => 'Desa tidak ditemukan untuk akun ini'], 400);
        }

        // Verify the user can access this penduduk
        if ($user['role'] === 'rt') {
            $stmt = $db->prepare("SELECT p.id FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id WHERE p.id = ? AND k.rt_id = ? LIMIT 1");
            $stmt->bind_param('ii', $pendudukId, $user['rt_id']);
        } elseif ($user['role'] === 'rw') {
            $stmt = $db->prepare("SELECT p.id FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id JOIN rt ON k.rt_id = rt.id WHERE p.id = ? AND rt.rw_id = ? LIMIT 1");
            $stmt->bind_param('ii', $pendudukId, $user['rw_id']);
        } elseif ($user['role'] === 'desa') {
            $stmt = $db->prepare("SELECT p.id FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id WHERE p.id = ? AND rw.desa_id = ? LIMIT 1");
            $stmt->bind_param('ii', $pendudukId, $desaId);
        } else {
            $stmt = $db->prepare("SELECT p.id FROM penduduk p WHERE p.id = ? LIMIT 1");
            $stmt->bind_param('i', $pendudukId);
        }

        $stmt->execute();
        if (!$stmt->get_result()->fetch_assoc()) {
            jsonResponse(['error' => 'Data penduduk tidak ditemukan atau tidak dalam wilayah Anda'], 404);
        }

        $bulan = (int) date('n');
        $tahun = (int) date('Y');

        // Use a lock to prevent race conditions on register number
        $db->begin_transaction();
        try {
            $db->query("SELECT 1 FROM surat_pengantar WHERE desa_id = {$desaId} AND bulan = {$bulan} AND tahun = {$tahun} FOR UPDATE");

            $nextRegister = getNextRegisterNumber($db, $desaId, $bulan, $tahun);
            $nomorSurat = "500/{$nextRegister}/{$bulan}/{$tahun}";

            $stmt = $db->prepare("INSERT INTO surat_pengantar (desa_id, nomor_register, bulan, tahun, nomor_surat, penduduk_id, keperluan, keterangan, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param('iiiisissi',
                $desaId,
                $nextRegister,
                $bulan,
                $tahun,
                $nomorSurat,
                $pendudukId,
                $keperluan,
                $keterangan,
                $user['id']
            );

            if (!$stmt->execute()) {
                throw new Exception('Gagal menyimpan surat pengantar');
            }

            $suratId = $db->insert_id;
            $db->commit();

            jsonResponse([
                'message' => 'Surat pengantar berhasil dibuat',
                'id' => $suratId,
                'nomor_surat' => $nomorSurat,
            ], 201);
        } catch (Exception $e) {
            $db->rollback();
            jsonResponse(['error' => $e->getMessage()], 500);
        }
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
