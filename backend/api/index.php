<?php
// Router sederhana untuk .htaccess rewrite
$uri = $_SERVER['REQUEST_URI'] ?? '/';
$scriptBase = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
$scriptBase = rtrim($scriptBase, '/');

$path = parse_url($uri, PHP_URL_PATH) ?: '/';
if ($scriptBase !== '' && $scriptBase !== '/' && strpos($path, $scriptBase) === 0) {
    $path = substr($path, strlen($scriptBase));
}
$path = trim($path, '/');

// Route mapping
$routes = [
    'auth/login' => 'auth/login.php',
    'auth/me' => 'auth/me.php',
    'profile' => 'profile.php',
    'current-desa' => 'current_desa.php',
    'desa' => 'desa.php',
    'rw' => 'rw.php',
    'rt' => 'rt.php',
    'users' => 'users.php',
    'keluarga' => 'keluarga.php',
    'penduduk' => 'penduduk.php',
    'aktivitas' => 'aktivitas.php',
    'dashboard' => 'dashboard.php',
];

if (isset($routes[$path])) {
    require_once __DIR__ . '/' . $routes[$path];
} else {
    header('Content-Type: application/json');
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint tidak ditemukan']);
}
