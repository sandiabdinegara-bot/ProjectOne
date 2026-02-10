<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Helper to determine base URL for images
$proto = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http");
// Get the base path (e.g., /PDAM_app)
$script_name = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']));
$base_path = str_replace('/api', '', $script_name);
$base_url_meter = $base_path . "/uploads/foto_catat_meter/";
$base_url_rumah = $base_path . "/uploads/foto_catat_rumah/";

// Prepare absolute upload directories (one level up from api folder)
$dir_meter = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'foto_catat_meter' . DIRECTORY_SEPARATOR;
$dir_rumah = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'foto_catat_rumah' . DIRECTORY_SEPARATOR;

if (!is_dir($dir_meter))
    mkdir($dir_meter, 0755, true);
if (!is_dir($dir_rumah))
    mkdir($dir_rumah, 0755, true);

switch ($method) {
    case 'GET':
        $officer_id = $_GET['officer_id'] ?? null;
        if (isset($_GET['id'])) {
            $stmt = $conn->prepare("SELECT * FROM data_pencatatan WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row && $row['foto'] && !str_starts_with($row['foto'], 'data:image') && !str_starts_with($row['foto'], 'http')) {
                $row['foto'] = $base_url_meter . $row['foto'];
            }
            if ($row && isset($row['foto_rumah']) && $row['foto_rumah'] && !str_starts_with($row['foto_rumah'], 'data:image') && !str_starts_with($row['foto_rumah'], 'http')) {
                $row['foto_rumah'] = $base_url_rumah . $row['foto_rumah'];
            }
            echo json_encode($row);
        } else {
            if ($officer_id) {
                $sql = "SELECT p.* FROM data_pencatatan p 
                        JOIN data_pelanggan c ON p.id_pelanggan = c.id 
                        WHERE c.kode_rute IN (SELECT kode_rute FROM data_wilayah_petugas WHERE id_petugas = ?)
                        ORDER BY p.update_date DESC";
                $stmt = $conn->prepare($sql);
                $stmt->execute([$officer_id]);
            } else {
                $sql = "SELECT * FROM data_pencatatan ORDER BY update_date DESC";
                $stmt = $conn->query($sql);
            }
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
        }
        break;

    case 'POST':
        try {
            $data = !empty($_POST) ? $_POST : json_decode(file_get_contents('php://input'), true);
            $id = $_GET['id'] ?? ($data['id'] ?? null);

            $filename = $data['foto'] ?? null;
            if ($filename && str_starts_with($filename, $base_url_meter)) {
                $filename = str_replace($base_url_meter, '', $filename);
            }

            $filename_rumah = $data['foto_rumah'] ?? null;
            if ($filename_rumah && str_starts_with($filename_rumah, $base_url_rumah)) {
                $filename_rumah = str_replace($base_url_rumah, '', $filename_rumah);
            }

            if (isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
                $fileTmpPath = $_FILES['foto']['tmp_name'];
                $fileExtension = strtolower(pathinfo($_FILES['foto']['name'], PATHINFO_EXTENSION));
                $newFileName = 'catat_' . uniqid() . '.' . $fileExtension;
                if (move_uploaded_file($fileTmpPath, $dir_meter . $newFileName)) {
                    $filename = $newFileName;
                }
            }

            if (isset($_FILES['foto_rumah']) && $_FILES['foto_rumah']['error'] === UPLOAD_ERR_OK) {
                $fileTmpPath = $_FILES['foto_rumah']['tmp_name'];
                $fileExtension = strtolower(pathinfo($_FILES['foto_rumah']['name'], PATHINFO_EXTENSION));
                $newFileName = 'rumah_' . uniqid() . '.' . $fileExtension;
                if (move_uploaded_file($fileTmpPath, $dir_rumah . $newFileName)) {
                    $filename_rumah = $newFileName;
                }
            }

            if (!$id) {
                $fields = ['id_pelanggan', 'id_sambungan', 'id_meter', 'nama', 'alamat', 'bulan', 'tahun', 'stan_akhir', 'foto', 'foto_rumah', 'kode_tarif', 'longitude', 'latitude', 'petugas', 'status_laporan', 'ai_ocr_status', 'tgl_verifikasi'];
                $placeholders = array_fill(0, count($fields), '?');
                $sql = "INSERT INTO data_pencatatan (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $placeholders) . ")";
                $stmt = $conn->prepare($sql);
                $stmt->execute([
                    $data['id_pelanggan'] ?? null,
                    $data['id_sambungan'] ?? null,
                    $data['id_meter'] ?? null,
                    $data['nama'] ?? null,
                    $data['alamat'] ?? null,
                    $data['bulan'] ?? null,
                    $data['tahun'] ?? null,
                    $data['stan_akhir'] ?? 0,
                    $filename,
                    $filename_rumah,
                    $data['kode_tarif'] ?? null,
                    $data['longitude'] ?? null,
                    $data['latitude'] ?? null,
                    $data['petugas'] ?? null,
                    $data['status_laporan'] ?? null,
                    $data['ai_ocr_status'] ?? null,
                    $data['tgl_verifikasi'] ?? null
                ]);
                echo json_encode(["message" => "Recording added", "id" => $conn->lastInsertId()]);
            } else {
                $sql = "UPDATE data_pencatatan SET stan_akhir = ?, foto = ?, foto_rumah = ?, petugas = ?, longitude = ?, latitude = ?, status_laporan = ?, ai_ocr_status = ?, tgl_verifikasi = ? WHERE id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->execute([
                    $data['stan_akhir'],
                    $filename,
                    $filename_rumah,
                    $data['petugas'],
                    $data['longitude'] ?? null,
                    $data['latitude'] ?? null,
                    $data['status_laporan'] ?? null,
                    $data['ai_ocr_status'] ?? null,
                    $data['tgl_verifikasi'] ?? null,
                    $id
                ]);
                echo json_encode(["message" => "Recording updated"]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Server error: " . $e->getMessage(), "trace" => $e->getTraceAsString()]);
        }
        break;

    case 'DELETE':
        $stmt = $conn->prepare("DELETE FROM data_pencatatan WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        echo json_encode(["message" => "Deleted"]);
        break;
}
?>