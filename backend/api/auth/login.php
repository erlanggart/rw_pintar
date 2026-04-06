<?php
require_once __DIR__ . '/../../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = getInput();

if ($method === 'POST') {
    $username = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';

    if (empty($username) || empty($password)) {
        jsonResponse(['error' => 'Username dan password harus diisi'], 400);
    }

    $db = getDB();
    $stmt = $db->prepare("SELECT id, username, password, nama_lengkap, role, desa_id, rw_id, rt_id, is_active FROM users WHERE username = ? LIMIT 1");
    $stmt->bind_param('s', $username);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if (!$user) {
        jsonResponse(['error' => 'Username tidak ditemukan'], 404);
    }

    if ((int) $user['is_active'] !== 1) {
        jsonResponse(['error' => 'Akun tidak aktif'], 403);
    }

    if (!password_verify($password, $user['password'])) {
        jsonResponse(['error' => 'Password salah'], 401);
    }

    $token = jwtEncode([
        'id' => $user['id'],
        'username' => $user['username'],
        'role' => $user['role'],
        'desa_id' => $user['desa_id'],
        'rw_id' => $user['rw_id'],
        'rt_id' => $user['rt_id'],
    ]);

    jsonResponse([
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'nama_lengkap' => $user['nama_lengkap'],
            'role' => $user['role'],
            'desa_id' => $user['desa_id'],
            'rw_id' => $user['rw_id'],
            'rt_id' => $user['rt_id'],
        ]
    ]);
} else {
    jsonResponse(['error' => 'Method not allowed'], 405);
}
