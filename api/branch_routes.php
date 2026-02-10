<?php
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$kode_cabang = $_GET['kode_cabang'] ?? null;

try {
    if ($method === 'GET') {
        // Get all routes with assignment status for a branch
        if (!$kode_cabang) {
            http_response_code(400);
            echo json_encode(['error' => 'kode_cabang is required']);
            exit;
        }

        // Get all routes
        $stmt = $conn->query("SELECT kode_rute, rute FROM rute ORDER BY kode_rute ASC");
        $allRoutes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get assigned routes for this branch
        $stmt = $conn->prepare("SELECT kode_rute FROM data_wilayah_petugas WHERE kode_cabang = ? AND id_petugas IS NULL");
        $stmt->execute([$kode_cabang]);
        $assignedRoutes = $stmt->fetchAll(PDO::FETCH_COLUMN);

        // Mark which routes are assigned
        $result = array_map(function ($route) use ($assignedRoutes) {
            return [
                'kode_rute' => $route['kode_rute'],
                'rute' => $route['rute'],
                'assigned' => in_array($route['kode_rute'], $assignedRoutes)
            ];
        }, $allRoutes);

        echo json_encode($result);

    } elseif ($method === 'POST') {
        // Save route assignments for a branch
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['kode_cabang']) || !isset($input['routes'])) {
            http_response_code(400);
            echo json_encode(['error' => 'kode_cabang and routes are required']);
            exit;
        }

        $kode_cabang = $input['kode_cabang'];
        $routes = $input['routes'];

        if (!is_array($routes)) {
            http_response_code(400);
            echo json_encode(['error' => 'routes must be an array']);
            exit;
        }

        // Start transaction
        $conn->beginTransaction();

        // Delete existing branch-level assignments
        $stmt = $conn->prepare("DELETE FROM data_wilayah_petugas WHERE kode_cabang = ? AND id_petugas IS NULL");
        $stmt->execute([$kode_cabang]);

        // Insert new assignments
        if (!empty($routes)) {
            $stmt = $conn->prepare("INSERT INTO data_wilayah_petugas (kode_cabang, kode_rute, id_petugas) VALUES (?, ?, NULL)");
            foreach ($routes as $kode_rute) {
                $stmt->execute([$kode_cabang, $kode_rute]);
            }
        }

        $conn->commit();

        echo json_encode([
            'message' => 'Route assignments saved successfully',
            'total_routes' => count($routes)
        ]);

    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }

} catch (PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>