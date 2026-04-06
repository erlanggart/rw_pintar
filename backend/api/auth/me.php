<?php
require_once __DIR__ . '/../../config/database.php';

$user = authenticate();
jsonResponse([
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
