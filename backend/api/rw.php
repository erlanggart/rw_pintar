<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/account_helpers.php';

$user = authenticate();
authorize($user, ['superadmin', 'desa']);

$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

function getRwByIdForUser(mysqli $db, $user, $rwId) {
    if ($user['role'] === 'desa') {
        $stmt = $db->prepare("SELECT rw.*, desa.nama_desa FROM rw JOIN desa ON rw.desa_id = desa.id WHERE rw.id = ? AND rw.desa_id = ? LIMIT 1");
        $stmt->bind_param('ii', $rwId, $user['desa_id']);
    } else {
        $stmt = $db->prepare("SELECT rw.*, desa.nama_desa FROM rw JOIN desa ON rw.desa_id = desa.id WHERE rw.id = ? LIMIT 1");
        $stmt->bind_param('i', $rwId);
    }

    $stmt->execute();

    return $stmt->get_result()->fetch_assoc() ?: null;
}

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $result = getRwByIdForUser($db, $user, (int) $_GET['id']);
            if (!$result) jsonResponse(['error' => 'RW tidak ditemukan'], 404);
            jsonResponse($result);
        }

        if ($user['role'] === 'desa') {
            $stmt = $db->prepare("SELECT rw.*, desa.nama_desa FROM rw JOIN desa ON rw.desa_id = desa.id WHERE rw.desa_id = ? ORDER BY rw.nomor_rw ASC");
            $stmt->bind_param('i', $user['desa_id']);
            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            $desaId = $_GET['desa_id'] ?? null;
            if ($desaId) {
                $stmt = $db->prepare("SELECT rw.*, desa.nama_desa FROM rw JOIN desa ON rw.desa_id = desa.id WHERE rw.desa_id = ? ORDER BY rw.nomor_rw ASC");
                $stmt->bind_param('i', $desaId);
                $stmt->execute();
                $result = $stmt->get_result();
            } else {
                $result = $db->query("SELECT rw.*, desa.nama_desa FROM rw JOIN desa ON rw.desa_id = desa.id ORDER BY desa.nama_desa, rw.nomor_rw ASC");
            }
        }

        $data = [];
        while ($row = $result->fetch_assoc()) $data[] = $row;
        jsonResponse($data);
        break;

    case 'POST':
        $input = getInput();
        $desaId = ($user['role'] === 'desa') ? $user['desa_id'] : ($input['desa_id'] ?? 0);
        $nomor = $input['nomor_rw'] ?? '';
        $ketua = $input['nama_ketua'] ?? '';

        if (empty($desaId) || empty($nomor)) {
            jsonResponse(['error' => 'Desa ID dan nomor RW harus diisi'], 400);
        }

        $db->begin_transaction();

        try {
            $stmt = $db->prepare("INSERT INTO rw (desa_id, nomor_rw, nama_ketua) VALUES (?, ?, ?)");
            $stmt->bind_param('iss', $desaId, $nomor, $ketua);

            if (!$stmt->execute()) {
                throw new RuntimeException('Gagal menambahkan RW');
            }

            $rwId = $db->insert_id;
            $account = createLinkedUserAccount(
                $db,
                'rw',
                $rwId,
                buildRwUsernameBase($nomor, $desaId),
                buildRwDisplayName($nomor)
            );

            $db->commit();

            jsonResponse([
                'message' => 'RW berhasil ditambahkan',
                'id' => $rwId,
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
        $desaId = ($user['role'] === 'desa') ? $user['desa_id'] : ($input['desa_id'] ?? 0);
        $nomor = $input['nomor_rw'] ?? '';
        $ketua = $input['nama_ketua'] ?? '';

        if (empty($id) || empty($desaId) || empty($nomor)) jsonResponse(['error' => 'ID, desa, dan nomor RW harus diisi'], 400);

        $existingRw = getRwByIdForUser($db, $user, (int) $id);
        if (!$existingRw) jsonResponse(['error' => 'RW tidak ditemukan'], 404);

        $db->begin_transaction();

        try {
            $stmt = $db->prepare("UPDATE rw SET desa_id = ?, nomor_rw = ?, nama_ketua = ? WHERE id = ?");
            $stmt->bind_param('issi', $desaId, $nomor, $ketua, $id);

            if (!$stmt->execute()) {
                throw new RuntimeException('Gagal mengupdate RW');
            }

            $account = syncLinkedUserAccount(
                $db,
                'rw',
                (int) $id,
                buildRwUsernameBase($nomor, $desaId),
                buildRwDisplayName($nomor)
            );

            $db->commit();

            jsonResponse([
                'message' => 'RW berhasil diupdate',
                'username' => $account['username'],
            ]);
        } catch (Throwable $exception) {
            $db->rollback();
            jsonResponse(['error' => $exception->getMessage()], 500);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? 0;
        if (empty($id)) jsonResponse(['error' => 'ID RW harus diisi'], 400);

        $existingRw = getRwByIdForUser($db, $user, (int) $id);
        if (!$existingRw) jsonResponse(['error' => 'RW tidak ditemukan'], 404);

        $db->begin_transaction();

        try {
            $rtIds = [];
            $stmtRt = $db->prepare("SELECT id FROM rt WHERE rw_id = ?");
            $stmtRt->bind_param('i', $id);
            $stmtRt->execute();
            $rtResult = $stmtRt->get_result();
            while ($row = $rtResult->fetch_assoc()) {
                $rtIds[] = (int) $row['id'];
            }

            deleteLinkedUsersByRoleIds($db, 'rt', $rtIds);
            deleteLinkedUsersByRoleIds($db, 'rw', [(int) $id]);

            $stmt = $db->prepare("DELETE FROM rw WHERE id = ?");
            $stmt->bind_param('i', $id);

            if (!$stmt->execute()) {
                throw new RuntimeException('Gagal menghapus RW');
            }

            $db->commit();
            jsonResponse(['message' => 'RW berhasil dihapus']);
        } catch (Throwable $exception) {
            $db->rollback();
            jsonResponse(['error' => $exception->getMessage()], 500);
        }
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
