<?php
require_once 'config.php';

$results = [];

try {
    // 1. Create sys_users table
    $conn->exec("CREATE TABLE IF NOT EXISTS `sys_users` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `nama_lengkap` VARCHAR(100) NOT NULL,
        `username` VARCHAR(50) UNIQUE NOT NULL,
        `email` VARCHAR(100),
        `password_hash` VARCHAR(255) NOT NULL,
        `role` ENUM('superadmin','admin','operator') DEFAULT 'operator',
        `kode_cabang` VARCHAR(20),
        `status_aktif` TINYINT(1) DEFAULT 1,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    $results[] = "✅ Tabel sys_users siap.";

    // Insert default admin if not exists
    $check = $conn->query("SELECT COUNT(*) FROM sys_users WHERE username = 'admin'")->fetchColumn();
    if ($check == 0) {
        $stmt = $conn->prepare("INSERT INTO sys_users (nama_lengkap, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute(['Administrator', 'admin', 'admin@pdam-smart.com', password_hash('admin123', PASSWORD_BCRYPT), 'superadmin']);
        $results[] = "✅ Default admin user dibuat (user: admin, pass: admin123).";
    } else {
        $results[] = "ℹ️ Admin user sudah ada.";
    }

    // 2. Create app_config table
    $conn->exec("CREATE TABLE IF NOT EXISTS `app_config` (
        `config_key` VARCHAR(100) PRIMARY KEY,
        `config_value` TEXT,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    $results[] = "✅ Tabel app_config siap.";

    // Insert default config values
    $defaults = [
        ['app_name', 'PDAM SMART'],
        ['app_tagline', 'Sistem Informasi Cater PDAM'],
        ['denda_keterlambatan', '15000'],
        ['jatuh_tempo', '20'],
        ['logo_path', 'logo.png'],
        ['last_backup', ''],
    ];
    $stmt = $conn->prepare("INSERT IGNORE INTO app_config (config_key, config_value) VALUES (?, ?)");
    foreach ($defaults as $d) {
        $stmt->execute($d);
    }
    $results[] = "✅ Konfigurasi default app_config dimuat.";

    // 3. Create activity_logs table
    $conn->exec("CREATE TABLE IF NOT EXISTS `activity_logs` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` INT DEFAULT NULL,
        `username` VARCHAR(50) DEFAULT 'system',
        `action` VARCHAR(100) NOT NULL,
        `detail` TEXT,
        `ip_address` VARCHAR(45),
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    $results[] = "✅ Tabel activity_logs siap.";

    // Insert initial log
    $conn->exec("INSERT IGNORE INTO activity_logs (username, action, detail) VALUES ('system', 'Inisialisasi Sistem', 'Tabel pengaturan berhasil dibuat.')");
    $results[] = "✅ Log awal dicatat.";

    echo json_encode(['success' => true, 'messages' => $results]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
