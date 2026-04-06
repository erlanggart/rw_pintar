<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/account_helpers.php';

$user = authenticate();
authorize($user, ['superadmin']);

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

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $db->prepare("SELECT * FROM desa WHERE id = ?");
            $stmt->bind_param('i', $_GET['id']);
            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();
            if (!$result) jsonResponse(['error' => 'Desa tidak ditemukan'], 404);
            jsonResponse($result);
        }
        $result = $db->query("SELECT * FROM desa ORDER BY nama_desa ASC");
        $data = [];
        while ($row = $result->fetch_assoc()) $data[] = $row;
        jsonResponse($data);
        break;

    case 'POST':
        $input = getInput();
        $nama = normalizeUppercaseText($input['nama_desa'] ?? '');
        $kode = normalizeUppercaseText($input['kode_desa'] ?? '');
        $alamat = normalizeUppercaseText($input['alamat'] ?? '');
        $kecamatan = normalizeUppercaseText($input['kecamatan'] ?? '');
        $kabupaten = normalizeUppercaseText($input['kabupaten'] ?? '');
        $provinsi = normalizeUppercaseText($input['provinsi'] ?? '');

        if (empty($nama)) jsonResponse(['error' => 'Nama desa harus diisi'], 400);

        $db->begin_transaction();

        try {
            $stmt = $db->prepare("INSERT INTO desa (nama_desa, kode_desa, alamat, kecamatan, kabupaten, provinsi) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->bind_param('ssssss', $nama, $kode, $alamat, $kecamatan, $kabupaten, $provinsi);

            if (!$stmt->execute()) {
                throw new RuntimeException('Gagal menambahkan desa');
            }

            $desaId = $db->insert_id;
            $account = createLinkedUserAccount(
                $db,
                'desa',
                $desaId,
                buildDesaUsernameBase($nama),
                buildDesaDisplayName($nama)
            );

            $db->commit();

            jsonResponse([
                'message' => 'Desa berhasil ditambahkan',
                'id' => $desaId,
                'username' => $account['username'],
                'default_password' => $account['default_password'],
            ], 201);
        } catch (Throwable $exception) {
            $db->rollback();
            jsonResponse(['error' => $exception->getMessage()], 500);
        }
        break;

    case 'PUT':
        $input = getInput();
        $id = $input['id'] ?? 0;
        $nama = normalizeUppercaseText($input['nama_desa'] ?? '');
        $kode = normalizeUppercaseText($input['kode_desa'] ?? '');
        $alamat = normalizeUppercaseText($input['alamat'] ?? '');
        $kecamatan = normalizeUppercaseText($input['kecamatan'] ?? '');
        $kabupaten = normalizeUppercaseText($input['kabupaten'] ?? '');
        $provinsi = normalizeUppercaseText($input['provinsi'] ?? '');

        if (empty($id) || empty($nama)) jsonResponse(['error' => 'ID dan nama desa harus diisi'], 400);

        $db->begin_transaction();

        try {
            $stmt = $db->prepare("UPDATE desa SET nama_desa = ?, kode_desa = ?, alamat = ?, kecamatan = ?, kabupaten = ?, provinsi = ? WHERE id = ?");
            $stmt->bind_param('ssssssi', $nama, $kode, $alamat, $kecamatan, $kabupaten, $provinsi, $id);

            if (!$stmt->execute()) {
                throw new RuntimeException('Gagal mengupdate desa');
            }

            $account = syncLinkedUserAccount(
                $db,
                'desa',
                $id,
                buildDesaUsernameBase($nama),
                buildDesaDisplayName($nama)
            );

            $db->commit();

            jsonResponse([
                'message' => 'Desa berhasil diupdate',
                'username' => $account['username'],
            ]);
        } catch (Throwable $exception) {
            $db->rollback();
            jsonResponse(['error' => $exception->getMessage()], 500);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? 0;
        if (empty($id)) jsonResponse(['error' => 'ID desa harus diisi'], 400);

        $db->begin_transaction();

        try {
            $rwIds = [];
            $stmtRw = $db->prepare("SELECT id FROM rw WHERE desa_id = ?");
            $stmtRw->bind_param('i', $id);
            $stmtRw->execute();
            $rwResult = $stmtRw->get_result();
            while ($row = $rwResult->fetch_assoc()) {
                $rwIds[] = (int) $row['id'];
            }

            $rtIds = [];
            $stmtRt = $db->prepare("SELECT rt.id FROM rt JOIN rw ON rt.rw_id = rw.id WHERE rw.desa_id = ?");
            $stmtRt->bind_param('i', $id);
            $stmtRt->execute();
            $rtResult = $stmtRt->get_result();
            while ($row = $rtResult->fetch_assoc()) {
                $rtIds[] = (int) $row['id'];
            }

            deleteLinkedUsersByRoleIds($db, 'rt', $rtIds);
            deleteLinkedUsersByRoleIds($db, 'rw', $rwIds);
            deleteLinkedUsersByRoleIds($db, 'desa', [$id]);

            $stmt = $db->prepare("DELETE FROM desa WHERE id = ?");
            $stmt->bind_param('i', $id);

            if (!$stmt->execute()) {
                throw new RuntimeException('Gagal menghapus desa');
            }

            $db->commit();
            jsonResponse(['message' => 'Desa berhasil dihapus']);
        } catch (Throwable $exception) {
            $db->rollback();
            jsonResponse(['error' => $exception->getMessage()], 500);
        }
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
