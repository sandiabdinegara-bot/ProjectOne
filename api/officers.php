<?php
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

// Helper to determine base URL for images
$proto = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http");
$script_name = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']));
$base_path = str_replace('/api', '', $script_name);
$base_url = $base_path . "/uploads/foto_petugas/";

// Prepare absolute upload directory (one level up from api folder)
$upload_dir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'foto_petugas' . DIRECTORY_SEPARATOR;
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

switch ($method) {
    case 'GET':
        $route_code = $_GET['route_code'] ?? null;
        $branch_code = $_GET['branch_code'] ?? null;
        $kec_code = $_GET['kecamatan_code'] ?? null;

        if ($route_code || $branch_code || $kec_code) {
            $conditions = ["p.deleted_at IS NULL"]; // Base condition
            $params = [];
            if ($route_code) {
                $conditions[] = "wp.kode_rute = ?";
                $params[] = $route_code;
            }
            if ($branch_code) {
                $conditions[] = "wp.kode_cabang = ?";
                $params[] = $branch_code;
            }
            if ($kec_code) {
                $conditions[] = "wp.kode_kecamatan = ?";
                $params[] = $kec_code;
            }

            $sql = "SELECT DISTINCT p.*, c.cabang as nama_cabang 
                    FROM data_petugas p 
                    LEFT JOIN cabang c ON p.kode_cabang = c.kode_cabang
                    JOIN data_wilayah_petugas wp ON p.id = wp.id_petugas 
                    WHERE " . implode(" AND ", $conditions) . " 
                    ORDER BY p.nama ASC";
            $stmt = $conn->prepare($sql);
            $stmt->execute($params);
        } else {
            $stmt = $conn->query("SELECT p.*, c.cabang as nama_cabang 
                                  FROM data_petugas p 
                                  LEFT JOIN cabang c ON p.kode_cabang = c.kode_cabang 
                                  WHERE p.deleted_at IS NULL 
                                  ORDER BY p.nama ASC");
        }
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // ... (routes fetching loop remains same) ...

        // Fetch routes for each officer
        $stmt_routes = $conn->prepare("SELECT kode_rute FROM data_wilayah_petugas WHERE id_petugas = ?");
        foreach ($rows as &$row) {
            $stmt_routes->execute([$row['id']]);
            $routes = $stmt_routes->fetchAll(PDO::FETCH_COLUMN);
            $row['kode_rute'] = $routes;
        }

        if (!function_exists('str_starts_with')) {
            function str_starts_with($haystack, $needle)
            {
                return (string) $needle !== '' && strncmp($haystack, $needle, strlen($needle)) === 0;
            }
        }

        foreach ($rows as &$row) {
            if (!empty($row['foto_petugas'])) {
                $foto = $row['foto_petugas'];
                if (!str_starts_with($foto, 'http') && !str_starts_with($foto, 'data:image')) {
                    $filename = basename(str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $foto));
                    $row['foto_petugas'] = $base_url . $filename;
                }
            }
        }

        echo json_encode($rows);
        break;

    case 'POST':
        // ... (POST logic unchanged until verify) ...
        // Use $_POST for FormData, fallback to JSON input if needed
        $data = !empty($_POST) ? $_POST : json_decode(file_get_contents('php://input'), true);

        // Fields
        $nik = $data['nik'] ?? null;
        $nama = $data['nama'] ?? '';
        $alamat = $data['alamat'] ?? '';
        $telepon = $data['telepon'] ?? '';
        $ktp = $data['ktp'] ?? '';
        $tgl_masuk = !empty($data['tgl_masuk']) ? $data['tgl_masuk'] : null;
        $tgl_keluar = !empty($data['tgl_keluar']) ? $data['tgl_keluar'] : null;
        $kode_cabang = $data['kode_cabang'] ?? '';

        // Handle existing photo path
        $foto_petugas = $data['foto_petugas'] ?? '';
        if ($foto_petugas && str_starts_with($foto_petugas, $base_url)) {
            $foto_petugas = str_replace($base_url, '', $foto_petugas);
        }

        // Handle multiple routes
        $kode_rute = $data['kode_rute'] ?? [];
        if (is_string($kode_rute)) {
            $kode_rute = !empty($kode_rute) ? [$kode_rute] : [];
        }

        // Handle File Upload
        if (isset($_FILES['foto_petugas']) && $_FILES['foto_petugas']['error'] === UPLOAD_ERR_OK) {
            $tmp_name = $_FILES['foto_petugas']['tmp_name'];
            $name = basename($_FILES['foto_petugas']['name']);
            $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
            $new_name = 'petugas_' . $nik . '_' . time() . '.' . $ext;

            if (move_uploaded_file($tmp_name, $upload_dir . $new_name)) {
                $foto_petugas = $new_name;
            }
        }
        $status_aktif = $data['status_aktif'] ?? 'Aktif';

        if (isset($_GET['id'])) {
            // Update
            $officer_id = $_GET['id'];

            $conn->beginTransaction();

            $sql = "UPDATE data_petugas SET 
                    nik = ?, nama = ?, alamat = ?, telepon = ?, ktp = ?, 
                    tgl_masuk = ?, tgl_keluar = ?, kode_cabang = ?,
                    foto_petugas = ?, status_aktif = ? 
                    WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                $nik,
                $nama,
                $alamat,
                $telepon,
                $ktp,
                $tgl_masuk,
                $tgl_keluar,
                $kode_cabang,
                $foto_petugas,
                $status_aktif,
                $officer_id
            ]);

            // Update routes
            $stmt = $conn->prepare("DELETE FROM data_wilayah_petugas WHERE id_petugas = ?");
            $stmt->execute([$officer_id]);

            if (!empty($kode_rute) && !empty($kode_cabang)) {
                $stmt = $conn->prepare("INSERT INTO data_wilayah_petugas (id_petugas, kode_cabang, kode_rute) VALUES (?, ?, ?)");
                foreach ($kode_rute as $route) {
                    $stmt->execute([$officer_id, $kode_cabang, $route]);
                }
            }

            $conn->commit();
            echo json_encode(['message' => 'Officer updated']);
        } else {
            // Create
            $conn->beginTransaction();

            $sql = "INSERT INTO data_petugas (
                    nik, nama, alamat, telepon, ktp, 
                    tgl_masuk, tgl_keluar, kode_cabang,
                    foto_petugas, status_aktif
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                $nik,
                $nama,
                $alamat,
                $telepon,
                $ktp,
                $tgl_masuk,
                $tgl_keluar,
                $kode_cabang,
                $foto_petugas,
                $status_aktif
            ]);

            $officer_id = $conn->lastInsertId();

            // Insert routes
            if (!empty($kode_rute) && !empty($kode_cabang)) {
                $stmt = $conn->prepare("INSERT INTO data_wilayah_petugas (id_petugas, kode_cabang, kode_rute) VALUES (?, ?, ?)");
                foreach ($kode_rute as $route) {
                    $stmt->execute([$officer_id, $kode_cabang, $route]);
                }
            }

            $conn->commit();
            echo json_encode(['message' => 'Officer added', 'id' => $officer_id]);
        }
        break;

    case 'DELETE':
        if (isset($_GET['id'])) {
            // Soft Delete Implementation
            $stmt = $conn->prepare("UPDATE data_petugas SET deleted_at = NOW() WHERE id = ?");
            try {
                $stmt->execute([$_GET['id']]);

                // Optionally remove relations or keep them? 
                // Keeping relations allows for easier restore. 
                // But if they are assigned to routes, they might still show up in some joins?
                // The JOIN in GET above filters by p.deleted_at IS NULL so they won't show up.
                // Routes themselves in data_wilayah_petugas rely on officer ID. We should probably NOT delete them if we want true soft delete restore capability properly.
                // However, user might see "ghost" assignments if looking from route perspective?
                // For now, simple soft delete of the main record is enough as the main query filters by it.

                echo json_encode(['message' => 'Officer soft deleted']);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Gagal menghapus data.']);
            }
        }
        break;
}
?>