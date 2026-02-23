<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'config.php';

$data = json_decode(file_get_contents("php://input"));

if (empty($data->image_path) || empty($data->degrees)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Incomplete data. Need image_path and degrees."]);
    exit();
}

$imagePath = $data->image_path;
$degrees = (int) $data->degrees;

// 1. Sanitize and Resolve Path
// Decode URL-encoded characters (e.g. spaces as %20)
$imagePath = urldecode($imagePath);

// Remove query parameters if any (e.g. ?t=12345)
$imagePath = explode('?', $imagePath)[0];

// Remove domain or leading slashes if present to get relative path from webroot
// Example input: "http://localhost/PDAM_app/uploads/foto_catat_meter/img.jpg" or "/PDAM_app/uploads/..."

// Current script is in /api/
// Uploads are in ../uploads/

// Try to find "uploads/" in the string
$uploadsPos = strpos($imagePath, 'uploads/');
if ($uploadsPos === false) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid image path structure. 'uploads/' segment not found in path: " . $imagePath]);
    exit();
}

// Extract relative path starting from uploads/
$relativePath = substr($imagePath, $uploadsPos);
// Full system path: go up one level from API to root, then append relative path
$targetFile = dirname(__DIR__) . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relativePath);

// 2. Security Check
$realTarget = realpath($targetFile);
$uploadsDir = realpath(dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads');

if ($realTarget === false) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "File not found on server. Target: " . $targetFile]);
    exit();
}

if (strpos($realTarget, $uploadsDir) !== 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Access denied. Target must be within uploads directory."]);
    exit();
}

if (!file_exists($realTarget)) {
    http_response_code(404);
    echo json_encode(["status" => "error", "message" => "File does not exist."]);
    exit();
}

// 3. Perform Rotation
$info = getimagesize($realTarget);
$mime = $info['mime'];

switch ($mime) {
    case 'image/jpeg':
        $source = imagecreatefromjpeg($realTarget);
        break;
    case 'image/png':
        $source = imagecreatefrompng($realTarget);
        break;
    default:
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Unsupported image type."]);
        exit();
}

// Rotate
// degrees is negative for clockwise in some contexts, but GD imagerotate:
// angle: Rotation angle, in degrees. The rotation angle is interpreted as the number of degrees to rotate the image anticlockwise.
// Frontend usually sends clockwise degrees (90, 180, 270).
// If frontend sends +90 (CW), we need -90 for anticlockwise or 270.
// Let's assume frontend sends standard CW degrees: 90, 180, 270.
// passed to imagerotate:
// 90 CW = 270 CCW
// 180 CW = 180 CCW
// 270 CW = 90 CCW
// So we want to rotate negatively? Or just 360 - $degrees.
$rotationAngle = 360 - $degrees;

$rotate = imagerotate($source, $rotationAngle, 0);

if ($rotate) {
    // Save back to same file
    switch ($mime) {
        case 'image/jpeg':
            imagejpeg($rotate, $realTarget, 90); // 90% quality
            break;
        case 'image/png':
            imagepng($rotate, $realTarget);
            break;
    }

    imagedestroy($source);
    imagedestroy($rotate);

    echo json_encode(["status" => "success", "message" => "Image rotated successfully."]);
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to rotate image."]);
}
?>