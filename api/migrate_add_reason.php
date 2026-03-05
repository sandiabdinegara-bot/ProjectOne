<?php
require_once 'config.php';

try {
    // Check if column already exists
    $check = $conn->query("SHOW COLUMNS FROM data_pencatatan LIKE 'verifikasi_catatan'");
    if ($check->rowCount() == 0) {
        $conn->exec("ALTER TABLE data_pencatatan ADD COLUMN verifikasi_catatan TEXT AFTER ai_ocr_status");
        echo json_encode(["status" => "success", "message" => "Column 'verifikasi_catatan' added successfully."]);
    } else {
        echo json_encode(["status" => "info", "message" => "Column 'verifikasi_catatan' already exists."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>