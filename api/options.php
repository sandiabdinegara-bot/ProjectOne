<?php
require_once 'config.php';

$type = $_GET['type'] ?? '';

try {
    switch ($type) {
        case 'tarif':
            // Fetch only active tariffs
            $stmt = $conn->query("SELECT kode_tarif, tarif FROM tarif WHERE status_aktif = 'Aktif' ORDER BY kode_tarif ASC");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'rute':
            $kode_cabang = $_GET['kode_cabang'] ?? null;
            if ($kode_cabang) {
                $stmt = $conn->prepare("SELECT DISTINCT r.kode_rute, r.rute 
                                      FROM rute r 
                                      JOIN data_wilayah_petugas dwp ON r.kode_rute = dwp.kode_rute 
                                      WHERE dwp.kode_cabang = ? 
                                      ORDER BY r.kode_rute ASC");
                $stmt->execute([$kode_cabang]);
            } else {
                $stmt = $conn->query("SELECT kode_rute, rute FROM rute ORDER BY kode_rute ASC");
            }
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'cabang':
            $stmt = $conn->query("SELECT kode_cabang, cabang FROM cabang ORDER BY kode_cabang ASC");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'status_kondisi':
            $stmt = $conn->query("SELECT kode_kondisi, status_kondisi FROM status_kondisi ORDER BY kode_kondisi ASC");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'status_analisa':
            $stmt = $conn->query("SELECT min, max, status_analisa FROM status_analisa ORDER BY CAST(min AS SIGNED) ASC");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        default:
            echo json_encode(["error" => "Invalid type"]);
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
?>