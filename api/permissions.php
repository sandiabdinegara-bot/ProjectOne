<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $conn->query("SELECT role, feature_key, can_access FROM sys_permissions");
        $rows = $stmt->fetchAll();
        
        $permissions = [];
        foreach ($rows as $row) {
            $permissions[$row['role']][$row['feature_key']] = (int)$row['can_access'];
        }
        
        echo json_encode(['success' => true, 'data' => $permissions]);
    } catch (PDOException $e) {
        sendError("Gagal mengambil data hak akses.", $e->getMessage());
    }
} 

elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['role']) || !isset($data['feature_key']) || !isset($data['can_access'])) {
        sendError("Data tidak lengkap.");
    }
    
    try {
        $stmt = $conn->prepare("UPDATE sys_permissions SET can_access = ? WHERE role = ? AND feature_key = ?");
        $stmt->execute([
            $data['can_access'] ? 1 : 0,
            $data['role'],
            $data['feature_key']
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Hak akses diperbarui.']);
    } catch (PDOException $e) {
        sendError("Gagal memperbarui hak akses.", $e->getMessage());
    }
}
?>
