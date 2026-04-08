-- ============================================
-- MIGRATION: Tabel Surat Pengantar
-- ============================================

CREATE TABLE IF NOT EXISTS surat_pengantar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    desa_id INT NOT NULL,
    nomor_register INT NOT NULL,
    bulan INT NOT NULL,
    tahun INT NOT NULL,
    nomor_surat VARCHAR(50) NOT NULL,
    penduduk_id INT NOT NULL,
    keperluan TEXT NOT NULL,
    keterangan TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (desa_id) REFERENCES desa(id) ON DELETE CASCADE,
    FOREIGN KEY (penduduk_id) REFERENCES penduduk(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_register_per_desa_month (desa_id, nomor_register, bulan, tahun)
) ENGINE=InnoDB;
