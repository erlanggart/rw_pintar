<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/account_helpers.php';

$user = authenticate();
authorize($user, ['superadmin', 'desa', 'rw']);

$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

function getRtByIdForUser(mysqli $db, $user, $rtId) {
    if ($user['role'] === 'rw') {
        $stmt = $db->prepare("SELECT rt.*, rw.nomor_rw, desa.nama_desa FROM rt JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE rt.id = ? AND rt.rw_id = ? LIMIT 1");
        $stmt->bind_param('ii', $rtId, $user['rw_id']);
    } elseif ($user['role'] === 'desa') {
        $stmt = $db->prepare("SELECT rt.*, rw.nomor_rw, desa.nama_desa FROM rt JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE rt.id = ? AND rw.desa_id = ? LIMIT 1");
        $stmt->bind_param('ii', $rtId, $user['desa_id']);
    } else {
        $stmt = $db->prepare("SELECT rt.*, rw.nomor_rw, desa.nama_desa FROM rt JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE rt.id = ? LIMIT 1");
        $stmt->bind_param('i', $rtId);
    }

    $stmt->execute();

    return $stmt->get_result()->fetch_assoc() ?: null;
}

function canManageRwForRt(mysqli $db, $user, $rwId) {
    if ($user['role'] === 'superadmin') {
        $stmt = $db->prepare("SELECT id FROM rw WHERE id = ? LIMIT 1");
        $stmt->bind_param('i', $rwId);
    } elseif ($user['role'] === 'desa') {
        $stmt = $db->prepare("SELECT id FROM rw WHERE id = ? AND desa_id = ? LIMIT 1");
        $stmt->bind_param('ii', $rwId, $user['desa_id']);
    } else {
        return (int) $rwId === (int) $user['rw_id'];
    }

    $stmt->execute();

    return (bool) $stmt->get_result()->fetch_assoc();
}

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $result = getRtByIdForUser($db, $user, (int) $_GET['id']);
            if (!$result) jsonResponse(['error' => 'RT tidak ditemukan'], 404);
            jsonResponse($result);
        }

        $rwId = isset($_GET['rw_id']) ? (int) $_GET['rw_id'] : 0;
        $desaId = isset($_GET['desa_id']) ? (int) $_GET['desa_id'] : 0;

        if ($user['role'] === 'rw') {
            $stmt = $db->prepare("SELECT rt.*, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM rt JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE rt.rw_id = ? ORDER BY rt.nomor_rt ASC");
            $stmt->bind_param('i', $user['rw_id']);
            $stmt->execute();
            $result = $stmt->get_result();
        } elseif ($user['role'] === 'desa') {
            if ($rwId > 0) {
                $stmt = $db->prepare("SELECT rt.*, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM rt JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE rt.rw_id = ? AND rw.desa_id = ? ORDER BY rt.nomor_rt ASC");
                $stmt->bind_param('ii', $rwId, $user['desa_id']);
            } else {
                $stmt = $db->prepare("SELECT rt.*, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM rt JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE rw.desa_id = ? ORDER BY rw.nomor_rw, rt.nomor_rt ASC");
                $stmt->bind_param('i', $user['desa_id']);
            }

            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            if ($rwId > 0) {
                $stmt = $db->prepare("SELECT rt.*, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM rt JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE rt.rw_id = ? ORDER BY rt.nomor_rt ASC");
                $stmt->bind_param('i', $rwId);
                $stmt->execute();
                $result = $stmt->get_result();
            } elseif ($desaId > 0) {
                $stmt = $db->prepare("SELECT rt.*, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM rt JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id WHERE rw.desa_id = ? ORDER BY rw.nomor_rw, rt.nomor_rt ASC");
                $stmt->bind_param('i', $desaId);
                $stmt->execute();
                $result = $stmt->get_result();
            } else {
                $result = $db->query("SELECT rt.*, rw.nomor_rw, rw.desa_id, desa.nama_desa FROM rt JOIN rw ON rt.rw_id = rw.id JOIN desa ON rw.desa_id = desa.id ORDER BY desa.nama_desa, rw.nomor_rw, rt.nomor_rt ASC");
            }
        }

        $data = [];
        while ($row = $result->fetch_assoc()) $data[] = $row;
        jsonResponse($data);
        break;

    case 'POST':
        $input = getInput();
        $rwId = ($user['role'] === 'rw') ? $user['rw_id'] : ($input['rw_id'] ?? 0);
        $nomor = $input['nomor_rt'] ?? '';
        $ketua = $input['nama_ketua'] ?? '';

        if (empty($rwId) || empty($nomor)) {
            jsonResponse(['error' => 'RW ID dan nomor RT harus diisi'], 400);
        }

        if (!canManageRwForRt($db, $user, (int) $rwId)) {
            jsonResponse(['error' => 'Anda tidak dapat menambahkan RT pada RW tersebut'], 403);
        }

        $db->begin_transaction();

        try {
            $stmt = $db->prepare("INSERT INTO rt (rw_id, nomor_rt, nama_ketua) VALUES (?, ?, ?)");
            $stmt->bind_param('iss', $rwId, $nomor, $ketua);

            if (!$stmt->execute()) {
                throw new RuntimeException('Gagal menambahkan RT');
            }

            $rtId = $db->insert_id;
            $account = createLinkedUserAccount(
                $db,
                'rt',
                $rtId,
                buildRtUsernameBase($nomor, $rwId),
                buildRtDisplayName($nomor)
            );

            $db->commit();

            jsonResponse([
                'message' => 'RT berhasil ditambahkan',
                'id' => $rtId,
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
        $rwId = ($user['role'] === 'rw') ? $user['rw_id'] : ($input['rw_id'] ?? 0);
        $nomor = $input['nomor_rt'] ?? '';
        $ketua = $input['nama_ketua'] ?? '';

        if (empty($id) || empty($rwId) || empty($nomor)) jsonResponse(['error' => 'ID, RW, dan nomor RT harus diisi'], 400);

        $existingRt = getRtByIdForUser($db, $user, (int) $id);
        if (!$existingRt) jsonResponse(['error' => 'RT tidak ditemukan'], 404);

        if (!canManageRwForRt($db, $user, (int) $rwId)) {
            jsonResponse(['error' => 'Anda tidak dapat memindahkan RT ke RW tersebut'], 403);
        }

        $db->begin_transaction();

        try {
            $stmt = $db->prepare("UPDATE rt SET rw_id = ?, nomor_rt = ?, nama_ketua = ? WHERE id = ?");
            $stmt->bind_param('issi', $rwId, $nomor, $ketua, $id);

            if (!$stmt->execute()) {
                throw new RuntimeException('Gagal mengupdate RT');
            }

            $account = syncLinkedUserAccount(
                $db,
                'rt',
                (int) $id,
                buildRtUsernameBase($nomor, $rwId),
                buildRtDisplayName($nomor)
            );

            $db->commit();

            jsonResponse([
                'message' => 'RT berhasil diupdate',
                'username' => $account['username'],
            ]);
        } catch (Throwable $exception) {
            $db->rollback();
            jsonResponse(['error' => $exception->getMessage()], 500);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? 0;
        if (empty($id)) jsonResponse(['error' => 'ID RT harus diisi'], 400);

        $existingRt = getRtByIdForUser($db, $user, (int) $id);
        if (!$existingRt) jsonResponse(['error' => 'RT tidak ditemukan'], 404);

        $db->begin_transaction();

        try {
            deleteLinkedUsersByRoleIds($db, 'rt', [(int) $id]);

            $stmt = $db->prepare("DELETE FROM rt WHERE id = ?");
            $stmt->bind_param('i', $id);

            if (!$stmt->execute()) {
                throw new RuntimeException('Gagal menghapus RT');
            }

            $db->commit();
            jsonResponse(['message' => 'RT berhasil dihapus']);
        } catch (Throwable $exception) {
            $db->rollback();
            jsonResponse(['error' => $exception->getMessage()], 500);
        }
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
