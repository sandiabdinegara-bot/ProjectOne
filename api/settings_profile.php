<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Helper: log activity
function logActivity($conn, $username, $action, $detail) {
    try {
        $stmt = $conn->prepare("INSERT INTO activity_logs (username, action, detail, ip_address) VALUES (?, ?, ?, ?)");
        $stmt->execute([$username, $action, $detail, $_SERVER['REMOTE_ADDR'] ?? '']);
    } catch (Exception $e) {
        // Silent fail for logging to ensure main action continues
    }
}

switch ($method) {
    case 'GET':
        // Return first admin user (ID 1 or superadmin)
        $stmt = $conn->query("SELECT id, nama_lengkap, username, email, role, kode_cabang, status_aktif, created_at FROM sys_users WHERE role = 'superadmin' LIMIT 1");
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$user) {
            $stmt = $conn->query("SELECT id, nama_lengkap, username, email, role, kode_cabang, status_aktif, created_at FROM sys_users ORDER BY id ASC LIMIT 1");
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        echo json_encode($user ?: ['error' => 'No user found']);
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $action = $data['action'] ?? 'update_profile';

        if ($action === 'update_profile') {
            $id          = $data['id'] ?? 1;
            $nama        = trim($data['nama_lengkap'] ?? '');
            $email       = trim($data['email'] ?? '');
            $username    = trim($data['username'] ?? '');

            if (empty($nama) || empty($username)) {
                sendError('Nama dan username tidak boleh kosong.', null, 400);
            }

            $stmt = $conn->prepare("UPDATE sys_users SET nama_lengkap = ?, email = ?, username = ? WHERE id = ?");
            $stmt->execute([$nama, $email, $username, $id]);
            logActivity($conn, $username, 'Update Profil', "Memperbarui profil: $nama ($email)");
            echo json_encode(['success' => true, 'message' => 'Profil berhasil diperbarui.']);

        } elseif ($action === 'change_password') {
            $id           = $data['id'] ?? 1;
            $current_pass = $data['current_password'] ?? '';
            $new_pass     = $data['new_password'] ?? '';
            $confirm_pass = $data['confirm_password'] ?? '';

            if (strlen($new_pass) < 8) {
                sendError('Password baru minimal 8 karakter.', null, 400);
            }
            if ($new_pass !== $confirm_pass) {
                sendError('Konfirmasi password tidak cocok.', null, 400);
            }

            $stmt = $conn->prepare("SELECT password_hash, username FROM sys_users WHERE id = ?");
            $stmt->execute([$id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user || !password_verify($current_pass, $user['password_hash'])) {
                sendError('Password saat ini salah.', null, 401);
            }

            $new_hash = password_hash($new_pass, PASSWORD_BCRYPT);
            $stmt = $conn->prepare("UPDATE sys_users SET password_hash = ? WHERE id = ?");
            $stmt->execute([$new_hash, $id]);
            logActivity($conn, $user['username'], 'Ganti Password', 'Password berhasil diubah.');
            echo json_encode(['success' => true, 'message' => 'Password berhasil diubah.']);
        }
        break;

    default:
        sendError('Method not allowed', null, 405);
}
?>
