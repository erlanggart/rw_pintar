<?php

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "Script ini hanya bisa dijalankan melalui CLI.\n");
    exit(1);
}

$_SERVER['REQUEST_METHOD'] = 'CLI';

require_once __DIR__ . '/../config/database.php';

function normalizeText(?string $value): string {
    $value = trim((string) $value);
    if ($value === '') {
        return '';
    }

    $value = preg_replace('/\s+/u', ' ', $value);

    if (function_exists('mb_strtoupper')) {
        return mb_strtoupper($value, 'UTF-8');
    }

    return strtoupper($value);
}

function normalizeAgama(string $value): string {
    $agama = normalizeText($value);

    $map = [
        'ISLAM' => 'Islam',
        'KRISTEN' => 'Kristen',
        'KATHOLIK' => 'Katolik',
        'KATOLIK' => 'Katolik',
        'HINDU' => 'Hindu',
        'BUDDHA' => 'Buddha',
        'KONGHUCU' => 'Konghucu',
    ];

    return $map[$agama] ?? 'Lainnya';
}

function parseDateValue(string $raw): ?DateTimeImmutable {
    $raw = trim($raw);
    if ($raw === '') {
        return null;
    }

    $parts = preg_split('/[^0-9]+/', $raw);
    $parts = array_values(array_filter($parts, static fn ($part) => $part !== ''));

    if (count($parts) !== 3) {
        return null;
    }

    [$day, $month, $year] = $parts;

    if (strlen($year) === 2) {
        $year = ((int) $year <= (int) date('y')) ? '20' . $year : '19' . $year;
    }

    if (strlen($day) === 1) {
        $day = '0' . $day;
    }

    if (strlen($month) === 1) {
        $month = '0' . $month;
    }

    if (!ctype_digit($day) || !ctype_digit($month) || !ctype_digit($year)) {
        return null;
    }

    if (!checkdate((int) $month, (int) $day, (int) $year)) {
        return null;
    }

    return DateTimeImmutable::createFromFormat('!Y-m-d', sprintf('%s-%s-%s', $year, $month, $day)) ?: null;
}

function deriveDateFromNik(string $nik, string $gender): ?DateTimeImmutable {
    if (!preg_match('/^\d{16}$/', $nik)) {
        return null;
    }

    $dateCode = substr($nik, 6, 6);
    $day = (int) substr($dateCode, 0, 2);
    $month = (int) substr($dateCode, 2, 2);
    $year = (int) substr($dateCode, 4, 2);

    if ($gender === 'P' && $day > 40) {
        $day -= 40;
    }

    if ($day <= 0 || $month <= 0) {
        return null;
    }

    $fullYear = $year <= (int) date('y') ? 2000 + $year : 1900 + $year;

    if (!checkdate($month, $day, $fullYear)) {
        return null;
    }

    return DateTimeImmutable::createFromFormat('!Y-m-d', sprintf('%04d-%02d-%02d', $fullYear, $month, $day)) ?: null;
}

function buildNikDateCode(DateTimeImmutable $date, string $gender): string {
    $day = (int) $date->format('d');
    if ($gender === 'P') {
        $day += 40;
    }

    return sprintf('%02d%s', $day, $date->format('my'));
}

function normalizeNik(string $rawNik, ?DateTimeImmutable $birthDate, string $gender): ?string {
    $digits = preg_replace('/\D+/', '', $rawNik);

    if ($digits === '') {
        return null;
    }

    if (strlen($digits) === 16) {
        return $digits;
    }

    if ($birthDate === null || strlen($digits) < 10) {
        return null;
    }

    $areaCode = substr($digits, 0, 6);
    $serialRaw = substr($digits, 12);
    $serial = strlen($serialRaw) >= 4
        ? substr($serialRaw, -4)
        : str_pad($serialRaw, 4, '0', STR_PAD_LEFT);

    if (strlen($areaCode) !== 6 || strlen($serial) !== 4) {
        return null;
    }

    return $areaCode . buildNikDateCode($birthDate, $gender) . $serial;
}

function hubunganKeluarga(array $member, int $index): string {
    if ($index === 0) {
        return 'Kepala Keluarga';
    }

    if (!empty($member['marker_istri'])) {
        return 'Istri';
    }

    if (!empty($member['marker_anak'])) {
        return 'Anak';
    }

    if (!empty($member['marker_family'])) {
        return 'Famili Lain';
    }

    return 'Lainnya';
}

function statusPerkawinan(string $hubungan, int $familySize): string {
    if ($hubungan === 'Istri') {
        return 'Kawin';
    }

    if ($hubungan === 'Kepala Keluarga' && $familySize > 1) {
        return 'Kawin';
    }

    return 'Belum Kawin';
}

function generateNoKk(string $rwNumber, string $rtNumber, int $sequence): string {
    return sprintf('%s%s0000%06d', str_pad($rwNumber, 3, '0', STR_PAD_LEFT), str_pad($rtNumber, 3, '0', STR_PAD_LEFT), $sequence);
}

function buildAlamat(array $metadata, array $family): string {
    $parts = [];

    if (!empty($metadata['alamat'])) {
        $parts[] = normalizeText($metadata['alamat']);
    }

    foreach ($family['members'] as $member) {
        foreach (['alamat_dalam_desa', 'alamat_asal', 'alamat_domisili'] as $field) {
            if (!empty($member[$field])) {
                $parts[] = normalizeText($member[$field]);
            }
        }
    }

    $parts = array_values(array_unique(array_filter($parts)));

    return implode(', ', $parts);
}

function readCsvRows(string $filePath): array {
    $handle = fopen($filePath, 'rb');
    if ($handle === false) {
        throw new RuntimeException('File CSV tidak dapat dibuka.');
    }

    $rows = [];
    while (($row = fgetcsv($handle, 0, ';', '"', '\\')) !== false) {
        if (!empty($row) && isset($row[0])) {
            $row[0] = preg_replace('/^\xEF\xBB\xBF/', '', (string) $row[0]);
        }
        $rows[] = $row;
    }

    fclose($handle);

    return $rows;
}

function extractMetadata(array $rows): array {
    $metadata = [
        'rw' => '',
        'rt' => '',
        'alamat' => '',
        'desa' => '',
        'kecamatan' => '',
        'kabupaten' => '',
        'provinsi' => '',
        'data_start' => 0,
    ];

    foreach ($rows as $index => $row) {
        $firstCell = normalizeText($row[0] ?? '');
        if ($firstCell === 'NO') {
            $metadata['data_start'] = $index + 3;
            break;
        }

        $label = normalizeText($row[0] ?? '');
        $value = '';
        for ($cellIndex = 1; $cellIndex < count($row); $cellIndex++) {
            $candidate = trim((string) $row[$cellIndex]);
            if ($candidate !== '') {
                $value = ltrim($candidate, ':');
                break;
            }
        }

        if ($label === 'RT') {
            $metadata['rt'] = preg_replace('/\D+/', '', $value);
        } elseif ($label === 'RW') {
            $metadata['rw'] = preg_replace('/\D+/', '', $value);
        } elseif ($label === 'ALAMAT') {
            $metadata['alamat'] = $value;
        } elseif ($label === 'DESA') {
            $metadata['desa'] = $value;
        } elseif ($label === 'KECAMATAN') {
            $metadata['kecamatan'] = $value;
        } elseif ($label === 'KABUPATEN') {
            $metadata['kabupaten'] = $value;
        } elseif ($label === 'PROVINSI') {
            $metadata['provinsi'] = $value;
        }
    }

    return $metadata;
}

function buildFamilies(array $rows, int $startIndex): array {
    $families = [];
    $currentFamily = null;

    for ($index = $startIndex; $index < count($rows); $index++) {
        $row = array_pad($rows[$index], 15, '');
        $name = trim((string) $row[1]);

        if ($name === '') {
            continue;
        }

        $familyNumber = trim((string) $row[0]);
        if ($familyNumber !== '') {
            if ($currentFamily !== null) {
                $families[] = $currentFamily;
            }

            $currentFamily = [
                'sequence' => (int) $familyNumber,
                'members' => [],
            ];
        }

        if ($currentFamily === null) {
            continue;
        }

        $currentFamily['members'][] = [
            'name' => $row[1],
            'raw_nik' => $row[2],
            'gender' => normalizeText($row[3]) === 'P' ? 'P' : 'L',
            'birth_place' => $row[4],
            'birth_date' => $row[5],
            'religion' => $row[6],
            'job' => $row[7],
            'marker_suami' => trim((string) $row[8]),
            'marker_istri' => trim((string) $row[9]),
            'marker_anak' => trim((string) $row[10]),
            'marker_family' => trim((string) $row[11]),
            'alamat_dalam_desa' => $row[12],
            'alamat_asal' => $row[13],
            'alamat_domisili' => $row[14],
            'source_line' => $index + 1,
        ];
    }

    if ($currentFamily !== null) {
        $families[] = $currentFamily;
    }

    return $families;
}

if ($argc < 2) {
    fwrite(STDERR, "Pemakaian: php backend/scripts/import_rekap_csv.php <path_csv>\n");
    exit(1);
}

$filePath = $argv[1];
if (!is_file($filePath)) {
    fwrite(STDERR, "File tidak ditemukan: {$filePath}\n");
    exit(1);
}

$rows = readCsvRows($filePath);
$metadata = extractMetadata($rows);

if ($metadata['rw'] === '' || $metadata['rt'] === '' || $metadata['data_start'] <= 0) {
    fwrite(STDERR, "Header RW/RT atau posisi data pada CSV tidak valid.\n");
    exit(1);
}

$families = buildFamilies($rows, $metadata['data_start']);
if (count($families) === 0) {
    fwrite(STDERR, "Tidak ada data keluarga yang dapat diimpor.\n");
    exit(1);
}

$db = getDB();

$targetStmt = $db->prepare("SELECT rt.id AS rt_id, rw.id AS rw_id, rw.desa_id, rw.nomor_rw, rt.nomor_rt FROM rt JOIN rw ON rw.id = rt.rw_id WHERE rw.nomor_rw = ? AND rt.nomor_rt = ? LIMIT 1");
$rwNumber = str_pad($metadata['rw'], 3, '0', STR_PAD_LEFT);
$rtNumber = str_pad($metadata['rt'], 3, '0', STR_PAD_LEFT);
$targetStmt->bind_param('ss', $rwNumber, $rtNumber);
$targetStmt->execute();
$target = $targetStmt->get_result()->fetch_assoc();

if (!$target) {
    fwrite(STDERR, "RT {$rtNumber} / RW {$rwNumber} tidak ditemukan di database.\n");
    exit(1);
}

$countStmt = $db->prepare("SELECT COUNT(*) AS keluarga_count FROM keluarga WHERE rt_id = ?");
$countStmt->bind_param('i', $target['rt_id']);
$countStmt->execute();
$existingFamilyCount = (int) ($countStmt->get_result()->fetch_assoc()['keluarga_count'] ?? 0);

if ($existingFamilyCount > 0) {
    fwrite(STDERR, "RT {$rtNumber} / RW {$rwNumber} sudah memiliki {$existingFamilyCount} keluarga. Impor dibatalkan untuk menghindari duplikasi.\n");
    exit(1);
}

$existingNikStmt = $db->prepare("SELECT id FROM penduduk WHERE nik = ? LIMIT 1");
$insertFamilyStmt = $db->prepare("INSERT INTO keluarga (rt_id, no_kk, kepala_keluarga, nik_kepala, alamat, kelurahan, kecamatan, kabupaten, provinsi, status_kk) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Menetap')");
$insertPendudukStmt = $db->prepare("INSERT INTO penduduk (keluarga_id, nik, nama_lengkap, tempat_lahir, tanggal_lahir, jenis_kelamin, agama, status_perkawinan, pekerjaan, pendidikan, hubungan_keluarga, status_penduduk) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Tidak Sekolah', ?, 'Tetap')");

$seenNik = [];
$stats = [
    'families_inserted' => 0,
    'families_skipped' => 0,
    'penduduk_inserted' => 0,
    'duplicate_nik_skipped' => 0,
    'nik_corrected' => 0,
    'date_derived_from_nik' => 0,
    'date_null' => 0,
];

$db->begin_transaction();

try {
    foreach ($families as $family) {
        $normalizedMembers = [];

        foreach ($family['members'] as $index => $member) {
            $birthDate = parseDateValue((string) $member['birth_date']);
            $normalizedNik = normalizeNik((string) $member['raw_nik'], $birthDate, $member['gender']);

            if ($normalizedNik !== null && $normalizedNik !== preg_replace('/\D+/', '', (string) $member['raw_nik'])) {
                $stats['nik_corrected']++;
            }

            if ($birthDate === null && $normalizedNik !== null) {
                $birthDate = deriveDateFromNik($normalizedNik, $member['gender']);
                if ($birthDate !== null) {
                    $stats['date_derived_from_nik']++;
                }
            }

            if ($birthDate === null) {
                $stats['date_null']++;
            }

            if ($normalizedNik === null) {
                throw new RuntimeException(sprintf('NIK tidak bisa dinormalisasi untuk %s di baris %d.', $member['name'], $member['source_line']));
            }

            if (isset($seenNik[$normalizedNik])) {
                $stats['duplicate_nik_skipped']++;
                continue;
            }

            $existingNikStmt->bind_param('s', $normalizedNik);
            $existingNikStmt->execute();
            if ($existingNikStmt->get_result()->fetch_assoc()) {
                $stats['duplicate_nik_skipped']++;
                continue;
            }

            $member['nik'] = $normalizedNik;
            $member['birth_date_normalized'] = $birthDate ? $birthDate->format('Y-m-d') : null;
            $member['name'] = normalizeText((string) $member['name']);
            $member['birth_place'] = normalizeText((string) $member['birth_place']);
            $member['job'] = normalizeText((string) $member['job']);
            $member['agama'] = normalizeAgama((string) $member['religion']);
            $member['relation'] = hubunganKeluarga($member, count($normalizedMembers));

            $normalizedMembers[] = $member;
            $seenNik[$normalizedNik] = true;
        }

        if (count($normalizedMembers) === 0) {
            $stats['families_skipped']++;
            continue;
        }

        $kepala = $normalizedMembers[0];
        $noKk = generateNoKk($rwNumber, $rtNumber, (int) $family['sequence']);
        $alamat = buildAlamat($metadata, ['members' => $normalizedMembers]);
        $kelurahan = normalizeText($metadata['desa']);
        $kecamatan = normalizeText($metadata['kecamatan']);
        $kabupaten = normalizeText($metadata['kabupaten']);
        $provinsi = normalizeText($metadata['provinsi']);

        $rtId = (int) $target['rt_id'];
        $kepalaNama = $kepala['name'];
        $nikKepala = $kepala['nik'];
        $insertFamilyStmt->bind_param('issssssss', $rtId, $noKk, $kepalaNama, $nikKepala, $alamat, $kelurahan, $kecamatan, $kabupaten, $provinsi);
        if (!$insertFamilyStmt->execute()) {
            throw new RuntimeException('Gagal menyimpan keluarga: ' . $insertFamilyStmt->error);
        }

        $keluargaId = $db->insert_id;
        $stats['families_inserted']++;

        foreach ($normalizedMembers as $member) {
            $statusPerkawinan = statusPerkawinan($member['relation'], count($normalizedMembers));
            $birthDateSql = $member['birth_date_normalized'];
            $insertPendudukStmt->bind_param(
                'isssssssss',
                $keluargaId,
                $member['nik'],
                $member['name'],
                $member['birth_place'],
                $birthDateSql,
                $member['gender'],
                $member['agama'],
                $statusPerkawinan,
                $member['job'],
                $member['relation']
            );

            if (!$insertPendudukStmt->execute()) {
                throw new RuntimeException('Gagal menyimpan penduduk: ' . $insertPendudukStmt->error);
            }

            $stats['penduduk_inserted']++;
        }
    }

    $db->commit();
} catch (Throwable $exception) {
    $db->rollback();
    fwrite(STDERR, $exception->getMessage() . "\n");
    exit(1);
}

echo json_encode([
    'status' => 'success',
    'target' => [
        'rt_id' => (int) $target['rt_id'],
        'rt' => $target['nomor_rt'],
        'rw_id' => (int) $target['rw_id'],
        'rw' => $target['nomor_rw'],
    ],
    'summary' => $stats,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL;