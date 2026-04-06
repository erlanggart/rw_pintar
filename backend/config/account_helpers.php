<?php

const DEFAULT_ACCOUNT_PASSWORD = 'password123';

function normalizeUsername($username) {
    return trim((string) $username);
}

function isValidUsernameFormat($username) {
    $username = normalizeUsername($username);

    return (bool) preg_match('/^[A-Za-z0-9._-]{4,50}$/', $username);
}

function slugUsernamePart($value) {
    $value = strtolower(trim((string) $value));
    $value = preg_replace('/[^a-z0-9]+/', '_', $value);
    $value = trim($value, '_');

    return $value !== '' ? $value : 'wilayah';
}

function buildDesaUsernameBase($namaDesa) {
    return 'desa_' . slugUsernamePart($namaDesa);
}

function buildRwUsernameBase($nomorRw, $desaId) {
    return 'rw_' . str_pad((string) $nomorRw, 3, '0', STR_PAD_LEFT) . '_desa' . (int) $desaId;
}

function buildRtUsernameBase($nomorRt, $rwId) {
    return 'rt_' . str_pad((string) $nomorRt, 3, '0', STR_PAD_LEFT) . '_rw' . (int) $rwId;
}

function buildDesaDisplayName($namaDesa) {
    return 'Admin ' . trim((string) $namaDesa);
}

function buildRwDisplayName($nomorRw) {
    return 'Admin RW ' . trim((string) $nomorRw);
}

function buildRtDisplayName($nomorRt) {
    return 'Admin RT ' . trim((string) $nomorRt);
}

function generateUniqueUsername(mysqli $db, $baseUsername, $excludeUserId = null) {
    $baseUsername = trim((string) $baseUsername, '_');
    if ($baseUsername === '') {
        $baseUsername = 'user';
    }

    $baseUsername = substr($baseUsername, 0, 42);
    $candidate = $baseUsername;
    $counter = 2;

    while (usernameExists($db, $candidate, $excludeUserId)) {
        $suffix = '_' . $counter;
        $candidate = substr($baseUsername, 0, 50 - strlen($suffix)) . $suffix;
        $counter++;
    }

    return $candidate;
}

function usernameExists(mysqli $db, $username, $excludeUserId = null) {
    if ($excludeUserId) {
        $stmt = $db->prepare("SELECT id FROM users WHERE username = ? AND id != ? LIMIT 1");
        $stmt->bind_param('si', $username, $excludeUserId);
    } else {
        $stmt = $db->prepare("SELECT id FROM users WHERE username = ? LIMIT 1");
        $stmt->bind_param('s', $username);
    }

    $stmt->execute();

    return (bool) $stmt->get_result()->fetch_assoc();
}

function findLinkedUserByRole(mysqli $db, $role, $entityId) {
    $column = $role . '_id';
    $stmt = $db->prepare("SELECT id, username, nama_lengkap, is_active FROM users WHERE role = ? AND {$column} = ? LIMIT 1");
    $stmt->bind_param('si', $role, $entityId);
    $stmt->execute();

    return $stmt->get_result()->fetch_assoc() ?: null;
}

function createLinkedUserAccount(mysqli $db, $role, $entityId, $baseUsername, $displayName) {
    $username = generateUniqueUsername($db, $baseUsername);
    $password = password_hash(DEFAULT_ACCOUNT_PASSWORD, PASSWORD_DEFAULT);
    $column = $role . '_id';
    $stmt = $db->prepare("INSERT INTO users (username, password, nama_lengkap, role, {$column}) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param('ssssi', $username, $password, $displayName, $role, $entityId);

    if (!$stmt->execute()) {
        throw new RuntimeException('Gagal membuat akun pengguna');
    }

    return [
        'id' => $db->insert_id,
        'username' => $username,
        'default_password' => DEFAULT_ACCOUNT_PASSWORD,
    ];
}

function syncLinkedUserAccount(mysqli $db, $role, $entityId, $baseUsername, $displayName) {
    $existingUser = findLinkedUserByRole($db, $role, $entityId);

    if (!$existingUser) {
        return createLinkedUserAccount($db, $role, $entityId, $baseUsername, $displayName);
    }

    $stmt = $db->prepare("UPDATE users SET nama_lengkap = ? WHERE id = ?");
    $stmt->bind_param('si', $displayName, $existingUser['id']);

    if (!$stmt->execute()) {
        throw new RuntimeException('Gagal menyinkronkan akun pengguna');
    }

    return [
        'id' => (int) $existingUser['id'],
        'username' => $existingUser['username'],
    ];
}

function deleteLinkedUsersByRoleIds(mysqli $db, $role, array $entityIds) {
    $entityIds = array_values(array_unique(array_filter(array_map('intval', $entityIds))));
    if (count($entityIds) === 0) {
        return;
    }

    $column = $role . '_id';
    $idList = implode(', ', $entityIds);
    $stmt = $db->prepare("DELETE FROM users WHERE role = ? AND {$column} IN ({$idList})");
    $stmt->bind_param('s', $role);

    if (!$stmt->execute()) {
        throw new RuntimeException('Gagal menghapus akun pengguna terkait');
    }
}