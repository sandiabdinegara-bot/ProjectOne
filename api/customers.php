<?php
header('Content-Type: application/json');
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Helper to determine base URLs for images
$proto = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http");
$script_name = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']));
$base_path = str_replace('/api', '', $script_name);
$base_url_meter = $base_path . "/uploads/foto_meter_pelanggan/";
$base_url_rumah = $base_path . "/uploads/foto_rumah_pelanggan/";

// Prepare absolute upload directories (one level up from api folder)
$dir_meter = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'foto_meter_pelanggan' . DIRECTORY_SEPARATOR;
$dir_rumah = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'foto_rumah_pelanggan' . DIRECTORY_SEPARATOR;

if (!is_dir($dir_meter))
    mkdir($dir_meter, 0755, true);
if (!is_dir($dir_rumah))
    mkdir($dir_rumah, 0755, true);

try {
    switch ($method) {
        case 'GET':
            $officer_id = $_GET['officer_id'] ?? null;
            if (isset($_GET['id'])) {
                $stmt = $conn->prepare("SELECT * FROM data_pelanggan WHERE id = ? AND deleted_at IS NULL"); // Add check
                $stmt->execute([$_GET['id']]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                // ... (foto handling remains same)
                if ($row) {
                    if (isset($row['foto_meter']) && $row['foto_meter'] && !str_starts_with($row['foto_meter'], 'data:image') && !str_starts_with($row['foto_meter'], 'http')) {
                        $row['foto_meter'] = $base_url_meter . $row['foto_meter'];
                    }
                    if (isset($row['foto_rumah']) && $row['foto_rumah'] && !str_starts_with($row['foto_rumah'], 'data:image') && !str_starts_with($row['foto_rumah'], 'http')) {
                        $row['foto_rumah'] = $base_url_rumah . $row['foto_rumah'];
                    }
                }
                echo json_encode($row);
            } else {
                // Unified Query Builder
                $search = $_GET['search'] ?? '';
                $kode_rute = $_GET['kode_rute'] ?? '';
                $kode_cabang = $_GET['kode_cabang'] ?? '';
                $params = [];
                $limit_clause = "";

                $sql = "SELECT dp.*, c.cabang as nama_cabang 
                    FROM data_pelanggan dp
                    LEFT JOIN cabang c ON dp.kode_cabang = c.kode_cabang
                    WHERE dp.deleted_at IS NULL";

                // 1. Officer Filter
                if ($officer_id) {
                    $sql .= " AND dp.kode_rute IN (SELECT TRIM(TRAILING ',' FROM kode_rute) FROM data_wilayah_petugas WHERE id_petugas = ?)";
                    $params[] = $officer_id;
                }

                // 2. Route Filter
                if (!empty($kode_rute)) {
                    $sql .= " AND dp.kode_rute = ?";
                    $params[] = $kode_rute;
                }

                // 3. Branch Filter
                if (!empty($kode_cabang)) {
                    $sql .= " AND dp.kode_cabang = ?";
                    $params[] = $kode_cabang;
                }

                // 4. Search Filter (Autocomplete)
                if (!empty($search)) {
                    $sql .= " AND (dp.nama LIKE ? OR dp.id_sambungan LIKE ? OR dp.alamat LIKE ?)";
                    $term = "%$search%";
                    $params[] = $term;
                    $params[] = $term;
                    $params[] = $term;
                    $limit_clause = " LIMIT 100"; // Increased limit for search
                }
                // Safety Limit if no filters provided to prevent crashing
                elseif (!$officer_id && empty($kode_rute) && empty($kode_cabang)) {
                    $limit_clause = " LIMIT 1000";
                }

                $sql .= " ORDER BY dp.id ASC" . $limit_clause;

                $stmt = $conn->prepare($sql);
                $stmt->execute($params);
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // Additional paths for fallback (Check Recording Photos if Master Photo missing)
                $dir_meter_catat = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'foto_catat_meter' . DIRECTORY_SEPARATOR;
                $base_url_meter_catat = $base_path . "/uploads/foto_catat_meter/";

                $dir_rumah_catat = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'foto_catat_rumah' . DIRECTORY_SEPARATOR;
                $base_url_rumah_catat = $base_path . "/uploads/foto_catat_rumah/";

                foreach ($rows as &$row) {
                    // Logic for Foto Meter
                    if (isset($row['foto_meter']) && $row['foto_meter'] && !str_starts_with($row['foto_meter'], 'data:image') && !str_starts_with($row['foto_meter'], 'http')) {
                        // Check if file exists in Master folder
                        if (file_exists($dir_meter . $row['foto_meter'])) {
                            $row['foto_meter'] = $base_url_meter . $row['foto_meter'];
                        }
                        // Fallback: Check if file exists in Recording folder
                        elseif (file_exists($dir_meter_catat . $row['foto_meter'])) {
                            $row['foto_meter'] = $base_url_meter_catat . $row['foto_meter'];
                        }
                        // Default to Master URL (even if broken, consistent with expected path)
                        else {
                            $row['foto_meter'] = $base_url_meter . $row['foto_meter'];
                        }
                    }

                    // Logic for Foto Rumah
                    if (isset($row['foto_rumah']) && $row['foto_rumah'] && !str_starts_with($row['foto_rumah'], 'data:image') && !str_starts_with($row['foto_rumah'], 'http')) {
                        // Check if file exists in Master folder
                        if (file_exists($dir_rumah . $row['foto_rumah'])) {
                            $row['foto_rumah'] = $base_url_rumah . $row['foto_rumah'];
                        }
                        // Fallback: Check if file exists in Recording folder
                        elseif (file_exists($dir_rumah_catat . $row['foto_rumah'])) {
                            $row['foto_rumah'] = $base_url_rumah_catat . $row['foto_rumah'];
                        }
                        // Default to Master URL
                        else {
                            $row['foto_rumah'] = $base_url_rumah . $row['foto_rumah'];
                        }
                    }
                }
                echo json_encode($rows);
            }
            break;

        case 'POST':
        case 'PUT':
            // ... (POST logic unchanged until delete) ...
            // Read data from POST or JSON body
            $data = !empty($_POST) ? $_POST : json_decode(file_get_contents('php://input'), true);
            $id = $_GET['id'] ?? ($data['id'] ?? null);

            // Handle File Uploads
            $filename_meter = $data['foto_meter'] ?? null;
            if ($filename_meter && str_starts_with($filename_meter, $base_url_meter)) {
                $filename_meter = str_replace($base_url_meter, '', $filename_meter);
            }

            $filename_rumah = $data['foto_rumah'] ?? null;
            if ($filename_rumah && str_starts_with($filename_rumah, $base_url_rumah)) {
                $filename_rumah = str_replace($base_url_rumah, '', $filename_rumah);
            }

            // Function to handle upload
            function handleUpload($fileInputName, $targetDir, $prefix)
            {
                if (isset($_FILES[$fileInputName])) {
                    if ($_FILES[$fileInputName]['error'] === UPLOAD_ERR_OK) {
                        $fileTmpPath = $_FILES[$fileInputName]['tmp_name'];
                        $fileName = $_FILES[$fileInputName]['name'];
                        $fileSize = $_FILES[$fileInputName]['size'];
                        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

                        // Validate extension
                        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
                        if (!in_array($fileExtension, $allowedExtensions)) {
                            throw new Exception("Invalid file type for $fileInputName. Allowed: " . implode(', ', $allowedExtensions));
                        }

                        // Validate size (5MB)
                        if ($fileSize > 5 * 1024 * 1024) {
                            throw new Exception("File $fileInputName too large. Max 5MB.");
                        }

                        $newFileName = $prefix . '_' . uniqid() . '.' . $fileExtension;
                        if (move_uploaded_file($fileTmpPath, $targetDir . $newFileName)) {
                            return $newFileName;
                        } else {
                            throw new Exception("Failed to move uploaded file for $fileInputName.");
                        }
                    } elseif ($_FILES[$fileInputName]['error'] !== UPLOAD_ERR_NO_FILE) {
                        throw new Exception("Upload error for $fileInputName: " . $_FILES[$fileInputName]['error']);
                    }
                }
                return null;
            }

            $uploaded_meter = handleUpload('foto_meter', $dir_meter, 'meter');
            if ($uploaded_meter)
                $filename_meter = $uploaded_meter;

            $uploaded_rumah = handleUpload('foto_rumah', $dir_rumah, 'rumah');
            if ($uploaded_rumah)
                $filename_rumah = $uploaded_rumah;

            if (!$id && $method === 'POST') {
                // INSERT
                $sql = "INSERT INTO data_pelanggan (id_sambungan, id_meter, id_tag, nama, alamat, telepon, kode_tarif, kode_rute, kode_cabang, kode_kecamatan, kode_desa, kode_rw, kode_rt, nomor_urut, longitude, latitude, active_date, foto_meter, foto_rumah) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                $stmt = $conn->prepare($sql);
                $stmt->execute([
                    $data['id_sambungan'] ?? null,
                    $data['id_meter'] ?? null,
                    $data['id_tag'] ?? null,
                    $data['nama'] ?? null,
                    $data['alamat'] ?? null,
                    $data['telepon'] ?? null,
                    $data['kode_tarif'] ?? null,
                    $data['kode_rute'] ?? null,
                    $data['kode_cabang'] ?? null,
                    $data['kode_kecamatan'] ?? null,
                    $data['kode_desa'] ?? null,
                    $data['kode_rw'] ?? null,
                    $data['kode_rt'] ?? null,
                    $data['nomor_urut'] ?? null,
                    $data['longitude'] ?? null,
                    $data['latitude'] ?? null,
                    $data['active_date'] ?? null,
                    $filename_meter,
                    $filename_rumah
                ]);
                echo json_encode(["message" => "Customer added successfully", "id" => $conn->lastInsertId()]);
            } else {
                // UPDATE
                if (!$id) {
                    throw new Exception("ID is required for update");
                }
                $sql = "UPDATE data_pelanggan SET 
                        id_sambungan = ?, id_meter = ?, id_tag = ?, nama = ?, alamat = ?, telepon = ?, 
                        kode_tarif = ?, kode_rute = ?, kode_cabang = ?, kode_kecamatan = ?, kode_desa = ?, 
                        kode_rw = ?, kode_rt = ?, nomor_urut = ?, longitude = ?, latitude = ?, active_date = ?, foto_meter = ?, foto_rumah = ?
                        WHERE id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->execute([
                    $data['id_sambungan'] ?? null,
                    $data['id_meter'] ?? null,
                    $data['id_tag'] ?? null,
                    $data['nama'] ?? null,
                    $data['alamat'] ?? null,
                    $data['telepon'] ?? null,
                    $data['kode_tarif'] ?? null,
                    $data['kode_rute'] ?? null,
                    $data['kode_cabang'] ?? null,
                    $data['kode_kecamatan'] ?? null,
                    $data['kode_desa'] ?? null,
                    $data['kode_rw'] ?? null,
                    $data['kode_rt'] ?? null,
                    $data['nomor_urut'] ?? null,
                    $data['longitude'] ?? null,
                    $data['latitude'] ?? null,
                    $data['active_date'] ?? null,
                    $filename_meter,
                    $filename_rumah,
                    $id
                ]);
                echo json_encode(["message" => "Customer updated successfully"]);
            }
            break;

        case 'DELETE':
            if (!isset($_GET['id'])) {
                throw new Exception("ID is required");
            }
            // Soft Delete
            $stmt = $conn->prepare("UPDATE data_pelanggan SET deleted_at = NOW() WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            echo json_encode(["message" => "Customer soft deleted successfully"]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500); // Set HTTP error code so frontend fetch catch block can handle it appropriately (or at least valid JSON error)
    echo json_encode(["error" => $e->getMessage()]);
}
?>