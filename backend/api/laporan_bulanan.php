<?php
require_once __DIR__ . '/../config/database.php';

$user = authenticate();
$db = getDB();

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$bulan = isset($_GET['bulan']) ? (int) $_GET['bulan'] : (int) date('m');
$tahun = isset($_GET['tahun']) ? (int) $_GET['tahun'] : (int) date('Y');

if ($bulan < 1 || $bulan > 12 || $tahun < 2000 || $tahun > 2100) {
    jsonResponse(['error' => 'Parameter bulan/tahun tidak valid'], 400);
}

$startDate = sprintf('%04d-%02d-01', $tahun, $bulan);
$endDate = date('Y-m-t', strtotime($startDate));

// Determine RT IDs based on role
$rtIds = [];
switch ($user['role']) {
    case 'rt':
        if (!$user['rt_id']) {
            jsonResponse(['error' => 'User tidak terhubung dengan RT'], 400);
        }
        $rtIds = [(int) $user['rt_id']];
        break;

    case 'rw':
        if (!$user['rw_id']) {
            jsonResponse(['error' => 'User tidak terhubung dengan RW'], 400);
        }
        $rtIdParam = isset($_GET['rt_id']) ? (int) $_GET['rt_id'] : 0;
        if ($rtIdParam > 0) {
            // Verify RT belongs to this RW
            $stmt = $db->prepare("SELECT id FROM rt WHERE id = ? AND rw_id = ?");
            $stmt->bind_param('ii', $rtIdParam, $user['rw_id']);
            $stmt->execute();
            if (!$stmt->get_result()->fetch_assoc()) {
                jsonResponse(['error' => 'RT tidak ditemukan di RW Anda'], 403);
            }
            $rtIds = [$rtIdParam];
        } else {
            $stmt = $db->prepare("SELECT id FROM rt WHERE rw_id = ?");
            $stmt->bind_param('i', $user['rw_id']);
            $stmt->execute();
            $result = $stmt->get_result();
            while ($row = $result->fetch_assoc()) {
                $rtIds[] = (int) $row['id'];
            }
        }
        break;

    default:
        jsonResponse(['error' => 'Laporan bulanan hanya tersedia untuk role RT dan RW'], 403);
}

if (empty($rtIds)) {
    jsonResponse(['error' => 'Tidak ada RT ditemukan'], 404);
}

$rtPlaceholders = implode(',', array_fill(0, count($rtIds), '?'));
$rtTypes = str_repeat('i', count($rtIds));

// Get RT/RW/Desa info
$stmt = $db->prepare("
    SELECT rt.id as rt_id, rt.nomor_rt, rt.nama_ketua as ketua_rt, rt.alamat_sekretariat,
           rw.nomor_rw, rw.nama_ketua as ketua_rw,
           d.nama_desa, d.kecamatan, d.kabupaten, d.provinsi
    FROM rt
    JOIN rw ON rt.rw_id = rw.id
    JOIN desa d ON rw.desa_id = d.id
    WHERE rt.id IN ($rtPlaceholders)
");
$stmt->bind_param($rtTypes, ...$rtIds);
$stmt->execute();
$rtInfoResult = $stmt->get_result();
$rtInfoMap = [];
while ($row = $rtInfoResult->fetch_assoc()) {
    $rtInfoMap[(int) $row['rt_id']] = $row;
}

// Build report per RT
$reports = [];

foreach ($rtIds as $rtId) {
    $info = $rtInfoMap[$rtId] ?? null;
    if (!$info) continue;

    // 1. Current penduduk count (at end of period = current DB state for simplicity)
    // Count penduduk by gender and kewarganegaraan
    $stmt = $db->prepare("
        SELECT p.jenis_kelamin, p.kewarganegaraan, COUNT(*) as c
        FROM penduduk p
        JOIN keluarga k ON p.keluarga_id = k.id
        WHERE k.rt_id = ?
        GROUP BY p.jenis_kelamin, p.kewarganegaraan
    ");
    $stmt->bind_param('i', $rtId);
    $stmt->execute();
    $result = $stmt->get_result();

    $penduduk = ['wni_l' => 0, 'wni_p' => 0, 'wna_l' => 0, 'wna_p' => 0];
    while ($row = $result->fetch_assoc()) {
        $key = strtolower($row['kewarganegaraan']) . '_' . strtolower($row['jenis_kelamin']);
        $penduduk[$key] = (int) $row['c'];
    }

    // Count keluarga (KK) - Count by gender of kepala keluarga
    $stmt = $db->prepare("
        SELECT p.jenis_kelamin, COUNT(DISTINCT k.id) as c
        FROM keluarga k
        JOIN penduduk p ON p.keluarga_id = k.id AND p.hubungan_keluarga = 'Kepala Keluarga'
        WHERE k.rt_id = ?
        GROUP BY p.jenis_kelamin
    ");
    $stmt->bind_param('i', $rtId);
    $stmt->execute();
    $result = $stmt->get_result();
    $kk = ['l' => 0, 'p' => 0];
    while ($row = $result->fetch_assoc()) {
        $kk[strtolower($row['jenis_kelamin'])] = (int) $row['c'];
    }

    // Total keluarga count
    $stmt = $db->prepare("SELECT COUNT(*) as c FROM keluarga WHERE rt_id = ?");
    $stmt->bind_param('i', $rtId);
    $stmt->execute();
    $totalKK = (int) $stmt->get_result()->fetch_assoc()['c'];

    // 2. Monthly aktivitas counts by type
    $aktivitas = [
        'Lahir' => ['wni_l' => 0, 'wni_p' => 0, 'wna_l' => 0, 'wna_p' => 0, 'kk_l' => 0, 'kk_p' => 0],
        'Mati' => ['wni_l' => 0, 'wni_p' => 0, 'wna_l' => 0, 'wna_p' => 0, 'kk_l' => 0, 'kk_p' => 0],
        'Pindah' => ['wni_l' => 0, 'wni_p' => 0, 'wna_l' => 0, 'wna_p' => 0, 'kk_l' => 0, 'kk_p' => 0],
        'Datang' => ['wni_l' => 0, 'wni_p' => 0, 'wna_l' => 0, 'wna_p' => 0, 'kk_l' => 0, 'kk_p' => 0],
    ];

    // Lahir - use jenis_kelamin_bayi, assume WNI
    $stmt = $db->prepare("
        SELECT jenis_kelamin_bayi, COUNT(*) as c
        FROM aktivitas_penduduk
        WHERE rt_id = ? AND jenis_aktivitas = 'Lahir'
          AND tanggal_aktivitas BETWEEN ? AND ?
        GROUP BY jenis_kelamin_bayi
    ");
    $stmt->bind_param('iss', $rtId, $startDate, $endDate);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        if ($row['jenis_kelamin_bayi'] === 'L') {
            $aktivitas['Lahir']['wni_l'] = (int) $row['c'];
        } elseif ($row['jenis_kelamin_bayi'] === 'P') {
            $aktivitas['Lahir']['wni_p'] = (int) $row['c'];
        }
    }

    // Mati, Pindah, Datang - use penduduk's gender and kewarganegaraan
    foreach (['Mati', 'Pindah', 'Datang'] as $jenis) {
        $stmt = $db->prepare("
            SELECT p.jenis_kelamin, p.kewarganegaraan, COUNT(*) as c,
                   COUNT(DISTINCT a.keluarga_id) as kk_count
            FROM aktivitas_penduduk a
            LEFT JOIN penduduk p ON a.penduduk_id = p.id
            WHERE a.rt_id = ? AND a.jenis_aktivitas = ?
              AND a.tanggal_aktivitas BETWEEN ? AND ?
            GROUP BY p.jenis_kelamin, p.kewarganegaraan
        ");
        $stmt->bind_param('isss', $rtId, $jenis, $startDate, $endDate);
        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            if ($row['jenis_kelamin'] && $row['kewarganegaraan']) {
                $key = strtolower($row['kewarganegaraan']) . '_' . strtolower($row['jenis_kelamin']);
                $aktivitas[$jenis][$key] = (int) $row['c'];
            }
        }

        // Count affected KK by gender of kepala for this jenis
        $stmt = $db->prepare("
            SELECT p.jenis_kelamin, COUNT(DISTINCT a.keluarga_id) as c
            FROM aktivitas_penduduk a
            LEFT JOIN keluarga k ON a.keluarga_id = k.id
            LEFT JOIN penduduk p ON p.keluarga_id = k.id AND p.hubungan_keluarga = 'Kepala Keluarga'
            WHERE a.rt_id = ? AND a.jenis_aktivitas = ?
              AND a.tanggal_aktivitas BETWEEN ? AND ?
              AND a.keluarga_id IS NOT NULL
            GROUP BY p.jenis_kelamin
        ");
        $stmt->bind_param('isss', $rtId, $jenis, $startDate, $endDate);
        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            if ($row['jenis_kelamin']) {
                $aktivitas[$jenis]['kk_' . strtolower($row['jenis_kelamin'])] = (int) $row['c'];
            }
        }
    }

    // Lahir KK count
    $stmt = $db->prepare("
        SELECT p.jenis_kelamin, COUNT(DISTINCT a.keluarga_id) as c
        FROM aktivitas_penduduk a
        LEFT JOIN keluarga k ON a.keluarga_id = k.id
        LEFT JOIN penduduk p ON p.keluarga_id = k.id AND p.hubungan_keluarga = 'Kepala Keluarga'
        WHERE a.rt_id = ? AND a.jenis_aktivitas = 'Lahir'
          AND a.tanggal_aktivitas BETWEEN ? AND ?
          AND a.keluarga_id IS NOT NULL
        GROUP BY p.jenis_kelamin
    ");
    $stmt->bind_param('iss', $rtId, $startDate, $endDate);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        if ($row['jenis_kelamin']) {
            $aktivitas['Lahir']['kk_' . strtolower($row['jenis_kelamin'])] = (int) $row['c'];
        }
    }

    // Pindah detail breakdown - currently no sub-category in DB,
    // so we provide total pindah as "Pindah Keluar Desa/Kelurahan" row
    $pindahDetail = [
        'desa' => ['l' => 0, 'p' => 0, 'kk_l' => 0, 'kk_p' => 0],
        'kecamatan' => ['l' => 0, 'p' => 0, 'kk_l' => 0, 'kk_p' => 0],
        'kabupaten' => ['l' => 0, 'p' => 0, 'kk_l' => 0, 'kk_p' => 0],
        'provinsi' => ['l' => 0, 'p' => 0, 'kk_l' => 0, 'kk_p' => 0],
    ];

    // Put all pindah into desa level as default
    $stmt = $db->prepare("
        SELECT p.jenis_kelamin, COUNT(*) as c
        FROM aktivitas_penduduk a
        LEFT JOIN penduduk p ON a.penduduk_id = p.id
        WHERE a.rt_id = ? AND a.jenis_aktivitas = 'Pindah'
          AND a.tanggal_aktivitas BETWEEN ? AND ?
        GROUP BY p.jenis_kelamin
    ");
    $stmt->bind_param('iss', $rtId, $startDate, $endDate);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        if ($row['jenis_kelamin']) {
            $pindahDetail['desa'][strtolower($row['jenis_kelamin'])] = (int) $row['c'];
        }
    }

    // Pindah KK detail
    $stmt = $db->prepare("
        SELECT p2.jenis_kelamin, COUNT(DISTINCT a.keluarga_id) as c
        FROM aktivitas_penduduk a
        LEFT JOIN keluarga k ON a.keluarga_id = k.id
        LEFT JOIN penduduk p2 ON p2.keluarga_id = k.id AND p2.hubungan_keluarga = 'Kepala Keluarga'
        WHERE a.rt_id = ? AND a.jenis_aktivitas = 'Pindah'
          AND a.tanggal_aktivitas BETWEEN ? AND ?
          AND a.keluarga_id IS NOT NULL
        GROUP BY p2.jenis_kelamin
    ");
    $stmt->bind_param('iss', $rtId, $startDate, $endDate);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        if ($row['jenis_kelamin']) {
            $pindahDetail['desa']['kk_' . strtolower($row['jenis_kelamin'])] = (int) $row['c'];
        }
    }

    $reports[] = [
        'rt_id' => $rtId,
        'nomor_rt' => $info['nomor_rt'],
        'ketua_rt' => $info['ketua_rt'] ?? '',
        'alamat_sekretariat' => $info['alamat_sekretariat'] ?? '',
        'nomor_rw' => $info['nomor_rw'],
        'ketua_rw' => $info['ketua_rw'] ?? '',
        'nama_desa' => $info['nama_desa'] ?? '',
        'kecamatan' => $info['kecamatan'] ?? '',
        'kabupaten' => $info['kabupaten'] ?? '',
        'provinsi' => $info['provinsi'] ?? '',
        'penduduk_sekarang' => $penduduk,
        'kk_sekarang' => $kk,
        'total_kk' => $totalKK,
        'aktivitas' => $aktivitas,
        'pindah_detail' => $pindahDetail,
    ];
}

jsonResponse([
    'bulan' => $bulan,
    'tahun' => $tahun,
    'reports' => $reports,
]);
