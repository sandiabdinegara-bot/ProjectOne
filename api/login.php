<?php
session_start();
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'login';

if ($method === 'GET' && $action === 'check_session') {
    if (isset($_SESSION['user_id'])) {
        // Always re-fetch from DB to ensure role/data is fresh (prevents stale session issues)
        try {
            $stmt = $conn->prepare("SELECT id, nama_lengkap, username, role, kode_cabang FROM sys_users WHERE id = ? AND status_aktif = 1");
            $stmt->execute([$_SESSION['user_id']]);
            $freshUser = $stmt->fetch();
            if ($freshUser) {
                $_SESSION['user_info'] = $freshUser;
                echo json_encode(['logged_in' => true, 'user' => $freshUser]);
            } else {
                // User no longer active, destroy session
                session_destroy();
                echo json_encode(['logged_in' => false]);
            }
        } catch (Exception $e) {
            // Fallback to cached session data if DB fails
            echo json_encode(['logged_in' => true, 'user' => $_SESSION['user_info']]);
        }
    } else {
        echo json_encode(['logged_in' => false]);
    }
    exit();
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($username) || empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Username and password are required.']);
        exit();
    }

    try {
        $stmt = $conn->prepare("SELECT * FROM sys_users WHERE username = ? AND status_aktif = 1");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            // Success
            $userInfo = [
                'id' => $user['id'],
                'nama_lengkap' => $user['nama_lengkap'],
                'username' => $user['username'],
                'role' => $user['role'],
                'kode_cabang' => $user['kode_cabang']
            ];

            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_info'] = $userInfo;

            // Log activity
            try {
                $logStmt = $conn->prepare("INSERT INTO activity_logs (username, action, detail, ip_address) VALUES (?, ?, ?, ?)");
                $logStmt->execute([$username, 'Login', 'User logged in successfully', $_SERVER['REMOTE_ADDR'] ?? '']);
            } catch (Exception $e) {}

            echo json_encode(['success' => true, 'user' => $userInfo]);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Username atau password salah.']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>
