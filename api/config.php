<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Environment Detection: 
// Automatically detect if running on localhost or through a tunnel/production environment.
$host_header = $_SERVER['HTTP_HOST'] ?? '';
$remote_addr = $_SERVER['REMOTE_ADDR'] ?? '';
$is_localhost = in_array($host_header, ['localhost', '127.0.0.1']) || in_array($remote_addr, ['127.0.0.1', '::1']);

define('IS_PRODUCTION', !$is_localhost);

// Error Reporting Configuration
if (IS_PRODUCTION) {
    error_reporting(0);
    ini_set('display_errors', 0);
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}

// Case-Insensitive File Lookup (Crucial for Linux hosting)
function findFileCaseInsensitive($dir, $filename) {
    if (!$filename) return null;
    $path = $dir . $filename;
    if (file_exists($path)) return $filename;

    // If not found, search the directory for a case-insensitive match
    if (is_dir($dir)) {
        $files = scandir($dir);
        $lowerFilename = strtolower($filename);
        foreach ($files as $f) {
            if (strtolower($f) === $lowerFilename) {
                return $f;
            }
        }
    }
    return $filename; // Fallback to original if still not found
}

// Compatibility Polyfills for PHP < 8.0
if (!function_exists('str_starts_with')) {
    function str_starts_with($haystack, $needle) {
        return (string)$needle !== '' && strncmp($haystack, $needle, strlen($needle)) === 0;
    }
}
if (!function_exists('str_ends_with')) {
    function str_ends_with($haystack, $needle) {
        return $needle !== '' && substr($haystack, -strlen($needle)) === (string)$needle;
    }
}

// Professional Error Handling Helper
function sendError($userMessage, $debugDetail = null, $code = 500) {
    http_response_code($code);
    $response = ['error' => $userMessage];
    
    // Only show technical details if NOT in production/online mode
    if (!IS_PRODUCTION && $debugDetail !== null) {
        $response['debug'] = $debugDetail;
    }
    
    echo json_encode($response);
    exit();
}

$host = "localhost";
$db_name = "sicater_db";
$username = "root";
$password = "";

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $exception) {
    sendError("Gagal menyambung ke database.", $exception->getMessage());
}
?>