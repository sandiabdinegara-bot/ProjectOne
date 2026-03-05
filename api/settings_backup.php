<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Backup dir: one level up from api/
$backup_dir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'backups' . DIRECTORY_SEPARATOR;
if (!file_exists($backup_dir)) mkdir($backup_dir, 0755, true);

$proto    = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$base_url_path = str_replace('/api', '', str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])));

function logActivity($conn, $action, $detail) {
    try {
        $stmt = $conn->prepare("INSERT INTO activity_logs (username, action, detail, ip_address) VALUES ('admin', ?, ?, ?)");
        $stmt->execute([$action, $detail, $_SERVER['REMOTE_ADDR'] ?? '']);
    } catch (Exception $e) {}
}

switch ($method) {
    case 'GET':
        $action = $_GET['action'] ?? 'list';

        if ($action === 'download' && isset($_GET['file'])) {
            $file = basename($_GET['file']); // Sanitize
            $filepath = $backup_dir . $file;
            if (!file_exists($filepath)) {
                http_response_code(404);
                echo json_encode(['error' => 'File tidak ditemukan.']);
                exit;
            }
            // Override headers to force download
            header('Content-Description: File Transfer');
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="' . $file . '"');
            header('Content-Length: ' . filesize($filepath));
            header('Pragma: no-cache');
            readfile($filepath);
            exit;
        }

        // List backup files
        $files = glob($backup_dir . '*.sql');
        $backups = [];
        if ($files) {
            rsort($files);
            foreach (array_slice($files, 0, 10) as $f) {
                $backups[] = [
                    'filename' => basename($f),
                    'size'     => round(filesize($f) / 1024, 1) . ' KB',
                    'date'     => date('d M Y H:i', filemtime($f))
                ];
            }
        }
        echo json_encode($backups);
        break;

    case 'POST':
        // Get DB credentials from config
        $host    = 'localhost';
        $db      = 'sicater_db';
        $db_user = 'root';
        $db_pass = '';

        $filename  = 'backup_' . date('Y-m-d_His') . '.sql';
        $filepath  = $backup_dir . $filename;

        // Use mysqldump
        $mysqldump = 'C:\\xampp\\mysql\\bin\\mysqldump.exe';
        if (!file_exists($mysqldump)) {
            $mysqldump = 'mysqldump'; // fallback to PATH
        }

        $pass_arg = !empty($db_pass) ? "-p\"$db_pass\"" : '';
        $cmd = "\"$mysqldump\" -h $host -u $db_user $pass_arg $db --result-file=\"$filepath\" 2>&1";

        $output = [];
        $return_code = 0;
        exec($cmd, $output, $return_code);

        if ($return_code !== 0 || !file_exists($filepath)) {
            http_response_code(500);
            echo json_encode(['error' => 'Backup gagal. Pesan: ' . implode(' ', $output)]);
            break;
        }

        // Update last_backup config
        $stmt = $conn->prepare("INSERT INTO app_config (config_key, config_value) VALUES ('last_backup', ?) ON DUPLICATE KEY UPDATE config_value = ?");
        $now = date('Y-m-d H:i:s');
        $stmt->execute([$now, $now]);

        logActivity($conn, 'Backup Database', "Backup berhasil: $filename (" . round(filesize($filepath)/1024, 1) . " KB)");

        echo json_encode([
            'success'  => true,
            'message'  => 'Backup berhasil dibuat!',
            'filename' => $filename,
            'size'     => round(filesize($filepath) / 1024, 1) . ' KB',
            'date'     => date('d M Y H:i')
        ]);
        break;

    case 'PUT':
        // Database optimize action
        try {
            $tables = $conn->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
            $optimized = [];
            foreach ($tables as $table) {
                $conn->exec("OPTIMIZE TABLE `$table`");
                $optimized[] = $table;
            }
            logActivity($conn, 'Optimasi Database', "Berhasil mengoptimalkan " . count($optimized) . " tabel.");
            echo json_encode(['success' => true, 'message' => 'Database berhasil dioptimalkan! (' . count($optimized) . ' tabel)']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Gagal optimasi: ' . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
?>
