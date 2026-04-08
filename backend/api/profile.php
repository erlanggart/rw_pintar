<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/account_helpers.php';

$currentUser = authenticate();
$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

function profileResponse($user, $db) {
    $data = [
        'id' => (int) $user['id'],
        'username' => $user['username'],
        'nama_lengkap' => $user['nama_lengkap'],
        'role' => $user['role'],
        'desa_id' => $user['desa_id'] !== null ? (int) $user['desa_id'] : null,
        'rw_id' => $user['rw_id'] !== null ? (int) $user['rw_id'] : null,
        'rt_id' => $user['rt_id'] !== null ? (int) $user['rt_id'] : null,
    ];

    if ($user['role'] === 'rt' && $user['rt_id'] !== null) {
        $stmt = $db->prepare("SELECT alamat_sekretariat FROM rt WHERE id = ? LIMIT 1");
        $stmt->bind_param('i', $user['rt_id']);
        $stmt->execute();
        $rt = $stmt->get_result()->fetch_assoc();
        $data['alamat_sekretariat'] = $rt ? ($rt['alamat_sekretariat'] ?? '') : '';
    }

    return $data;
}

switch ($method) {
    case 'GET':
        jsonResponse(['user' => profileResponse($currentUser, $db)]);
        break;

    case 'PUT':
        $input = getInput();
        $username = normalizeUsername($input['username'] ?? $currentUser['username']);
        $currentPassword = (string) ($input['current_password'] ?? '');
        $newPassword = (string) ($input['new_password'] ?? '');
        $alamatSekretariat = isset($input['alamat_sekretariat']) ? trim((string) $input['alamat_sekretariat']) : null;

        if ($username === '') {
            jsonResponse(['error' => 'Username harus diisi'], 400);
        }

        if (!isValidUsernameFormat($username)) {
            jsonResponse(['error' => 'Username hanya boleh 4-50 karakter dengan huruf, angka, titik, strip, atau underscore'], 400);
        }

        if (usernameExists($db, $username, (int) $currentUser['id'])) {
            jsonResponse(['error' => 'Username sudah dipakai'], 400);
        }

        if ($newPassword !== '') {
            if ($currentPassword === '') {
                jsonResponse(['error' => 'Password saat ini harus diisi'], 400);
            }

            if (strlen($newPassword) < 6) {
                jsonResponse(['error' => 'Password baru minimal 6 karakter'], 400);
            }

            $stmt = $db->prepare("SELECT password FROM users WHERE id = ? LIMIT 1");
            $stmt->bind_param('i', $currentUser['id']);
            $stmt->execute();
            $userRow = $stmt->get_result()->fetch_assoc();

            if (!$userRow || !password_verify($currentPassword, $userRow['password'])) {
                jsonResponse(['error' => 'Password saat ini tidak sesuai'], 400);
            }
        }

        if ($newPassword !== '') {
            $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
            $stmt = $db->prepare("UPDATE users SET username = ?, password = ? WHERE id = ?");
            $stmt->bind_param('ssi', $username, $passwordHash, $currentUser['id']);
        } else {
            $stmt = $db->prepare("UPDATE users SET username = ? WHERE id = ?");
            $stmt->bind_param('si', $username, $currentUser['id']);
        }

        if (!$stmt->execute()) {
            jsonResponse(['error' => 'Gagal memperbarui profil'], 500);
        }

        if ($alamatSekretariat !== null && $currentUser['role'] === 'rt' && $currentUser['rt_id'] !== null) {
            $stmtRt = $db->prepare("UPDATE rt SET alamat_sekretariat = ? WHERE id = ?");
            $stmtRt->bind_param('si', $alamatSekretariat, $currentUser['rt_id']);
            $stmtRt->execute();
        }

        $stmt = $db->prepare("SELECT id, username, nama_lengkap, role, desa_id, rw_id, rt_id FROM users WHERE id = ? LIMIT 1");
        $stmt->bind_param('i', $currentUser['id']);
        $stmt->execute();
        $updatedUser = $stmt->get_result()->fetch_assoc();

        jsonResponse([
            'message' => 'Profil berhasil diperbarui',
            'user' => profileResponse($updatedUser, $db),
        ]);
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}