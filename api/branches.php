<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $conn->prepare("SELECT * FROM cabang WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
        } else {
            $stmt = $conn->query("SELECT * FROM cabang ORDER BY id ASC");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        }
        break;

    case 'POST':
        try {
            $sql = "INSERT INTO cabang (kode_cabang, cabang, alamat, telepon) VALUES (?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                $input['kode_cabang'] ?? null,
                $input['cabang'] ?? null,
                $input['alamat'] ?? null,
                $input['telepon'] ?? null
            ]);
            echo json_encode(["message" => "Branch added successfully", "id" => $conn->lastInsertId()]);
        } catch (PDOException $e) {
            sendError("Gagal menambah data cabang.", $e->getMessage());
        }
        break;

    case 'PUT':
        if (!isset($_GET['id'])) {
            sendError("ID is required", null, 400);
        }
        try {
            $sql = "UPDATE cabang SET kode_cabang = ?, cabang = ?, alamat = ?, telepon = ? WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                $input['kode_cabang'] ?? null,
                $input['cabang'] ?? null,
                $input['alamat'] ?? null,
                $input['telepon'] ?? null,
                $_GET['id']
            ]);
            echo json_encode(["message" => "Branch updated successfully"]);
        } catch (PDOException $e) {
            sendError("Gagal memperbarui data cabang.", $e->getMessage());
        }
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            sendError("ID is required", null, 400);
        }
        try {
            $stmt = $conn->prepare("DELETE FROM cabang WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            echo json_encode(["message" => "Branch deleted successfully"]);
        } catch (PDOException $e) {
            sendError("Gagal menghapus data cabang.", $e->getMessage());
        }
        break;
}
?>