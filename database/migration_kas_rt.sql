-- ============================================================
-- Migration: Kas RT – Iuran Warga & Kas Operasional RT
-- ============================================================

-- ---- 1. Iuran Warga ----------------------------------------
-- Tracks monthly dues per household (keluarga) per RT.
-- When status = 'lunas', a matching pemasukan row in kas_rt
-- is created automatically by the backend.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS iuran_warga (
    id           INT           AUTO_INCREMENT PRIMARY KEY,
    rt_id        INT           NOT NULL,
    keluarga_id  INT           NOT NULL,
    bulan        TINYINT UNSIGNED  NOT NULL COMMENT '1–12',
    tahun        SMALLINT UNSIGNED NOT NULL,
    jumlah       INT           NOT NULL DEFAULT 0,
    status       ENUM('belum','lunas') NOT NULL DEFAULT 'belum',
    keterangan   VARCHAR(255)  DEFAULT NULL,
    created_by   INT           NOT NULL,
    created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_iuran_kk_bulan (rt_id, keluarga_id, bulan, tahun),

    CONSTRAINT fk_iuran_rt       FOREIGN KEY (rt_id)       REFERENCES rt(id)       ON DELETE CASCADE,
    CONSTRAINT fk_iuran_keluarga FOREIGN KEY (keluarga_id) REFERENCES keluarga(id) ON DELETE CASCADE,
    CONSTRAINT fk_iuran_user     FOREIGN KEY (created_by)  REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---- 2. Kas RT -----------------------------------------------
-- General ledger for RT cash: both income (pemasukan) and
-- expenses (pengeluaran). Income from iuran links back to
-- iuran_warga via iuran_id.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kas_rt (
    id          INT  AUTO_INCREMENT PRIMARY KEY,
    rt_id       INT  NOT NULL,
    jenis       ENUM('pemasukan','pengeluaran') NOT NULL,
    kategori    VARCHAR(100) NOT NULL DEFAULT 'Lainnya',
    jumlah      INT  NOT NULL DEFAULT 0,
    keterangan  TEXT DEFAULT NULL,
    tanggal     DATE NOT NULL,
    iuran_id    INT  DEFAULT NULL COMMENT 'FK ke iuran_warga jika berasal dari iuran',
    created_by  INT  NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_kas_rt         FOREIGN KEY (rt_id)     REFERENCES rt(id)          ON DELETE CASCADE,
    CONSTRAINT fk_kas_iuran      FOREIGN KEY (iuran_id)  REFERENCES iuran_warga(id) ON DELETE SET NULL,
    CONSTRAINT fk_kas_user       FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
