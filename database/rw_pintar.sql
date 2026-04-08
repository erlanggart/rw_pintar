-- ============================================
-- DATABASE: RW Pintar - Aplikasi Pendataan Penduduk
-- ============================================

CREATE DATABASE IF NOT EXISTS rw_pintar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rw_pintar;

-- ============================================
-- TABEL DESA
-- ============================================
CREATE TABLE desa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_desa VARCHAR(100) NOT NULL,
    kode_desa VARCHAR(20) UNIQUE,
    alamat TEXT,
    kecamatan VARCHAR(100),
    kabupaten VARCHAR(100),
    provinsi VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- TABEL RW
-- ============================================
CREATE TABLE rw (
    id INT AUTO_INCREMENT PRIMARY KEY,
    desa_id INT NOT NULL,
    nomor_rw VARCHAR(10) NOT NULL,
    nama_ketua VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (desa_id) REFERENCES desa(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- TABEL RT
-- ============================================
CREATE TABLE rt (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rw_id INT NOT NULL,
    nomor_rt VARCHAR(10) NOT NULL,
    nama_ketua VARCHAR(100),
    alamat_sekretariat TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rw_id) REFERENCES rw(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- TABEL USERS (Multi-role)
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    role ENUM('superadmin', 'desa', 'rw', 'rt') NOT NULL,
    desa_id INT DEFAULT NULL,
    rw_id INT DEFAULT NULL,
    rt_id INT DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (desa_id) REFERENCES desa(id) ON DELETE SET NULL,
    FOREIGN KEY (rw_id) REFERENCES rw(id) ON DELETE SET NULL,
    FOREIGN KEY (rt_id) REFERENCES rt(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================
-- TABEL KELUARGA (KK - Kartu Keluarga)
-- ============================================
CREATE TABLE keluarga (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rt_id INT NOT NULL,
    no_kk VARCHAR(16) NOT NULL UNIQUE,
    kepala_keluarga VARCHAR(100) NOT NULL,
    nik_kepala VARCHAR(16),
    alamat TEXT NOT NULL,
    kelurahan VARCHAR(100),
    kecamatan VARCHAR(100),
    kabupaten VARCHAR(100),
    provinsi VARCHAR(100),
    kode_pos VARCHAR(10),
    status_kk ENUM('Menetap', 'Tidak Menetap') DEFAULT 'Menetap',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rt_id) REFERENCES rt(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- TABEL PENDUDUK (Data KTP Lengkap)
-- ============================================
CREATE TABLE penduduk (
    id INT AUTO_INCREMENT PRIMARY KEY,
    keluarga_id INT NOT NULL,
    nik VARCHAR(16) NOT NULL UNIQUE,
    nama_lengkap VARCHAR(100) NOT NULL,
    tempat_lahir VARCHAR(100),
    tanggal_lahir DATE,
    jenis_kelamin ENUM('L', 'P') NOT NULL,
    golongan_darah ENUM('A', 'B', 'AB', 'O', '-') DEFAULT '-',
    agama ENUM('Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya') NOT NULL,
    status_perkawinan ENUM('Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati') DEFAULT 'Belum Kawin',
    pekerjaan VARCHAR(100),
    pendidikan ENUM('Tidak Sekolah', 'SD', 'SMP', 'SMA', 'D1', 'D2', 'D3', 'S1', 'S2', 'S3') DEFAULT 'Tidak Sekolah',
    kewarganegaraan ENUM('WNI', 'WNA') DEFAULT 'WNI',
    hubungan_keluarga ENUM('Kepala Keluarga', 'Istri', 'Anak', 'Menantu', 'Cucu', 'Orang Tua', 'Mertua', 'Famili Lain', 'Lainnya') NOT NULL,
    no_telepon VARCHAR(20),
    status_penduduk ENUM('Tetap', 'Sementara') DEFAULT 'Tetap',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (keluarga_id) REFERENCES keluarga(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- TABEL AKTIVITAS PENDUDUK (Lahir, Mati, Pindah, Datang)
-- ============================================
CREATE TABLE aktivitas_penduduk (
    id INT AUTO_INCREMENT PRIMARY KEY,
    penduduk_id INT DEFAULT NULL,
    keluarga_id INT DEFAULT NULL,
    rt_id INT NOT NULL,
    jenis_aktivitas ENUM('Lahir', 'Mati', 'Pindah', 'Datang') NOT NULL,
    tanggal_aktivitas DATE NOT NULL,
    keterangan TEXT,
    -- Data untuk Lahir
    nama_bayi VARCHAR(100),
    jenis_kelamin_bayi ENUM('L', 'P'),
    -- Data untuk Mati
    penyebab_kematian VARCHAR(255),
    -- Data untuk Pindah
    alamat_tujuan TEXT,
    alasan_pindah VARCHAR(255),
    -- Data untuk Datang
    alamat_asal TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (penduduk_id) REFERENCES penduduk(id) ON DELETE SET NULL,
    FOREIGN KEY (keluarga_id) REFERENCES keluarga(id) ON DELETE SET NULL,
    FOREIGN KEY (rt_id) REFERENCES rt(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- SEED DATA: Default Accounts
-- ============================================

-- Desa default
INSERT INTO desa (id, nama_desa, kode_desa, alamat, kecamatan, kabupaten, provinsi) VALUES 
(1, 'Desa Susukan', 'DSA001', 'Jl. Desa Susukan No. 1', '', '', '');

-- RW default
INSERT INTO rw (id, desa_id, nomor_rw, nama_ketua) VALUES 
(1, 1, '001', 'Ketua RW 001');

-- RT default
INSERT INTO rt (id, rw_id, nomor_rt, nama_ketua) VALUES 
(1, 1, '001', 'Ketua RT 001');

-- Users (password: password123 - hashed with PHP password_hash)
-- $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi = password123
INSERT INTO users (username, password, nama_lengkap, role, desa_id, rw_id, rt_id) VALUES 
('superadmin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Super Administrator', 'superadmin', NULL, NULL, NULL),
('admin_desa', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin Desa Susukan', 'desa', 1, NULL, NULL),
('admin_rw', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin RW 001', 'rw', NULL, 1, NULL),
('admin_rt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin RT 001', 'rt', NULL, NULL, 1);
