<?php

function getEnvConfig($key, $default = null) {
    $value = getenv($key);

    if ($value === false || $value === '') {
        return $default;
    }

    return $value;
}

// Konfigurasi Database
define('DB_HOST', getEnvConfig('DB_HOST', 'localhost'));
define('DB_USER', getEnvConfig('DB_USER', 'root'));
define('DB_PASS', getEnvConfig('DB_PASS', ''));
define('DB_NAME', getEnvConfig('DB_NAME', 'rw_pintar'));

// Konfigurasi JWT
define('JWT_SECRET', getEnvConfig('JWT_SECRET', 'rw_pintar_secret_key_2024_change_in_production'));
define('JWT_EXPIRY', (int) getEnvConfig('JWT_EXPIRY', '86400')); // 24 jam

$allowedOrigins = array_filter(array_map('trim', explode(',', getEnvConfig(
    'APP_ALLOWED_ORIGINS',
    'http://localhost:5173,https://seashell-squid-374855.hostingersite.com'
))));

$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($requestOrigin !== '' && in_array($requestOrigin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $requestOrigin);
}

header('Vary: Origin');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Koneksi Database
function getDB() {
    static $conn = null;
    if ($conn === null) {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        if ($conn->connect_error) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed']);
            exit();
        }
        $conn->set_charset('utf8mb4');
    }
    return $conn;
}

// JSON Response Helper
function jsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

// Get JSON Input
function getInput() {
    $input = json_decode(file_get_contents('php://input'), true);
    return $input ?? [];
}

// Simple JWT encode
function jwtEncode($payload) {
    $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $payload['exp'] = time() + JWT_EXPIRY;
    $payload = base64_encode(json_encode($payload));
    $signature = base64_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    return "$header.$payload.$signature";
}

// Simple JWT decode
function jwtDecode($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    
    [$header, $payload, $signature] = $parts;
    $validSignature = base64_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    
    if (!hash_equals($validSignature, $signature)) return null;
    
    $data = json_decode(base64_decode($payload), true);
    if (!$data || (isset($data['exp']) && $data['exp'] < time())) return null;
    
    return $data;
}

// Authenticate middleware
function authenticate() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (!preg_match('/Bearer\s+(.+)/', $authHeader, $matches)) {
        jsonResponse(['error' => 'Token tidak ditemukan'], 401);
    }
    
    $decoded = jwtDecode($matches[1]);
    if (!$decoded) {
        jsonResponse(['error' => 'Token tidak valid atau expired'], 401);
    }

    $db = getDB();
    $stmt = $db->prepare("SELECT id, username, nama_lengkap, role, desa_id, rw_id, rt_id, is_active FROM users WHERE id = ? LIMIT 1");
    $stmt->bind_param('i', $decoded['id']);
    $stmt->execute();
    $currentUser = $stmt->get_result()->fetch_assoc();

    if (!$currentUser || (int) $currentUser['is_active'] !== 1) {
        jsonResponse(['error' => 'Akun tidak aktif atau tidak ditemukan'], 401);
    }

    return [
        'id' => (int) $currentUser['id'],
        'username' => $currentUser['username'],
        'nama_lengkap' => $currentUser['nama_lengkap'],
        'role' => $currentUser['role'],
        'desa_id' => $currentUser['desa_id'] !== null ? (int) $currentUser['desa_id'] : null,
        'rw_id' => $currentUser['rw_id'] !== null ? (int) $currentUser['rw_id'] : null,
        'rt_id' => $currentUser['rt_id'] !== null ? (int) $currentUser['rt_id'] : null,
    ];
}

// Check role authorization
function authorize($user, $allowedRoles) {
    if (!in_array($user['role'], $allowedRoles)) {
        jsonResponse(['error' => 'Anda tidak memiliki akses'], 403);
    }
}
