-- ============================================================
--  DDL: Anon Forum Database
--  Jalankan di phpMyAdmin > tab SQL
--  XAMPP MySQL | Database: anon_forum
-- ============================================================

-- 1. Buat database (jika belum ada)
CREATE DATABASE IF NOT EXISTS anon_forum
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE anon_forum;

-- ============================================================
-- 2. Tabel: posts
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
    id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    title       VARCHAR(255)    NOT NULL,
    content     TEXT            NOT NULL,
    category    VARCHAR(50)     NOT NULL DEFAULT 'general',
    views       INT UNSIGNED    NOT NULL DEFAULT 0,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_category  (category),
    INDEX idx_created   (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. Tabel: replies
-- ============================================================
CREATE TABLE IF NOT EXISTS replies (
    id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    post_id     INT UNSIGNED    NOT NULL,
    content     TEXT            NOT NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_post_id (post_id),
    CONSTRAINT fk_replies_post
        FOREIGN KEY (post_id) REFERENCES posts (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. Data contoh (opsional — hapus jika tidak diperlukan)
-- ============================================================
INSERT INTO posts (title, content, category) VALUES
('Selamat datang di Anon Forum!',
 'Ini adalah forum anonim pertama kita. Diskusikan apa saja dengan bebas dan aman. Identitas kamu tetap terjaga!',
 'general'),
('Tips privasi online terbaik 2025',
 'Gunakan VPN + browser berbasis Tor untuk browsing anonim. Jangan lupa enkripsi email kamu dengan PGP. Bagikan tips privasi kamu di sini!',
 'privacy'),
('Rekomendasi laptop untuk coding',
 'Lagi cari laptop baru untuk development. Budget sekitar 10-15 juta. Ada rekomendasi? Saya butuh RAM minimal 16GB dan baterai tahan lama.',
 'tech');
