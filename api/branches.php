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
        $sql = "INSERT INTO cabang (kode_cabang, cabang, alamat, telepon) VALUES (?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            $input['kode_cabang'] ?? null,
            $input['cabang'] ?? null,
            $input['alamat'] ?? null,
            $input['telepon'] ?? null
        ]);
        echo json_encode(["message" => "Branch added successfully", "id" => $conn->lastInsertId()]);
        break;

    case 'PUT':
        if (!isset($_GET['id'])) {
            echo json_encode(["error" => "ID is required"]);
            break;
        }
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
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            echo json_encode(["error" => "ID is required"]);
            break;
        }
        $stmt = $conn->prepare("DELETE FROM cabang WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        echo json_encode(["message" => "Branch deleted successfully"]);
        break;
}
?>