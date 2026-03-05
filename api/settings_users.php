<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

function logActivity($conn, $username, $action, $detail) {
    try {
        $stmt = $conn->prepare("INSERT INTO activity_logs (username, action, detail, ip_address) VALUES (?, ?, ?, ?)");
        $stmt->execute([$username, $action, $detail, $_SERVER['REMOTE_ADDR'] ?? '']);
    } catch (Exception $e) {}
}

switch ($method) {
    case 'GET':
        $search = $_GET['search'] ?? '';
        if ($search) {
            $stmt = $conn->prepare("SELECT id, nama_lengkap, username, email, role, kode_cabang, status_aktif, created_at FROM sys_users WHERE (nama_lengkap LIKE ? OR username LIKE ? OR role LIKE ?) ORDER BY created_at DESC");
            $like = "%$search%";
            $stmt->execute([$like, $like, $like]);
        } else {
            $stmt = $conn->query("SELECT id, nama_lengkap, username, email, role, kode_cabang, status_aktif, created_at FROM sys_users ORDER BY created_at DESC");
        }
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Attach branch name
        $stmtb = $conn->prepare("SELECT cabang FROM cabang WHERE kode_cabang = ?");
        foreach ($users as &$u) {
            if ($u['kode_cabang']) {
                $stmtb->execute([$u['kode_cabang']]);
                $b = $stmtb->fetch(PDO::FETCH_ASSOC);
                $u['cabang_nama'] = $b ? $b['cabang'] : $u['kode_cabang'];
            } else {
                $u['cabang_nama'] = 'Semua Cabang';
            }
        }
        echo json_encode($users);
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $id          = $_GET['id'] ?? null;
        $nama        = trim($data['nama_lengkap'] ?? '');
        $username    = trim($data['username'] ?? '');
        $email       = trim($data['email'] ?? '');
        $role        = $data['role'] ?? 'operator';
        $kode_cabang = $data['kode_cabang'] ?? null;
        $status_aktif = isset($data['status_aktif']) ? (int)$data['status_aktif'] : 1;

        if (empty($nama) || empty($username)) {
            http_response_code(400);
            echo json_encode(['error' => 'Nama dan username wajib diisi.']);
            break;
        }

        if ($id) {
            // Update
            $sql = "UPDATE sys_users SET nama_lengkap=?, username=?, email=?, role=?, kode_cabang=?, status_aktif=? WHERE id=?";
            $params = [$nama, $username, $email, $role, $kode_cabang ?: null, $status_aktif, $id];

            // Update password only if provided
            if (!empty($data['new_password'])) {
                if (strlen($data['new_password']) < 8) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Password minimal 8 karakter.']);
                    break;
                }
                $sql = "UPDATE sys_users SET nama_lengkap=?, username=?, email=?, role=?, kode_cabang=?, status_aktif=?, password_hash=? WHERE id=?";
                $params = [$nama, $username, $email, $role, $kode_cabang ?: null, $status_aktif, password_hash($data['new_password'], PASSWORD_BCRYPT), $id];
            }

            $stmt = $conn->prepare($sql);
            $stmt->execute($params);
            logActivity($conn, 'admin', 'Update User', "Memperbarui user: $nama ($username)");
            echo json_encode(['success' => true, 'message' => 'User berhasil diperbarui.']);
        } else {
            // Create
            $password = $data['password'] ?? 'password123';
            if (strlen($password) < 8) {
                http_response_code(400);
                echo json_encode(['error' => 'Password minimal 8 karakter.']);
                break;
            }

            // Check unique username
            $check = $conn->prepare("SELECT COUNT(*) FROM sys_users WHERE username = ?");
            $check->execute([$username]);
            if ($check->fetchColumn() > 0) {
                http_response_code(409);
                echo json_encode(['error' => 'Username sudah digunakan.']);
                break;
            }

            $stmt = $conn->prepare("INSERT INTO sys_users (nama_lengkap, username, email, password_hash, role, kode_cabang, status_aktif) VALUES (?,?,?,?,?,?,?)");
            $stmt->execute([$nama, $username, $email, password_hash($password, PASSWORD_BCRYPT), $role, $kode_cabang ?: null, $status_aktif]);
            logActivity($conn, 'admin', 'Tambah User', "Menambahkan user baru: $nama ($username)");
            echo json_encode(['success' => true, 'message' => 'User baru berhasil ditambahkan.', 'id' => $conn->lastInsertId()]);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) { http_response_code(400); echo json_encode(['error' => 'ID diperlukan']); break; }

        $stmt = $conn->prepare("SELECT username FROM sys_users WHERE id = ?");
        $stmt->execute([$id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        $stmt = $conn->prepare("UPDATE sys_users SET status_aktif = 0 WHERE id = ?");
        $stmt->execute([$id]);
        if ($user) logActivity($conn, 'admin', 'Non-aktif User', "Me-nonaktifkan user: {$user['username']}");
        echo json_encode(['success' => true, 'message' => 'User berhasil dinonaktifkan.']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
?>
