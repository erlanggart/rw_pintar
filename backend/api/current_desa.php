<?php
require_once __DIR__ . '/../config/database.php';

$user = authenticate();
authorize($user, ['superadmin', 'desa', 'rw', 'rt']);

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$db = getDB();
$desaId = 0;

if ($user['role'] === 'desa') {
    $desaId = (int) ($user['desa_id'] ?? 0);
} elseif ($user['role'] === 'rw') {
    $stmt = $db->prepare("SELECT desa_id FROM rw WHERE id = ? LIMIT 1");
    $stmt->bind_param('i', $user['rw_id']);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $desaId = (int) ($row['desa_id'] ?? 0);
} elseif ($user['role'] === 'rt') {
    $stmt = $db->prepare("SELECT rw.desa_id FROM rt JOIN rw ON rt.rw_id = rw.id WHERE rt.id = ? LIMIT 1");
    $stmt->bind_param('i', $user['rt_id']);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $desaId = (int) ($row['desa_id'] ?? 0);
} else {
    $desaId = (int) ($_GET['id'] ?? 0);
}

if ($desaId <= 0) {
    jsonResponse(['error' => 'Data desa sekarang tidak tersedia untuk akun ini'], 404);
}

$stmt = $db->prepare("SELECT id, nama_desa, kecamatan, kabupaten, provinsi FROM desa WHERE id = ? LIMIT 1");
$stmt->bind_param('i', $desaId);
$stmt->execute();
$desa = $stmt->get_result()->fetch_assoc();

if (!$desa) {
    jsonResponse(['error' => 'Data desa tidak ditemukan'], 404);
}

jsonResponse($desa);