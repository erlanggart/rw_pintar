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

function validateKepalaKeluargaConstraint(mysqli $db, $keluargaId, $hubunganKeluarga, $excludeId = 0) {
    if ($hubunganKeluarga !== 'Kepala Keluarga') {
        return;
    }

    if ($excludeId > 0) {
        $stmt = $db->prepare("SELECT id FROM penduduk WHERE keluarga_id = ? AND hubungan_keluarga = 'Kepala Keluarga' AND id != ? LIMIT 1");
        $stmt->bind_param('ii', $keluargaId, $excludeId);
    } else {
        $stmt = $db->prepare("SELECT id FROM penduduk WHERE keluarga_id = ? AND hubungan_keluarga = 'Kepala Keluarga' LIMIT 1");
        $stmt->bind_param('i', $keluargaId);
    }

    $stmt->execute();

    if ($stmt->get_result()->fetch_assoc()) {
        jsonResponse(['error' => 'Dalam satu KK hanya boleh ada satu Kepala Keluarga'], 409);
    }
}

function getPendudukByIdForUser(mysqli $db, $user, $pendudukId) {
    if ($user['role'] === 'rt') {
        $stmt = $db->prepare("SELECT p.*, k.no_kk, k.kepala_keluarga, k.rt_id, rt.rw_id, rt.nomor_rt, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE p.id = ? AND k.rt_id = ? LIMIT 1");
        $stmt->bind_param('ii', $pendudukId, $user['rt_id']);
    } elseif ($user['role'] === 'rw') {
        $stmt = $db->prepare("SELECT p.*, k.no_kk, k.kepala_keluarga, k.rt_id, rt.rw_id, rt.nomor_rt, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE p.id = ? AND rt.rw_id = ? LIMIT 1");
        $stmt->bind_param('ii', $pendudukId, $user['rw_id']);
    } elseif ($user['role'] === 'desa') {
        $stmt = $db->prepare("SELECT p.*, k.no_kk, k.kepala_keluarga, k.rt_id, rt.rw_id, rt.nomor_rt, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE p.id = ? AND rw.desa_id = ? LIMIT 1");
        $stmt->bind_param('ii', $pendudukId, $user['desa_id']);
    } else {
        $stmt = $db->prepare("SELECT p.*, k.no_kk, k.kepala_keluarga, k.rt_id, rt.rw_id, rt.nomor_rt, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE p.id = ? LIMIT 1");
        $stmt->bind_param('i', $pendudukId);
    }

    $stmt->execute();

    return $stmt->get_result()->fetch_assoc() ?: null;
}

function canManageKeluargaForPenduduk(mysqli $db, $user, $keluargaId) {
    if ($user['role'] === 'superadmin') {
        $stmt = $db->prepare("SELECT id FROM keluarga WHERE id = ? LIMIT 1");
        $stmt->bind_param('i', $keluargaId);
    } elseif ($user['role'] === 'desa') {
        $stmt = $db->prepare("SELECT k.id FROM keluarga k JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id WHERE k.id = ? AND rw.desa_id = ? LIMIT 1");
        $stmt->bind_param('ii', $keluargaId, $user['desa_id']);
    } elseif ($user['role'] === 'rw') {
        $stmt = $db->prepare("SELECT k.id FROM keluarga k JOIN rt ON k.rt_id = rt.id WHERE k.id = ? AND rt.rw_id = ? LIMIT 1");
        $stmt->bind_param('ii', $keluargaId, $user['rw_id']);
    } else {
        $stmt = $db->prepare("SELECT id FROM keluarga WHERE id = ? AND rt_id = ? LIMIT 1");
        $stmt->bind_param('ii', $keluargaId, $user['rt_id']);
    }

    $stmt->execute();

    return (bool) $stmt->get_result()->fetch_assoc();
}

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $result = getPendudukByIdForUser($db, $user, (int) $_GET['id']);
            if (!$result) jsonResponse(['error' => 'Data penduduk tidak ditemukan'], 404);
            jsonResponse($result);
        }

        $keluargaId = isset($_GET['keluarga_id']) ? (int) $_GET['keluarga_id'] : 0;
        $rtId = isset($_GET['rt_id']) ? (int) $_GET['rt_id'] : 0;
        $rwId = isset($_GET['rw_id']) ? (int) $_GET['rw_id'] : 0;
        $desaId = isset($_GET['desa_id']) ? (int) $_GET['desa_id'] : 0;
        if ($keluargaId > 0) {
            if ($user['role'] === 'rt') {
                $stmt = $db->prepare("SELECT p.*, k.no_kk, k.kepala_keluarga, k.rt_id, rt.rw_id, rt.nomor_rt, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE p.keluarga_id = ? AND k.rt_id = ? ORDER BY p.hubungan_keluarga ASC");
                $stmt->bind_param('ii', $keluargaId, $user['rt_id']);
            } elseif ($user['role'] === 'rw') {
                $stmt = $db->prepare("SELECT p.*, k.no_kk, k.kepala_keluarga, k.rt_id, rt.rw_id, rt.nomor_rt, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE p.keluarga_id = ? AND rt.rw_id = ? ORDER BY p.hubungan_keluarga ASC");
                $stmt->bind_param('ii', $keluargaId, $user['rw_id']);
            } elseif ($user['role'] === 'desa') {
                $stmt = $db->prepare("SELECT p.*, k.no_kk, k.kepala_keluarga, k.rt_id, rt.rw_id, rt.nomor_rt, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE p.keluarga_id = ? AND rw.desa_id = ? ORDER BY p.hubungan_keluarga ASC");
                $stmt->bind_param('ii', $keluargaId, $user['desa_id']);
            } else {
                $stmt = $db->prepare("SELECT p.*, k.no_kk, k.kepala_keluarga, k.rt_id, rt.rw_id, rt.nomor_rt, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE p.keluarga_id = ? ORDER BY p.hubungan_keluarga ASC");
                $stmt->bind_param('i', $keluargaId);
            }

            $stmt->execute();
            $result = $stmt->get_result();
        } elseif ($user['role'] === 'rt') {
            if ($rtId > 0) {
                $stmt = $db->prepare("SELECT p.*, k.no_kk, k.kepala_keluarga, k.rt_id, rt.rw_id, rt.nomor_rt, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE k.rt_id = ? AND k.rt_id = ? ORDER BY p.nama_lengkap ASC");
                $stmt->bind_param('ii', $rtId, $user['rt_id']);
            } else {
                $stmt = $db->prepare("SELECT p.*, k.no_kk, k.kepala_keluarga, k.rt_id, rt.rw_id, rt.nomor_rt, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE k.rt_id = ? ORDER BY p.nama_lengkap ASC");
                $stmt->bind_param('i', $user['rt_id']);
            }
            $stmt->execute();
            $result = $stmt->get_result();
        } elseif ($user['role'] === 'rw') {
            if ($rtId > 0) {
                $stmt = $db->prepare("SELECT p.*, k.no_kk, k.kepala_keluarga, k.rt_id, rt.rw_id, rt.nomor_rt, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE k.rt_id = ? AND rt.rw_id = ? ORDER BY p.nama_lengkap ASC");
                $stmt->bind_param('ii', $rtId, $user['rw_id']);
            } elseif ($rwId > 0) {
                $stmt = $db->prepare("SELECT p.*, k.no_kk, k.kepala_keluarga, k.rt_id, rt.rw_id, rt.nomor_rt, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE rt.rw_id = ? AND rt.rw_id = ? ORDER BY p.nama_lengkap ASC");
                $stmt->bind_param('ii', $rwId, $user['rw_id']);
            } else {
                $stmt = $db->prepare("SELECT p.*, k.no_kk, k.kepala_keluarga, k.rt_id, rt.rw_id, rt.nomor_rt, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE rt.rw_id = ? ORDER BY p.nama_lengkap ASC");
                $stmt->bind_param('i', $user['rw_id']);
            }
            $stmt->execute();
            $result = $stmt->get_result();
        } elseif ($user['role'] === 'desa') {
            if ($rtId > 0) {
                $stmt = $db->prepare("SELECT p.*, k.no_kk, k.kepala_keluarga, k.rt_id, rt.rw_id, rt.nomor_rt, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE k.rt_id = ? AND rw.desa_id = ? ORDER BY p.nama_lengkap ASC");
                $stmt->bind_param('ii', $rtId, $user['desa_id']);
            } elseif ($rwId > 0) {
                $stmt = $db->prepare("SELECT p.*, k.no_kk, k.kepala_keluarga, k.rt_id, rt.rw_id, rt.nomor_rt, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE rt.rw_id = ? AND rw.desa_id = ? ORDER BY p.nama_lengkap ASC");
                $stmt->bind_param('ii', $rwId, $user['desa_id']);
            } elseif ($desaId > 0) {
                $stmt = $db->prepare("SELECT p.*, k.no_kk, k.kepala_keluarga, k.rt_id, rt.rw_id, rt.nomor_rt, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE rw.desa_id = ? AND rw.desa_id = ? ORDER BY p.nama_lengkap ASC");
                $stmt->bind_param('ii', $desaId, $user['desa_id']);
            } else {
                $stmt = $db->prepare("SELECT p.*, k.no_kk, k.kepala_keluarga, k.rt_id, rt.rw_id, rt.nomor_rt, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE rw.desa_id = ? ORDER BY p.nama_lengkap ASC");
                $stmt->bind_param('i', $user['desa_id']);
            }
            $stmt->execute();
            $result = $stmt->get_result();
        } elseif ($rwId > 0) {
            $stmt = $db->prepare("SELECT p.*, k.no_kk, k.kepala_keluarga, k.rt_id, rt.rw_id, rt.nomor_rt, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE rt.rw_id = ? ORDER BY p.nama_lengkap ASC");
            $stmt->bind_param('i', $rwId);
            $stmt->execute();
            $result = $stmt->get_result();
        } elseif ($desaId > 0) {
            $stmt = $db->prepare("SELECT p.*, k.no_kk, k.kepala_keluarga, k.rt_id, rt.rw_id, rt.nomor_rt, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE rw.desa_id = ? ORDER BY p.nama_lengkap ASC");
            $stmt->bind_param('i', $desaId);
            $stmt->execute();
            $result = $stmt->get_result();
        } elseif ($rtId > 0) {
            $stmt = $db->prepare("SELECT p.*, k.no_kk, k.kepala_keluarga, k.rt_id, rt.rw_id, rt.nomor_rt, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE k.rt_id = ? ORDER BY p.nama_lengkap ASC");
            $stmt->bind_param('i', $rtId);
            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            $result = $db->query("SELECT p.*, k.no_kk, k.kepala_keluarga, k.rt_id, rt.rw_id, rt.nomor_rt, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM penduduk p JOIN keluarga k ON p.keluarga_id = k.id JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id ORDER BY p.nama_lengkap ASC");
        }

        $data = [];
        while ($row = $result->fetch_assoc()) $data[] = $row;
        jsonResponse($data);
        break;

    case 'POST':
        $input = getInput();
        $keluargaId = $input['keluarga_id'] ?? 0;
        $nik = $input['nik'] ?? '';
        $nama = $input['nama_lengkap'] ?? '';
        $tempatLahir = $input['tempat_lahir'] ?? '';
        $tanggalLahir = $input['tanggal_lahir'] ?? '';
        $jk = $input['jenis_kelamin'] ?? '';
        $golDarah = $input['golongan_darah'] ?? '-';
        $agama = $input['agama'] ?? '';
        $statusKawin = $input['status_perkawinan'] ?? 'Belum Kawin';
        $pekerjaan = normalizeUppercaseText($input['pekerjaan'] ?? '');
        $pendidikan = $input['pendidikan'] ?? 'Tidak Sekolah';
        $kewarganegaraan = $input['kewarganegaraan'] ?? 'WNI';
        $hubungan = $input['hubungan_keluarga'] ?? '';
        $telp = $input['no_telepon'] ?? '';
        $statusPenduduk = $input['status_penduduk'] ?? 'Tetap';

        $nama = normalizeUppercaseText($nama);
        $tempatLahir = normalizeUppercaseText($tempatLahir);

        if (empty($keluargaId) || empty($nik) || empty($nama) || empty($jk) || empty($agama) || empty($hubungan)) {
            jsonResponse(['error' => 'Data wajib harus diisi (keluarga_id, nik, nama, jenis_kelamin, agama, hubungan_keluarga)'], 400);
        }

        if (strlen($nik) !== 16 || !ctype_digit($nik)) {
            jsonResponse(['error' => 'NIK harus 16 digit angka'], 400);
        }

        if (!canManageKeluargaForPenduduk($db, $user, (int) $keluargaId)) {
            jsonResponse(['error' => 'Anda tidak dapat menambahkan penduduk pada keluarga tersebut'], 403);
        }

        validateKepalaKeluargaConstraint($db, (int) $keluargaId, $hubungan);

        $stmt = $db->prepare("INSERT INTO penduduk (keluarga_id, nik, nama_lengkap, tempat_lahir, tanggal_lahir, jenis_kelamin, golongan_darah, agama, status_perkawinan, pekerjaan, pendidikan, kewarganegaraan, hubungan_keluarga, no_telepon, status_penduduk) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param('issssssssssssss', $keluargaId, $nik, $nama, $tempatLahir, $tanggalLahir, $jk, $golDarah, $agama, $statusKawin, $pekerjaan, $pendidikan, $kewarganegaraan, $hubungan, $telp, $statusPenduduk);

        if ($stmt->execute()) {
            if ($hubungan === 'Kepala Keluarga') {
                $stmtSync = $db->prepare("UPDATE keluarga SET kepala_keluarga = ?, nik_kepala = ? WHERE id = ?");
                $stmtSync->bind_param('ssi', $nama, $nik, $keluargaId);
                $stmtSync->execute();
            }
            jsonResponse(['message' => 'Data penduduk berhasil ditambahkan', 'id' => $db->insert_id], 201);
        } else {
            if ($db->errno === 1062) {
                jsonResponse(['error' => 'NIK sudah terdaftar'], 409);
            }
            jsonResponse(['error' => 'Gagal menambahkan data penduduk'], 500);
        }
        break;

    case 'PUT':
        $input = getInput();
        $id = $input['id'] ?? 0;
        $keluargaId = $input['keluarga_id'] ?? 0;
        $nik = $input['nik'] ?? '';
        $nama = $input['nama_lengkap'] ?? '';
        $tempatLahir = $input['tempat_lahir'] ?? '';
        $tanggalLahir = $input['tanggal_lahir'] ?? '';
        $jk = $input['jenis_kelamin'] ?? '';
        $golDarah = $input['golongan_darah'] ?? '-';
        $agama = $input['agama'] ?? '';
        $statusKawin = $input['status_perkawinan'] ?? 'Belum Kawin';
        $pekerjaan = normalizeUppercaseText($input['pekerjaan'] ?? '');
        $pendidikan = $input['pendidikan'] ?? 'Tidak Sekolah';
        $kewarganegaraan = $input['kewarganegaraan'] ?? 'WNI';
        $hubungan = $input['hubungan_keluarga'] ?? '';
        $telp = $input['no_telepon'] ?? '';
        $statusPenduduk = $input['status_penduduk'] ?? 'Tetap';

        $nama = normalizeUppercaseText($nama);
        $tempatLahir = normalizeUppercaseText($tempatLahir);

        if (empty($id) || empty($nik) || empty($nama)) {
            jsonResponse(['error' => 'ID, NIK, dan Nama harus diisi'], 400);
        }

        $existingPenduduk = getPendudukByIdForUser($db, $user, (int) $id);
        if (!$existingPenduduk) {
            jsonResponse(['error' => 'Data penduduk tidak ditemukan'], 404);
        }

        if (empty($keluargaId) && !empty($id)) {
            $keluargaId = $existingPenduduk['keluarga_id'] ?? 0;
        }

        if (empty($keluargaId)) {
            jsonResponse(['error' => 'Keluarga ID tidak ditemukan untuk data penduduk ini'], 400);
        }

        if (!canManageKeluargaForPenduduk($db, $user, (int) $keluargaId)) {
            jsonResponse(['error' => 'Anda tidak dapat memindahkan penduduk ke keluarga tersebut'], 403);
        }

        if ($existingPenduduk['hubungan_keluarga'] === 'Kepala Keluarga' && $hubungan !== 'Kepala Keluarga') {
            jsonResponse(['error' => 'Status Kepala Keluarga hanya dapat diubah dari form KK'], 400);
        }

        validateKepalaKeluargaConstraint($db, (int) $keluargaId, $hubungan, (int) $id);

        $stmt = $db->prepare("UPDATE penduduk SET nik = ?, nama_lengkap = ?, tempat_lahir = ?, tanggal_lahir = ?, jenis_kelamin = ?, golongan_darah = ?, agama = ?, status_perkawinan = ?, pekerjaan = ?, pendidikan = ?, kewarganegaraan = ?, hubungan_keluarga = ?, no_telepon = ?, status_penduduk = ? WHERE id = ?");
        $stmt->bind_param('ssssssssssssssi', $nik, $nama, $tempatLahir, $tanggalLahir, $jk, $golDarah, $agama, $statusKawin, $pekerjaan, $pendidikan, $kewarganegaraan, $hubungan, $telp, $statusPenduduk, $id);

        if ($stmt->execute()) {
            if ($hubungan === 'Kepala Keluarga') {
                $stmtSync = $db->prepare("UPDATE keluarga SET kepala_keluarga = ?, nik_kepala = ? WHERE id = ?");
                $stmtSync->bind_param('ssi', $nama, $nik, $keluargaId);
                $stmtSync->execute();
            }
            jsonResponse(['message' => 'Data penduduk berhasil diupdate']);
        } else {
            jsonResponse(['error' => 'Gagal mengupdate data penduduk'], 500);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? 0;
        if (empty($id)) jsonResponse(['error' => 'ID penduduk harus diisi'], 400);

        $existingPenduduk = getPendudukByIdForUser($db, $user, (int) $id);
        if (!$existingPenduduk) {
            jsonResponse(['error' => 'Data penduduk tidak ditemukan'], 404);
        }

        if ($existingPenduduk['hubungan_keluarga'] === 'Kepala Keluarga') {
            jsonResponse(['error' => 'Kepala Keluarga dikelola dari form KK dan tidak dapat dihapus dari daftar anggota'], 400);
        }

        $stmt = $db->prepare("DELETE FROM penduduk WHERE id = ?");
        $stmt->bind_param('i', $id);

        if ($stmt->execute()) {
            jsonResponse(['message' => 'Data penduduk berhasil dihapus']);
        } else {
            jsonResponse(['error' => 'Gagal menghapus data penduduk'], 500);
        }
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
