<?php
header('Content-Type: application/json');
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $id_sambungan = $_GET['id_sambungan'] ?? null;

    if (!$id_sambungan) {
        http_response_code(400);
        echo json_encode(["error" => "id_sambungan is required"]);
        exit();
    }

    // Helper for URLs
    $script_name = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']));
    $base_path = str_replace('/api', '', $script_name);
    $base_url_meter = $base_path . "/uploads/foto_catat_meter/";
    $base_url_rumah = $base_path . "/uploads/foto_catat_rumah/";

    try {
        $stmt = $conn->prepare("SELECT * FROM data_pencatatan WHERE id_sambungan = ? ORDER BY tahun DESC, bulan DESC LIMIT 12");
        $stmt->execute([$id_sambungan]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($rows as &$row) {
            if ($row['foto'] && !str_starts_with($row['foto'], 'data:image') && !str_starts_with($row['foto'], 'http')) {
                $row['foto'] = $base_url_meter . $row['foto'];
            }
            if (isset($row['foto_rumah']) && $row['foto_rumah'] && !str_starts_with($row['foto_rumah'], 'data:image') && !str_starts_with($row['foto_rumah'], 'http')) {
                $row['foto_rumah'] = $base_url_rumah . $row['foto_rumah'];
            }
        }

        echo json_encode($rows);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}
?>
