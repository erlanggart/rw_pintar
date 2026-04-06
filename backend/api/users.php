<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/account_helpers.php';

$currentUser = authenticate();
authorize($currentUser, ['superadmin', 'desa', 'rw']);

$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

function managedUsersBaseQuery() {
    return "
        SELECT
            users.id,
            users.username,
            users.nama_lengkap,
            users.role,
            users.is_active,
            users.created_at,
            direct_desa.nama_desa AS desa_name,
            direct_rw.nomor_rw AS rw_number,
            rw_desa.nama_desa AS rw_desa_name,
            direct_rt.nomor_rt AS rt_number,
            rt_rw.nomor_rw AS rt_rw_number,
            rt_desa.nama_desa AS rt_desa_name
        FROM users
        LEFT JOIN desa AS direct_desa ON users.desa_id = direct_desa.id
        LEFT JOIN rw AS direct_rw ON users.rw_id = direct_rw.id
        LEFT JOIN desa AS rw_desa ON direct_rw.desa_id = rw_desa.id
        LEFT JOIN rt AS direct_rt ON users.rt_id = direct_rt.id
        LEFT JOIN rw AS rt_rw ON direct_rt.rw_id = rt_rw.id
        LEFT JOIN desa AS rt_desa ON rt_rw.desa_id = rt_desa.id
    ";
}

function managedUsersScopeClause($currentUser) {
    if ($currentUser['role'] === 'superadmin') {
        return [
            "users.role IN ('desa', 'rw', 'rt')",
            '',
            [],
        ];
    }

    if ($currentUser['role'] === 'desa') {
        return [
            "((users.role = 'rw' AND direct_rw.desa_id = ?) OR (users.role = 'rt' AND rt_rw.desa_id = ?))",
            'ii',
            [$currentUser['desa_id'], $currentUser['desa_id']],
        ];
    }

    return [
        "(users.role = 'rt' AND direct_rt.rw_id = ?)",
        'i',
        [$currentUser['rw_id']],
    ];
}

function formatManagedUser($row) {
    $roleLabels = [
        'desa' => 'Admin Desa',
        'rw' => 'Admin RW',
        'rt' => 'Admin RT',
    ];

    $wilayahLabel = '-';

    if ($row['role'] === 'desa') {
        $wilayahLabel = 'Desa ' . ($row['desa_name'] ?: '-');
    } elseif ($row['role'] === 'rw') {
        $wilayahLabel = 'RW ' . ($row['rw_number'] ?: '-') . ' - ' . ($row['rw_desa_name'] ?: '-');
    } elseif ($row['role'] === 'rt') {
        $wilayahLabel = 'RT ' . ($row['rt_number'] ?: '-') . ' / RW ' . ($row['rt_rw_number'] ?: '-') . ' - ' . ($row['rt_desa_name'] ?: '-');
    }

    return [
        'id' => (int) $row['id'],
        'username' => $row['username'],
        'nama_lengkap' => $row['nama_lengkap'],
        'role' => $row['role'],
        'role_label' => $roleLabels[$row['role']] ?? ucfirst($row['role']),
        'is_active' => (int) $row['is_active'] === 1,
        'wilayah_label' => $wilayahLabel,
        'created_at' => $row['created_at'],
    ];
}

function getManagedUserById(mysqli $db, $currentUser, $managedUserId) {
    if ($currentUser['role'] === 'superadmin') {
        $sql = managedUsersBaseQuery() . " WHERE users.role IN ('desa', 'rw', 'rt') AND users.id = ? LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->bind_param('i', $managedUserId);
    } elseif ($currentUser['role'] === 'desa') {
        $sql = managedUsersBaseQuery() . " WHERE ((users.role = 'rw' AND direct_rw.desa_id = ?) OR (users.role = 'rt' AND rt_rw.desa_id = ?)) AND users.id = ? LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->bind_param('iii', $currentUser['desa_id'], $currentUser['desa_id'], $managedUserId);
    } else {
        $sql = managedUsersBaseQuery() . " WHERE (users.role = 'rt' AND direct_rt.rw_id = ?) AND users.id = ? LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->bind_param('ii', $currentUser['rw_id'], $managedUserId);
    }

    $stmt->execute();

    return $stmt->get_result()->fetch_assoc() ?: null;
}

function getManagedUserResponse(mysqli $db, $currentUser, $managedUserId) {
    $managedUser = getManagedUserById($db, $currentUser, $managedUserId);

    return $managedUser ? formatManagedUser($managedUser) : null;
}

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $managedUser = getManagedUserResponse($db, $currentUser, (int) $_GET['id']);

            if (!$managedUser) {
                jsonResponse(['error' => 'Pengguna tidak ditemukan'], 404);
            }

            jsonResponse($managedUser);
        }

        if ($currentUser['role'] === 'superadmin') {
            $sql = managedUsersBaseQuery() . " WHERE users.role IN ('desa', 'rw', 'rt') ORDER BY FIELD(users.role, 'desa', 'rw', 'rt'), users.username ASC";
            $stmt = $db->prepare($sql);
        } elseif ($currentUser['role'] === 'desa') {
            $sql = managedUsersBaseQuery() . " WHERE ((users.role = 'rw' AND direct_rw.desa_id = ?) OR (users.role = 'rt' AND rt_rw.desa_id = ?)) ORDER BY FIELD(users.role, 'desa', 'rw', 'rt'), users.username ASC";
            $stmt = $db->prepare($sql);
            $stmt->bind_param('ii', $currentUser['desa_id'], $currentUser['desa_id']);
        } else {
            $sql = managedUsersBaseQuery() . " WHERE (users.role = 'rt' AND direct_rt.rw_id = ?) ORDER BY FIELD(users.role, 'desa', 'rw', 'rt'), users.username ASC";
            $stmt = $db->prepare($sql);
            $stmt->bind_param('i', $currentUser['rw_id']);
        }

        $stmt->execute();
        $result = $stmt->get_result();
        $data = [];

        while ($row = $result->fetch_assoc()) {
            $data[] = formatManagedUser($row);
        }

        jsonResponse($data);
        break;

    case 'POST':
        $input = getInput();
        $action = $input['action'] ?? '';
        $managedUserId = (int) ($input['id'] ?? 0);

        if ($action !== 'reset_password') {
            jsonResponse(['error' => 'Aksi tidak valid'], 400);
        }

        if ($managedUserId <= 0) {
            jsonResponse(['error' => 'ID pengguna harus diisi'], 400);
        }

        $managedUser = getManagedUserById($db, $currentUser, $managedUserId);
        if (!$managedUser) {
            jsonResponse(['error' => 'Pengguna tidak ditemukan'], 404);
        }

        $passwordHash = password_hash(DEFAULT_ACCOUNT_PASSWORD, PASSWORD_DEFAULT);
        $stmt = $db->prepare("UPDATE users SET password = ? WHERE id = ?");
        $stmt->bind_param('si', $passwordHash, $managedUserId);

        if (!$stmt->execute()) {
            jsonResponse(['error' => 'Gagal mereset password'], 500);
        }

        jsonResponse([
            'message' => 'Password berhasil direset',
            'default_password' => DEFAULT_ACCOUNT_PASSWORD,
        ]);
        break;

    case 'PUT':
        $input = getInput();
        $managedUserId = (int) ($input['id'] ?? 0);

        if ($managedUserId <= 0) {
            jsonResponse(['error' => 'ID pengguna harus diisi'], 400);
        }

        $managedUser = getManagedUserById($db, $currentUser, $managedUserId);
        if (!$managedUser) {
            jsonResponse(['error' => 'Pengguna tidak ditemukan'], 404);
        }

        if (array_key_exists('username', $input) || array_key_exists('password', $input)) {
            if (!in_array($currentUser['role'], ['superadmin', 'desa'], true)) {
                jsonResponse(['error' => 'Anda tidak dapat mengubah kredensial akun ini'], 403);
            }

            $username = normalizeUsername($input['username'] ?? $managedUser['username']);
            $newPassword = (string) ($input['password'] ?? '');

            if ($username === '') {
                jsonResponse(['error' => 'Username harus diisi'], 400);
            }

            if (!isValidUsernameFormat($username)) {
                jsonResponse(['error' => 'Username hanya boleh 4-50 karakter dengan huruf, angka, titik, strip, atau underscore'], 400);
            }

            if (usernameExists($db, $username, $managedUserId)) {
                jsonResponse(['error' => 'Username sudah dipakai'], 400);
            }

            if ($newPassword !== '' && strlen($newPassword) < 6) {
                jsonResponse(['error' => 'Password minimal 6 karakter'], 400);
            }

            if ($newPassword !== '') {
                $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
                $stmt = $db->prepare("UPDATE users SET username = ?, password = ? WHERE id = ?");
                $stmt->bind_param('ssi', $username, $passwordHash, $managedUserId);
            } else {
                $stmt = $db->prepare("UPDATE users SET username = ? WHERE id = ?");
                $stmt->bind_param('si', $username, $managedUserId);
            }

            if (!$stmt->execute()) {
                jsonResponse(['error' => 'Gagal memperbarui kredensial pengguna'], 500);
            }

            jsonResponse([
                'message' => 'Kredensial pengguna berhasil diperbarui',
                'user' => getManagedUserResponse($db, $currentUser, $managedUserId),
            ]);
        }

        if (!array_key_exists('is_active', $input)) {
            jsonResponse(['error' => 'ID pengguna dan status aktif harus diisi'], 400);
        }

        $isActive = (int) ((bool) $input['is_active']);
        $stmt = $db->prepare("UPDATE users SET is_active = ? WHERE id = ?");
        $stmt->bind_param('ii', $isActive, $managedUserId);

        if (!$stmt->execute()) {
            jsonResponse(['error' => 'Gagal memperbarui status pengguna'], 500);
        }

        jsonResponse([
            'message' => $isActive === 1 ? 'Akun berhasil diaktifkan' : 'Akun berhasil dinonaktifkan',
        ]);
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}