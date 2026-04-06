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

function fetchKepalaKeluargaDetail(mysqli $db, $keluargaId) {
    $stmt = $db->prepare("SELECT jenis_kelamin, tempat_lahir, tanggal_lahir, agama, pekerjaan FROM penduduk WHERE keluarga_id = ? AND hubungan_keluarga = 'Kepala Keluarga' ORDER BY id ASC LIMIT 1");
    $stmt->bind_param('i', $keluargaId);
    $stmt->execute();

    return $stmt->get_result()->fetch_assoc() ?: null;
}

function syncKepalaKeluargaPenduduk(mysqli $db, $keluargaId, $payload, $excludeId = null) {
    $nikKepala = $payload['nik_kepala'];
    $kepala = $payload['kepala_keluarga'];
    $tempatLahir = $payload['kepala_tempat_lahir'];
    $tanggalLahir = $payload['kepala_tanggal_lahir'];
    $jenisKelamin = $payload['kepala_jenis_kelamin'];
    $agama = $payload['kepala_agama'];
    $pekerjaan = $payload['kepala_pekerjaan'];

    if ($excludeId) {
        $stmt = $db->prepare("SELECT id FROM penduduk WHERE nik = ? AND id != ? LIMIT 1");
        $stmt->bind_param('si', $nikKepala, $excludeId);
    } else {
        $stmt = $db->prepare("SELECT id FROM penduduk WHERE nik = ? LIMIT 1");
        $stmt->bind_param('s', $nikKepala);
    }

    $stmt->execute();
    if ($stmt->get_result()->fetch_assoc()) {
        jsonResponse(['error' => 'NIK Kepala Keluarga sudah terdaftar pada data penduduk lain'], 409);
    }

    $stmt = $db->prepare("SELECT id FROM penduduk WHERE keluarga_id = ? AND hubungan_keluarga = 'Kepala Keluarga' ORDER BY id ASC LIMIT 1");
    $stmt->bind_param('i', $keluargaId);
    $stmt->execute();
    $existing = $stmt->get_result()->fetch_assoc();

    if ($existing) {
        $stmt = $db->prepare("UPDATE penduduk SET nik = ?, nama_lengkap = ?, tempat_lahir = ?, tanggal_lahir = ?, jenis_kelamin = ?, agama = ?, pekerjaan = ?, hubungan_keluarga = 'Kepala Keluarga' WHERE id = ?");
        $stmt->bind_param('sssssssi', $nikKepala, $kepala, $tempatLahir, $tanggalLahir, $jenisKelamin, $agama, $pekerjaan, $existing['id']);
    } else {
        $stmt = $db->prepare("INSERT INTO penduduk (keluarga_id, nik, nama_lengkap, tempat_lahir, tanggal_lahir, jenis_kelamin, agama, pekerjaan, hubungan_keluarga) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Kepala Keluarga')");
        $stmt->bind_param('isssssss', $keluargaId, $nikKepala, $kepala, $tempatLahir, $tanggalLahir, $jenisKelamin, $agama, $pekerjaan);
    }

    if (!$stmt->execute()) {
        throw new RuntimeException('Gagal menyimpan data kepala keluarga');
    }
}

function getKeluargaByIdForUser(mysqli $db, $user, $keluargaId) {
    if ($user['role'] === 'rt') {
        $stmt = $db->prepare("SELECT k.*, rt.nomor_rt, rw.id as rw_id, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM keluarga k JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE k.id = ? AND k.rt_id = ? LIMIT 1");
        $stmt->bind_param('ii', $keluargaId, $user['rt_id']);
    } elseif ($user['role'] === 'rw') {
        $stmt = $db->prepare("SELECT k.*, rt.nomor_rt, rw.id as rw_id, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM keluarga k JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE k.id = ? AND rt.rw_id = ? LIMIT 1");
        $stmt->bind_param('ii', $keluargaId, $user['rw_id']);
    } elseif ($user['role'] === 'desa') {
        $stmt = $db->prepare("SELECT k.*, rt.nomor_rt, rw.id as rw_id, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM keluarga k JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE k.id = ? AND rw.desa_id = ? LIMIT 1");
        $stmt->bind_param('ii', $keluargaId, $user['desa_id']);
    } else {
        $stmt = $db->prepare("SELECT k.*, rt.nomor_rt, rw.id as rw_id, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM keluarga k JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE k.id = ? LIMIT 1");
        $stmt->bind_param('i', $keluargaId);
    }

    $stmt->execute();

    return $stmt->get_result()->fetch_assoc() ?: null;
}

function canManageRtForKeluarga(mysqli $db, $user, $rtId) {
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

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $result = getKeluargaByIdForUser($db, $user, (int) $_GET['id']);
            if (!$result) jsonResponse(['error' => 'Data keluarga tidak ditemukan'], 404);

            // Ambil anggota keluarga
            $stmt2 = $db->prepare("SELECT * FROM penduduk WHERE keluarga_id = ? ORDER BY hubungan_keluarga ASC");
            $stmt2->bind_param('i', $_GET['id']);
            $stmt2->execute();
            $anggota = [];
            $res2 = $stmt2->get_result();
            while ($row = $res2->fetch_assoc()) $anggota[] = $row;
            $result['anggota'] = $anggota;

            $kepalaDetail = fetchKepalaKeluargaDetail($db, (int) $_GET['id']);
            $result['kepala_jenis_kelamin'] = $kepalaDetail['jenis_kelamin'] ?? '';
            $result['kepala_tempat_lahir'] = $kepalaDetail['tempat_lahir'] ?? '';
            $result['kepala_tanggal_lahir'] = $kepalaDetail['tanggal_lahir'] ?? '';
            $result['kepala_agama'] = $kepalaDetail['agama'] ?? '';
            $result['kepala_pekerjaan'] = $kepalaDetail['pekerjaan'] ?? '';

            jsonResponse($result);
        }

        $rtId = isset($_GET['rt_id']) ? (int) $_GET['rt_id'] : 0;
        $rwId = isset($_GET['rw_id']) ? (int) $_GET['rw_id'] : 0;
        $desaId = isset($_GET['desa_id']) ? (int) $_GET['desa_id'] : 0;

        if ($user['role'] === 'rt') {
            if ($rtId > 0) {
                $stmt = $db->prepare("SELECT k.*, rt.nomor_rt, rw.id as rw_id, rw.nomor_rw, rw.desa_id, desa.nama_desa, (SELECT COUNT(*) FROM penduduk WHERE keluarga_id = k.id) as jumlah_anggota FROM keluarga k JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE k.rt_id = ? AND k.rt_id = ? ORDER BY k.kepala_keluarga ASC");
                $stmt->bind_param('ii', $rtId, $user['rt_id']);
            } else {
                $stmt = $db->prepare("SELECT k.*, rt.nomor_rt, rw.id as rw_id, rw.nomor_rw, rw.desa_id, desa.nama_desa, (SELECT COUNT(*) FROM penduduk WHERE keluarga_id = k.id) as jumlah_anggota FROM keluarga k JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE k.rt_id = ? ORDER BY k.kepala_keluarga ASC");
                $stmt->bind_param('i', $user['rt_id']);
            }

            $stmt->execute();
            $result = $stmt->get_result();
        } elseif ($user['role'] === 'rw') {
            if ($rtId > 0) {
                $stmt = $db->prepare("SELECT k.*, rt.nomor_rt, rw.id as rw_id, rw.nomor_rw, rw.desa_id, desa.nama_desa, (SELECT COUNT(*) FROM penduduk WHERE keluarga_id = k.id) as jumlah_anggota FROM keluarga k JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE k.rt_id = ? AND rt.rw_id = ? ORDER BY k.kepala_keluarga ASC");
                $stmt->bind_param('ii', $rtId, $user['rw_id']);
            } elseif ($rwId > 0) {
                $stmt = $db->prepare("SELECT k.*, rt.nomor_rt, rw.id as rw_id, rw.nomor_rw, rw.desa_id, desa.nama_desa, (SELECT COUNT(*) FROM penduduk WHERE keluarga_id = k.id) as jumlah_anggota FROM keluarga k JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE rt.rw_id = ? AND rt.rw_id = ? ORDER BY k.kepala_keluarga ASC");
                $stmt->bind_param('ii', $rwId, $user['rw_id']);
            } else {
                $stmt = $db->prepare("SELECT k.*, rt.nomor_rt, rw.id as rw_id, rw.nomor_rw, rw.desa_id, desa.nama_desa, (SELECT COUNT(*) FROM penduduk WHERE keluarga_id = k.id) as jumlah_anggota FROM keluarga k JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE rt.rw_id = ? ORDER BY k.kepala_keluarga ASC");
                $stmt->bind_param('i', $user['rw_id']);
            }

            $stmt->execute();
            $result = $stmt->get_result();
        } elseif ($user['role'] === 'desa') {
            if ($rtId > 0) {
                $stmt = $db->prepare("SELECT k.*, rt.nomor_rt, rw.id as rw_id, rw.nomor_rw, rw.desa_id, desa.nama_desa, (SELECT COUNT(*) FROM penduduk WHERE keluarga_id = k.id) as jumlah_anggota FROM keluarga k JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE k.rt_id = ? AND rw.desa_id = ? ORDER BY k.kepala_keluarga ASC");
                $stmt->bind_param('ii', $rtId, $user['desa_id']);
            } elseif ($rwId > 0) {
                $stmt = $db->prepare("SELECT k.*, rt.nomor_rt, rw.id as rw_id, rw.nomor_rw, rw.desa_id, desa.nama_desa, (SELECT COUNT(*) FROM penduduk WHERE keluarga_id = k.id) as jumlah_anggota FROM keluarga k JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE rt.rw_id = ? AND rw.desa_id = ? ORDER BY k.kepala_keluarga ASC");
                $stmt->bind_param('ii', $rwId, $user['desa_id']);
            } elseif ($desaId > 0) {
                $stmt = $db->prepare("SELECT k.*, rt.nomor_rt, rw.id as rw_id, rw.nomor_rw, rw.desa_id, desa.nama_desa, (SELECT COUNT(*) FROM penduduk WHERE keluarga_id = k.id) as jumlah_anggota FROM keluarga k JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE rw.desa_id = ? AND rw.desa_id = ? ORDER BY k.kepala_keluarga ASC");
                $stmt->bind_param('ii', $desaId, $user['desa_id']);
            } else {
                $stmt = $db->prepare("SELECT k.*, rt.nomor_rt, rw.id as rw_id, rw.nomor_rw, rw.desa_id, desa.nama_desa, (SELECT COUNT(*) FROM penduduk WHERE keluarga_id = k.id) as jumlah_anggota FROM keluarga k JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE rw.desa_id = ? ORDER BY k.kepala_keluarga ASC");
                $stmt->bind_param('i', $user['desa_id']);
            }

            $stmt->execute();
            $result = $stmt->get_result();
        } elseif ($rwId > 0) {
            $stmt = $db->prepare("SELECT k.*, rt.nomor_rt, rw.id as rw_id, rw.nomor_rw, rw.desa_id, desa.nama_desa, (SELECT COUNT(*) FROM penduduk WHERE keluarga_id = k.id) as jumlah_anggota FROM keluarga k JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE rt.rw_id = ? ORDER BY k.kepala_keluarga ASC");
            $stmt->bind_param('i', $rwId);
            $stmt->execute();
            $result = $stmt->get_result();
        } elseif ($desaId > 0) {
            $stmt = $db->prepare("SELECT k.*, rt.nomor_rt, rw.id as rw_id, rw.nomor_rw, rw.desa_id, desa.nama_desa, (SELECT COUNT(*) FROM penduduk WHERE keluarga_id = k.id) as jumlah_anggota FROM keluarga k JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE rw.desa_id = ? ORDER BY k.kepala_keluarga ASC");
            $stmt->bind_param('i', $desaId);
            $stmt->execute();
            $result = $stmt->get_result();
        } elseif ($rtId > 0) {
            $stmt = $db->prepare("SELECT k.*, rt.nomor_rt, rw.id as rw_id, rw.nomor_rw, rw.desa_id, desa.nama_desa, (SELECT COUNT(*) FROM penduduk WHERE keluarga_id = k.id) as jumlah_anggota FROM keluarga k JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE k.rt_id = ? ORDER BY k.kepala_keluarga ASC");
            $stmt->bind_param('i', $rtId);
            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            $result = $db->query("SELECT k.*, rt.nomor_rt, rw.id as rw_id, rw.nomor_rw, rw.desa_id, desa.nama_desa, (SELECT COUNT(*) FROM penduduk WHERE keluarga_id = k.id) as jumlah_anggota FROM keluarga k JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id ORDER BY k.kepala_keluarga ASC");
        }

        $data = [];
        while ($row = $result->fetch_assoc()) $data[] = $row;
        jsonResponse($data);
        break;

    case 'POST':
        $input = getInput();
        $rtId = ($user['role'] === 'rt') ? $user['rt_id'] : ($input['rt_id'] ?? 0);
        $noKk = $input['no_kk'] ?? '';
        $kepala = $input['kepala_keluarga'] ?? '';
        $nikKepala = $input['nik_kepala'] ?? '';
        $alamat = $input['alamat'] ?? '';
        $kelurahan = $input['kelurahan'] ?? '';
        $kecamatan = $input['kecamatan'] ?? '';
        $kabupaten = $input['kabupaten'] ?? '';
        $provinsi = $input['provinsi'] ?? '';
        $kodePos = $input['kode_pos'] ?? '';
        $statusKk = $input['status_kk'] ?? 'Menetap';
        $kepalaJenisKelamin = $input['kepala_jenis_kelamin'] ?? '';
        $kepalaTempatLahir = normalizeUppercaseText($input['kepala_tempat_lahir'] ?? '');
        $kepalaTanggalLahir = $input['kepala_tanggal_lahir'] ?? '';
        $kepalaAgama = $input['kepala_agama'] ?? '';
        $kepalaPekerjaan = normalizeUppercaseText($input['kepala_pekerjaan'] ?? '');

        $kepala = normalizeUppercaseText($kepala);
        $alamat = normalizeUppercaseText($alamat);
        $kelurahan = normalizeUppercaseText($kelurahan);
        $kecamatan = normalizeUppercaseText($kecamatan);
        $kabupaten = normalizeUppercaseText($kabupaten);
        $provinsi = normalizeUppercaseText($provinsi);

        if (empty($rtId) || empty($noKk) || empty($kepala) || empty($nikKepala) || empty($alamat)) {
            jsonResponse(['error' => 'RT ID, No KK, Kepala Keluarga, NIK Kepala, dan Alamat harus diisi'], 400);
        }

        if (!canManageRtForKeluarga($db, $user, (int) $rtId)) {
            jsonResponse(['error' => 'Anda tidak dapat menambahkan keluarga pada RT tersebut'], 403);
        }

        if (strlen($noKk) !== 16 || !ctype_digit($noKk)) {
            jsonResponse(['error' => 'No KK harus 16 digit angka'], 400);
        }

        if (strlen($nikKepala) !== 16 || !ctype_digit($nikKepala)) {
            jsonResponse(['error' => 'NIK Kepala Keluarga harus 16 digit angka'], 400);
        }

        if (empty($kepalaJenisKelamin) || empty($kepalaTempatLahir) || empty($kepalaTanggalLahir) || empty($kepalaAgama) || empty($kepalaPekerjaan)) {
            jsonResponse(['error' => 'Data kepala keluarga harus lengkap: jenis kelamin, tempat lahir, tanggal lahir, agama, dan pekerjaan'], 400);
        }

        if (!in_array($statusKk, ['Menetap', 'Tidak Menetap'])) {
            jsonResponse(['error' => 'Status KK tidak valid'], 400);
        }

        $db->begin_transaction();

        try {
            $stmt = $db->prepare("INSERT INTO keluarga (rt_id, no_kk, kepala_keluarga, nik_kepala, alamat, kelurahan, kecamatan, kabupaten, provinsi, kode_pos, status_kk) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param('issssssssss', $rtId, $noKk, $kepala, $nikKepala, $alamat, $kelurahan, $kecamatan, $kabupaten, $provinsi, $kodePos, $statusKk);

            if (!$stmt->execute()) {
                if ($db->errno === 1062) {
                    jsonResponse(['error' => 'No KK sudah terdaftar'], 409);
                }
                throw new RuntimeException('Gagal menambahkan data keluarga');
            }

            $keluargaId = $db->insert_id;
            syncKepalaKeluargaPenduduk($db, $keluargaId, [
                'nik_kepala' => $nikKepala,
                'kepala_keluarga' => $kepala,
                'kepala_tempat_lahir' => $kepalaTempatLahir,
                'kepala_tanggal_lahir' => $kepalaTanggalLahir,
                'kepala_jenis_kelamin' => $kepalaJenisKelamin,
                'kepala_agama' => $kepalaAgama,
                'kepala_pekerjaan' => $kepalaPekerjaan,
            ]);

            $db->commit();
            jsonResponse(['message' => 'Data keluarga berhasil ditambahkan', 'id' => $keluargaId], 201);
        } catch (Throwable $exception) {
            $db->rollback();
            jsonResponse(['error' => $exception->getMessage()], 500);
        }
        break;

    case 'PUT':
        $input = getInput();
        $id = $input['id'] ?? 0;
        $existingKeluarga = getKeluargaByIdForUser($db, $user, (int) $id);
        if (!$existingKeluarga) {
            jsonResponse(['error' => 'Data keluarga tidak ditemukan'], 404);
        }

        $rtId = ($user['role'] === 'rt')
            ? $user['rt_id']
            : (int) ($input['rt_id'] ?? $existingKeluarga['rt_id'] ?? 0);
        $noKk = $input['no_kk'] ?? '';
        $kepala = $input['kepala_keluarga'] ?? '';
        $nikKepala = $input['nik_kepala'] ?? '';
        $alamat = $input['alamat'] ?? '';
        $kelurahan = $input['kelurahan'] ?? '';
        $kecamatan = $input['kecamatan'] ?? '';
        $kabupaten = $input['kabupaten'] ?? '';
        $provinsi = $input['provinsi'] ?? '';
        $kodePos = $input['kode_pos'] ?? '';
        $statusKk = $input['status_kk'] ?? 'Menetap';
        $kepalaJenisKelamin = $input['kepala_jenis_kelamin'] ?? '';
        $kepalaTempatLahir = normalizeUppercaseText($input['kepala_tempat_lahir'] ?? '');
        $kepalaTanggalLahir = $input['kepala_tanggal_lahir'] ?? '';
        $kepalaAgama = $input['kepala_agama'] ?? '';
        $kepalaPekerjaan = normalizeUppercaseText($input['kepala_pekerjaan'] ?? '');

        $kepala = normalizeUppercaseText($kepala);
        $alamat = normalizeUppercaseText($alamat);
        $kelurahan = normalizeUppercaseText($kelurahan);
        $kecamatan = normalizeUppercaseText($kecamatan);
        $kabupaten = normalizeUppercaseText($kabupaten);
        $provinsi = normalizeUppercaseText($provinsi);

        if (empty($id) || empty($noKk) || empty($kepala) || empty($nikKepala) || empty($alamat)) {
            jsonResponse(['error' => 'ID, No KK, Kepala Keluarga, NIK Kepala, dan Alamat harus diisi'], 400);
        }

        if (empty($rtId) || !canManageRtForKeluarga($db, $user, (int) $rtId)) {
            jsonResponse(['error' => 'Anda tidak dapat mengubah keluarga ke RT tersebut'], 403);
        }

        if (strlen($nikKepala) !== 16 || !ctype_digit($nikKepala)) {
            jsonResponse(['error' => 'NIK Kepala Keluarga harus 16 digit angka'], 400);
        }

        if (empty($kepalaJenisKelamin) || empty($kepalaTempatLahir) || empty($kepalaTanggalLahir) || empty($kepalaAgama) || empty($kepalaPekerjaan)) {
            jsonResponse(['error' => 'Data kepala keluarga harus lengkap: jenis kelamin, tempat lahir, tanggal lahir, agama, dan pekerjaan'], 400);
        }

        if (!in_array($statusKk, ['Menetap', 'Tidak Menetap'])) {
            jsonResponse(['error' => 'Status KK tidak valid'], 400);
        }

        $db->begin_transaction();

        try {
            $stmt = $db->prepare("UPDATE keluarga SET rt_id = ?, no_kk = ?, kepala_keluarga = ?, nik_kepala = ?, alamat = ?, kelurahan = ?, kecamatan = ?, kabupaten = ?, provinsi = ?, kode_pos = ?, status_kk = ? WHERE id = ?");
            $stmt->bind_param('issssssssssi', $rtId, $noKk, $kepala, $nikKepala, $alamat, $kelurahan, $kecamatan, $kabupaten, $provinsi, $kodePos, $statusKk, $id);

            if (!$stmt->execute()) {
                throw new RuntimeException('Gagal mengupdate data keluarga');
            }

            syncKepalaKeluargaPenduduk($db, (int) $id, [
                'nik_kepala' => $nikKepala,
                'kepala_keluarga' => $kepala,
                'kepala_tempat_lahir' => $kepalaTempatLahir,
                'kepala_tanggal_lahir' => $kepalaTanggalLahir,
                'kepala_jenis_kelamin' => $kepalaJenisKelamin,
                'kepala_agama' => $kepalaAgama,
                'kepala_pekerjaan' => $kepalaPekerjaan,
            ]);

            $db->commit();
            jsonResponse(['message' => 'Data keluarga berhasil diupdate']);
        } catch (Throwable $exception) {
            $db->rollback();
            jsonResponse(['error' => $exception->getMessage()], 500);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? 0;
        if (empty($id)) jsonResponse(['error' => 'ID keluarga harus diisi'], 400);

        $existingKeluarga = getKeluargaByIdForUser($db, $user, (int) $id);
        if (!$existingKeluarga) {
            jsonResponse(['error' => 'Data keluarga tidak ditemukan'], 404);
        }

        $stmt = $db->prepare("DELETE FROM keluarga WHERE id = ?");
        $stmt->bind_param('i', $id);

        if ($stmt->execute()) {
            jsonResponse(['message' => 'Data keluarga berhasil dihapus']);
        } else {
            jsonResponse(['error' => 'Gagal menghapus data keluarga'], 500);
        }
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
