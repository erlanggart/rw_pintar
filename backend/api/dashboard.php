<?php
require_once __DIR__ . '/../config/database.php';

$user = authenticate();
$db = getDB();

$stats = [];

switch ($user['role']) {
    case 'superadmin':
        $stats['total_desa'] = $db->query("SELECT COUNT(*) as c FROM desa")->fetch_assoc()['c'];
        $stats['total_rw'] = $db->query("SELECT COUNT(*) as c FROM rw")->fetch_assoc()['c'];
        $stats['total_rt'] = $db->query("SELECT COUNT(*) as c FROM rt")->fetch_assoc()['c'];
        $stats['total_keluarga'] = $db->query("SELECT COUNT(*) as c FROM keluarga")->fetch_assoc()['c'];
        $stats['total_penduduk'] = $db->query("SELECT COUNT(*) as c FROM penduduk")->fetch_assoc()['c'];
        $stats['total_users'] = $db->query("SELECT COUNT(*) as c FROM users")->fetch_assoc()['c'];
        break;

    case 'desa':
        $desaId = $user['desa_id'];
        $stmt = $db->prepare("SELECT COUNT(*) as c FROM rw WHERE desa_id = ?");
        $stmt->bind_param('i', $desaId);
        $stmt->execute();
        $stats['total_rw'] = $stmt->get_result()->fetch_assoc()['c'];

        $stmt = $db->prepare("SELECT COUNT(*) as c FROM rt WHERE rw_id IN (SELECT id FROM rw WHERE desa_id = ?)");
        $stmt->bind_param('i', $desaId);
        $stmt->execute();
        $stats['total_rt'] = $stmt->get_result()->fetch_assoc()['c'];

        $stmt = $db->prepare("SELECT COUNT(*) as c FROM keluarga WHERE rt_id IN (SELECT rt.id FROM rt JOIN rw ON rt.rw_id = rw.id WHERE rw.desa_id = ?)");
        $stmt->bind_param('i', $desaId);
        $stmt->execute();
        $stats['total_keluarga'] = $stmt->get_result()->fetch_assoc()['c'];

        $stmt = $db->prepare("SELECT COUNT(*) as c FROM penduduk WHERE keluarga_id IN (SELECT k.id FROM keluarga k JOIN rt ON k.rt_id = rt.id JOIN rw ON rt.rw_id = rw.id WHERE rw.desa_id = ?)");
        $stmt->bind_param('i', $desaId);
        $stmt->execute();
        $stats['total_penduduk'] = $stmt->get_result()->fetch_assoc()['c'];
        break;

    case 'rw':
        $rwId = $user['rw_id'];
        $stmt = $db->prepare("SELECT COUNT(*) as c FROM rt WHERE rw_id = ?");
        $stmt->bind_param('i', $rwId);
        $stmt->execute();
        $stats['total_rt'] = $stmt->get_result()->fetch_assoc()['c'];

        $stmt = $db->prepare("SELECT COUNT(*) as c FROM keluarga WHERE rt_id IN (SELECT id FROM rt WHERE rw_id = ?)");
        $stmt->bind_param('i', $rwId);
        $stmt->execute();
        $stats['total_keluarga'] = $stmt->get_result()->fetch_assoc()['c'];

        $stmt = $db->prepare("SELECT COUNT(*) as c FROM penduduk WHERE keluarga_id IN (SELECT k.id FROM keluarga k JOIN rt ON k.rt_id = rt.id WHERE rt.rw_id = ?)");
        $stmt->bind_param('i', $rwId);
        $stmt->execute();
        $stats['total_penduduk'] = $stmt->get_result()->fetch_assoc()['c'];
        break;

    case 'rt':
        $rtId = $user['rt_id'];
        $stmt = $db->prepare("SELECT COUNT(*) as c FROM keluarga WHERE rt_id = ?");
        $stmt->bind_param('i', $rtId);
        $stmt->execute();
        $stats['total_keluarga'] = $stmt->get_result()->fetch_assoc()['c'];

        $stmt = $db->prepare("SELECT COUNT(*) as c FROM penduduk WHERE keluarga_id IN (SELECT id FROM keluarga WHERE rt_id = ?)");
        $stmt->bind_param('i', $rtId);
        $stmt->execute();
        $stats['total_penduduk'] = $stmt->get_result()->fetch_assoc()['c'];

        // Aktivitas terbaru
        $stmt = $db->prepare("SELECT jenis_aktivitas, COUNT(*) as c FROM aktivitas_penduduk WHERE rt_id = ? GROUP BY jenis_aktivitas");
        $stmt->bind_param('i', $rtId);
        $stmt->execute();
        $result = $stmt->get_result();
        $stats['aktivitas'] = [];
        while ($row = $result->fetch_assoc()) {
            $stats['aktivitas'][$row['jenis_aktivitas']] = (int)$row['c'];
        }
        break;
}

jsonResponse($stats);
