<?php
header('Content-Type: text/plain');

echo "--- SiCater Uploads Diagnostics ---\n\n";

$base_dir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads';
echo "Base Uploads Directory: " . $base_dir . "\n";

if (!is_dir($base_dir)) {
    echo "ERROR: 'uploads' directory not found!\n";
} else {
    echo "SUCCESS: 'uploads' directory found.\n";
    echo "Permissions: " . substr(sprintf('%o', fileperms($base_dir)), -4) . "\n\n";

    $subdirs = [
        'foto_meter_pelanggan',
        'foto_rumah_pelanggan',
        'foto_catat_meter',
        'foto_catat_rumah',
        'foto_petugas'
    ];

    foreach ($subdirs as $dir) {
        $path = $base_dir . DIRECTORY_SEPARATOR . $dir;
        echo "Checking Directory: $dir\n";
        if (is_dir($path)) {
            $files = array_diff(scandir($path), array('.', '..'));
            echo "  - Status: FOUND\n";
            echo "  - Permissions: " . substr(sprintf('%o', fileperms($path)), -4) . "\n";
            echo "  - File Count: " . count($files) . "\n";
            
            $space_files = [];
            foreach ($files as $file) {
                if (str_contains($file, ' ')) {
                    $space_files[] = $file;
                }
            }
            
            if (count($space_files) > 0) {
                echo "  - WARNING: Found " . count($space_files) . " files with SPACES in names. These should use underscores.\n";
                echo "  - Sample space file: " . $space_files[0] . "\n";
            }
            
            if (count($files) > 0) {
                echo "  - Sample File: " . reset($files) . "\n";
            }
        } else {
            echo "  - Status: NOT FOUND\n";
            // Check if it exists with spaces instead
            $spaced_dir = str_replace('_', ' ', $dir);
            if (is_dir($base_dir . DIRECTORY_SEPARATOR . $spaced_dir)) {
                echo "  - HINT: Found directory with SPACES instead: '$spaced_dir'. Please rename to '$dir'.\n";
            }
        }
        echo "\n";
    }
}

echo "--- PHP Info ---\n";
echo "Operating System: " . PHP_OS . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "Script Location: " . $_SERVER['SCRIPT_FILENAME'] . "\n";
?>
