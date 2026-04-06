<?php
require_once __DIR__ . '/../config/database.php';

$user = authenticate();
authorize($user, ['superadmin', 'desa', 'rw', 'rt']);

$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

function normalizeUppercaseText($value) {
    $value = trim((string) $value);

    if ($value === '') {
        return '';
    }

    if (function_exists('mb_strtoupper')) {
        return mb_strtoupper($value, 'UTF-8');
    }

    return strtoupper($value);
}

function normalizeUppercaseNullableText($value) {
    $value = normalizeUppercaseText($value);

    return $value === '' ? null : $value;
}

function canManageRtForAktivitas(mysqli $db, $user, $rtId) {
    if ($user['role'] === 'superadmin') {
        $stmt = $db->prepare("SELECT id FROM rt WHERE id = ? LIMIT 1");
        $stmt->bind_param('i', $rtId);
    } elseif ($user['role'] === 'desa') {
        $stmt = $db->prepare("SELECT rt.id FROM rt JOIN rw ON rt.rw_id = rw.id WHERE rt.id = ? AND rw.desa_id = ? LIMIT 1");
        $stmt->bind_param('ii', $rtId, $user['desa_id']);
    } elseif ($user['role'] === 'rw') {
        $stmt = $db->prepare("SELECT id FROM rt WHERE id = ? AND rw_id = ? LIMIT 1");
        $stmt->bind_param('ii', $rtId, $user['rw_id']);
    } else {
        return (int) $rtId === (int) $user['rt_id'];
    }

    $stmt->execute();

    return (bool) $stmt->get_result()->fetch_assoc();
}

function getKeluargaByIdForAktivitas(mysqli $db, $user, $keluargaId) {
    if ($user['role'] === 'rt') {
        $stmt = $db->prepare("SELECT k.id, k.rt_id, k.no_kk, k.kepala_keluarga FROM keluarga k WHERE k.id = ? AND k.rt_id = ? LIMIT 1");
        $stmt->bind_param('ii', $keluargaId, $user['rt_id']);
    } elseif ($user['role'] === 'rw') {
        $stmt = $db->prepare("SELECT k.id, k.rt_id, k.no_kk, k.kepala_keluarga FROM keluarga k JOIN rt ON k.rt_id = rt.id WHERE k.id = ? AND rt.rw_id = ? LIMIT 1");
        $stmt->bind_param('ii', $keluargaId, $user['rw_id']);
    } elseif ($user['role'] === 'desa') {
        $stmt = $db->prepare("SELECT k.id, k.rt_id, k.no_kk, k.kepala_keluarga FROM keluarga k JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id WHERE k.id = ? AND rw.desa_id = ? LIMIT 1");
        $stmt->bind_param('ii', $keluargaId, $user['desa_id']);
    } else {
        $stmt = $db->prepare("SELECT k.id, k.rt_id, k.no_kk, k.kepala_keluarga FROM keluarga k WHERE k.id = ? LIMIT 1");
        $stmt->bind_param('i', $keluargaId);
    }

    $stmt->execute();

    return $stmt->get_result()->fetch_assoc() ?: null;
}

function getPendudukByIdForAktivitas(mysqli $db, $user, $pendudukId) {
    if ($user['role'] === 'rt') {
        $stmt = $db->prepare("SELECT p.id, p.keluarga_id, p.nama_lengkap, p.nik, k.rt_id FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id WHERE p.id = ? AND k.rt_id = ? LIMIT 1");
        $stmt->bind_param('ii', $pendudukId, $user['rt_id']);
    } elseif ($user['role'] === 'rw') {
        $stmt = $db->prepare("SELECT p.id, p.keluarga_id, p.nama_lengkap, p.nik, k.rt_id FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id JOIN rt ON k.rt_id = rt.id WHERE p.id = ? AND rt.rw_id = ? LIMIT 1");
        $stmt->bind_param('ii', $pendudukId, $user['rw_id']);
    } elseif ($user['role'] === 'desa') {
        $stmt = $db->prepare("SELECT p.id, p.keluarga_id, p.nama_lengkap, p.nik, k.rt_id FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id WHERE p.id = ? AND rw.desa_id = ? LIMIT 1");
        $stmt->bind_param('ii', $pendudukId, $user['desa_id']);
    } else {
        $stmt = $db->prepare("SELECT p.id, p.keluarga_id, p.nama_lengkap, p.nik, k.rt_id FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id WHERE p.id = ? LIMIT 1");
        $stmt->bind_param('i', $pendudukId);
    }

    $stmt->execute();

    return $stmt->get_result()->fetch_assoc() ?: null;
}

function getAktivitasByIdForUser(mysqli $db, $user, $aktivitasId) {
    if ($user['role'] === 'rt') {
        $stmt = $db->prepare("SELECT a.*, p.nama_lengkap as nama_penduduk, p.nik, k.no_kk, k.kepala_keluarga, rt.nomor_rt, rw.id as rw_id, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM aktivitas_penduduk a LEFT JOIN penduduk p ON a.penduduk_id = p.id LEFT JOIN keluarga k ON a.keluarga_id = k.id JOIN rt ON a.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE a.id = ? AND a.rt_id = ? LIMIT 1");
        $stmt->bind_param('ii', $aktivitasId, $user['rt_id']);
    } elseif ($user['role'] === 'rw') {
        $stmt = $db->prepare("SELECT a.*, p.nama_lengkap as nama_penduduk, p.nik, k.no_kk, k.kepala_keluarga, rt.nomor_rt, rw.id as rw_id, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM aktivitas_penduduk a LEFT JOIN penduduk p ON a.penduduk_id = p.id LEFT JOIN keluarga k ON a.keluarga_id = k.id JOIN rt ON a.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE a.id = ? AND rt.rw_id = ? LIMIT 1");
        $stmt->bind_param('ii', $aktivitasId, $user['rw_id']);
    } elseif ($user['role'] === 'desa') {
        $stmt = $db->prepare("SELECT a.*, p.nama_lengkap as nama_penduduk, p.nik, k.no_kk, k.kepala_keluarga, rt.nomor_rt, rw.id as rw_id, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM aktivitas_penduduk a LEFT JOIN penduduk p ON a.penduduk_id = p.id LEFT JOIN keluarga k ON a.keluarga_id = k.id JOIN rt ON a.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE a.id = ? AND rw.desa_id = ? LIMIT 1");
        $stmt->bind_param('ii', $aktivitasId, $user['desa_id']);
    } else {
        $stmt = $db->prepare("SELECT a.*, p.nama_lengkap as nama_penduduk, p.nik, k.no_kk, k.kepala_keluarga, rt.nomor_rt, rw.id as rw_id, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM aktivitas_penduduk a LEFT JOIN penduduk p ON a.penduduk_id = p.id LEFT JOIN keluarga k ON a.keluarga_id = k.id JOIN rt ON a.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE a.id = ? LIMIT 1");
        $stmt->bind_param('i', $aktivitasId);
    }

    $stmt->execute();

    return $stmt->get_result()->fetch_assoc() ?: null;
}

function getAktivitasListForUser(mysqli $db, $user, $rtId = 0, $rwId = 0, $desaId = 0, $jenis = '') {
    $sql = "SELECT a.*, p.nama_lengkap as nama_penduduk, p.nik, k.no_kk, k.kepala_keluarga, rt.nomor_rt, rw.id as rw_id, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM aktivitas_penduduk a LEFT JOIN penduduk p ON a.penduduk_id = p.id LEFT JOIN keluarga k ON a.keluarga_id = k.id JOIN rt ON a.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE 1=1";
    $types = '';
    $params = [];

    if ($user['role'] === 'rt') {
        $sql .= " AND a.rt_id = ?";
        $types .= 'i';
        $params[] = (int) $user['rt_id'];
    } elseif ($user['role'] === 'rw') {
        $sql .= " AND rt.rw_id = ?";
        $types .= 'i';
        $params[] = (int) $user['rw_id'];
    } elseif ($user['role'] === 'desa') {
        $sql .= " AND rw.desa_id = ?";
        $types .= 'i';
        $params[] = (int) $user['desa_id'];
    }

    if ($rtId > 0) {
        $sql .= " AND a.rt_id = ?";
        $types .= 'i';
        $params[] = $rtId;
    }

    if ($rwId > 0) {
        $sql .= " AND rt.rw_id = ?";
        $types .= 'i';
        $params[] = $rwId;
    }

    if ($desaId > 0) {
        $sql .= " AND rw.desa_id = ?";
        $types .= 'i';
        $params[] = $desaId;
    }

    if ($jenis !== '') {
        $sql .= " AND a.jenis_aktivitas = ?";
        $types .= 's';
        $params[] = $jenis;
    }

    $sql .= " ORDER BY a.tanggal_aktivitas DESC, a.id DESC";

    $stmt = $db->prepare($sql);
    if ($types !== '') {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();

    return $stmt->get_result();
}

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $result = getAktivitasByIdForUser($db, $user, (int) $_GET['id']);
            if (!$result) jsonResponse(['error' => 'Data aktivitas tidak ditemukan'], 404);
            jsonResponse($result);
        }

        $rtId = isset($_GET['rt_id']) ? (int) $_GET['rt_id'] : 0;
        $rwId = isset($_GET['rw_id']) ? (int) $_GET['rw_id'] : 0;
        $desaId = isset($_GET['desa_id']) ? (int) $_GET['desa_id'] : 0;
        $jenis = trim((string) ($_GET['jenis'] ?? ''));
        $result = getAktivitasListForUser($db, $user, $rtId, $rwId, $desaId, $jenis);

        $data = [];
        while ($row = $result->fetch_assoc()) $data[] = $row;
        jsonResponse($data);
        break;

    case 'POST':
        $input = getInput();
        $rtId = ($user['role'] === 'rt') ? (int) $user['rt_id'] : (int) ($input['rt_id'] ?? 0);
        $pendudukId = !empty($input['penduduk_id']) ? (int) $input['penduduk_id'] : null;
        $keluargaId = !empty($input['keluarga_id']) ? (int) $input['keluarga_id'] : null;
        $jenis = $input['jenis_aktivitas'] ?? '';
        $tanggal = $input['tanggal_aktivitas'] ?? '';
        $keterangan = normalizeUppercaseText($input['keterangan'] ?? '');
        $namaBayi = normalizeUppercaseNullableText($input['nama_bayi'] ?? null);
        $jkBayi = $input['jenis_kelamin_bayi'] ?? null;
        $penyebabKematian = normalizeUppercaseNullableText($input['penyebab_kematian'] ?? null);
        $alamatTujuan = normalizeUppercaseNullableText($input['alamat_tujuan'] ?? null);
        $alasanPindah = normalizeUppercaseNullableText($input['alasan_pindah'] ?? null);
        $alamatAsal = normalizeUppercaseNullableText($input['alamat_asal'] ?? null);

        $keluarga = $keluargaId ? getKeluargaByIdForAktivitas($db, $user, $keluargaId) : null;
        if ($keluargaId && !$keluarga) {
            jsonResponse(['error' => 'Data keluarga tidak ditemukan'], 404);
        }

        $penduduk = $pendudukId ? getPendudukByIdForAktivitas($db, $user, $pendudukId) : null;
        if ($pendudukId && !$penduduk) {
            jsonResponse(['error' => 'Data penduduk tidak ditemukan'], 404);
        }

        if (!$keluarga && $penduduk) {
            $keluarga = getKeluargaByIdForAktivitas($db, $user, (int) $penduduk['keluarga_id']);
            $keluargaId = $keluarga ? (int) $keluarga['id'] : null;
        }

        if ($rtId <= 0) {
            if ($penduduk) {
                $rtId = (int) $penduduk['rt_id'];
            } elseif ($keluarga) {
                $rtId = (int) $keluarga['rt_id'];
            }
        }

        if (empty($rtId) || empty($jenis) || empty($tanggal)) {
            jsonResponse(['error' => 'RT ID, jenis aktivitas, dan tanggal harus diisi'], 400);
        }

        if (!canManageRtForAktivitas($db, $user, $rtId)) {
            jsonResponse(['error' => 'Anda tidak dapat mencatat aktivitas pada RT tersebut'], 403);
        }

        $allowedJenis = ['Lahir', 'Mati', 'Pindah', 'Datang'];
        if (!in_array($jenis, $allowedJenis)) {
            jsonResponse(['error' => 'Jenis aktivitas tidak valid'], 400);
        }

        if ($keluarga && (int) $keluarga['rt_id'] !== $rtId) {
            jsonResponse(['error' => 'Keluarga yang dipilih tidak berada pada RT tersebut'], 400);
        }

        if ($penduduk && (int) $penduduk['rt_id'] !== $rtId) {
            jsonResponse(['error' => 'Penduduk yang dipilih tidak berada pada RT tersebut'], 400);
        }

        if ($penduduk && $keluarga && (int) $penduduk['keluarga_id'] !== (int) $keluarga['id']) {
            jsonResponse(['error' => 'Penduduk yang dipilih tidak terhubung dengan keluarga tersebut'], 400);
        }

        $stmt = $db->prepare("INSERT INTO aktivitas_penduduk (penduduk_id, keluarga_id, rt_id, jenis_aktivitas, tanggal_aktivitas, keterangan, nama_bayi, jenis_kelamin_bayi, penyebab_kematian, alamat_tujuan, alasan_pindah, alamat_asal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $stmt->bind_param('iiisssssssss', $pendudukId, $keluargaId, $rtId, $jenis, $tanggal, $keterangan, $namaBayi, $jkBayi, $penyebabKematian, $alamatTujuan, $alasanPindah, $alamatAsal);

        if ($stmt->execute()) {
            jsonResponse(['message' => 'Aktivitas berhasil dicatat', 'id' => $db->insert_id], 201);
        } else {
            jsonResponse(['error' => 'Gagal mencatat aktivitas: ' . $db->error], 500);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? 0;
        if (empty($id)) jsonResponse(['error' => 'ID aktivitas harus diisi'], 400);

        $existingAktivitas = getAktivitasByIdForUser($db, $user, (int) $id);
        if (!$existingAktivitas) {
            jsonResponse(['error' => 'Data aktivitas tidak ditemukan'], 404);
        }

        $stmt = $db->prepare("DELETE FROM aktivitas_penduduk WHERE id = ?");
        $stmt->bind_param('i', $id);

        if ($stmt->execute()) {
            jsonResponse(['message' => 'Aktivitas berhasil dihapus']);
        } else {
            jsonResponse(['error' => 'Gagal menghapus aktivitas'], 500);
        }
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
