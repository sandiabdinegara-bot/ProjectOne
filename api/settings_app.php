<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Prepare upload dir for logo
$logo_dir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'app' . DIRECTORY_SEPARATOR;
if (!file_exists($logo_dir)) mkdir($logo_dir, 0777, true);

$proto = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$base_url = $proto . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . rtrim(str_replace('/api', '', str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']))), '/');

function logActivity($conn, $action, $detail) {
    try {
        $stmt = $conn->prepare("INSERT INTO activity_logs (username, action, detail, ip_address) VALUES ('admin', ?, ?, ?)");
        $stmt->execute([$action, $detail, $_SERVER['REMOTE_ADDR'] ?? '']);
    } catch (Exception $e) {}
}

switch ($method) {
    case 'GET':
        $keys = ['app_name', 'app_tagline', 'logo_path'];
        $placeholders = implode(',', array_fill(0, count($keys), '?'));
        $stmt = $conn->prepare("SELECT config_key, config_value FROM app_config WHERE config_key IN ($placeholders)");
        $stmt->execute($keys);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $config = [];
        foreach ($rows as $r) $config[$r['config_key']] = $r['config_value'];

        // Build absolute logo URL
        $logo = $config['logo_path'] ?? 'logo.png';
        if (!str_starts_with($logo, 'http') && !str_starts_with($logo, '/')) {
            // Default root logo
            $config['logo_url'] = $base_url . '/' . $logo;
        } else {
            $config['logo_url'] = $base_url . '/uploads/app/' . $logo;
        }

        echo json_encode($config);
        break;

    case 'POST':
        $app_name    = $_POST['app_name'] ?? null;
        $app_tagline = $_POST['app_tagline'] ?? null;
        $logo_path   = null;

        // Handle logo upload
        if (isset($_FILES['logo']) && $_FILES['logo']['error'] === UPLOAD_ERR_OK) {
            $ext = strtolower(pathinfo($_FILES['logo']['name'], PATHINFO_EXTENSION));
            if (!in_array($ext, ['png', 'jpg', 'jpeg', 'svg', 'webp'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Format logo tidak didukung. Gunakan PNG, JPG, SVG, atau WEBP.']);
                exit;
            }
            $new_name = 'logo_' . time() . '.' . $ext;
            if (move_uploaded_file($_FILES['logo']['tmp_name'], $logo_dir . $new_name)) {
                $logo_path = $new_name;
            }
        }

        $stmt = $conn->prepare("INSERT INTO app_config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?");

        if ($app_name !== null) $stmt->execute(['app_name', $app_name, $app_name]);
        if ($app_tagline !== null) $stmt->execute(['app_tagline', $app_tagline, $app_tagline]);
        if ($logo_path !== null) $stmt->execute(['logo_path', $logo_path, $logo_path]);

        logActivity($conn, 'Update Aplikasi & Logo', 'Konfigurasi aplikasi diperbarui.');
        echo json_encode(['success' => true, 'message' => 'Konfigurasi aplikasi berhasil disimpan.', 'logo_path' => $logo_path]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}

if (!function_exists('str_starts_with')) {
    function str_starts_with($haystack, $needle) {
        return strncmp($haystack, $needle, strlen($needle)) === 0;
    }
}
?>
