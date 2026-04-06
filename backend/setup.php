<?php
// Script sekali pakai untuk setup database dan password
// Akses: http://localhost/rw-pintar/backend/setup.php
// HAPUS file ini setelah selesai setup!

require_once __DIR__ . '/config/database.php';

$db = getDB();

// Cek/buat tabel
$sql = file_get_contents(__DIR__ . '/../database/rw_pintar.sql');
// Jalankan tiap statement
$statements = array_filter(array_map('trim', explode(';', $sql)));
$errors = [];
mysqli_report(MYSQLI_REPORT_OFF);
foreach ($statements as $stmt) {
    if (!empty($stmt) && strlen($stmt) > 3) {
        $db->query($stmt);
        // Ignore: table exists (1050), DB exists (1007), duplicate key (1062)
        if ($db->errno && !in_array($db->errno, [1050, 1007, 1062])) {
            $errors[] = $db->errno . ': ' . $db->error . ' --- ' . substr($stmt, 0, 80);
        }
    }
}

// Update passwords dengan hash yang benar
$password = 'password123';
$hash = password_hash($password, PASSWORD_DEFAULT);

$users = [
    ['superadmin', $hash, 'Super Administrator', 'superadmin', null, null, null],
    ['admin_desa', $hash, 'Admin Desa Susukan', 'desa', 1, null, null],
    ['admin_rw', $hash, 'Admin RW 001', 'rw', null, 1, null],
    ['admin_rt', $hash, 'Admin RT 001', 'rt', null, null, 1],
];

foreach ($users as [$username, $pwHash, $nama, $role, $desaId, $rwId, $rtId]) {
    // Cek apakah user ada
    $stmt = $db->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->bind_param('s', $username);
    $stmt->execute();
    $existing = $stmt->get_result()->fetch_assoc();

    if ($existing) {
        $stmt = $db->prepare("UPDATE users SET password = ? WHERE username = ?");
        $stmt->bind_param('ss', $pwHash, $username);
        $stmt->execute();
    } else {
        $stmt = $db->prepare("INSERT INTO users (username, password, nama_lengkap, role, desa_id, rw_id, rt_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param('ssssiiii', $username, $pwHash, $nama, $role, $desaId, $rwId, $rtId);
        $stmt->execute();
    }
}

echo json_encode([
    'status' => 'success',
    'message' => 'Setup selesai! Semua akun sudah siap.',
    'akun' => [
        ['username' => 'superadmin', 'password' => 'password123', 'role' => 'superadmin'],
        ['username' => 'admin_desa', 'password' => 'password123', 'role' => 'desa'],
        ['username' => 'admin_rw', 'password' => 'password123', 'role' => 'rw'],
        ['username' => 'admin_rt', 'password' => 'password123', 'role' => 'rt'],
    ],
    'peringatan' => count($errors) > 0 ? $errors : null
]);
