<?php
require_once 'config.php';

header('Content-Type: text/plain');

function addDeletedAtColumn($conn, $table)
{
    // Check if column exists
    $stmt = $conn->prepare("SHOW COLUMNS FROM `$table` LIKE 'deleted_at'");
    $stmt->execute();
    if ($stmt->fetch()) {
        echo "Column 'deleted_at' already exists in table '$table'.\n";
        return;
    }

    // Add column
    try {
        $sql = "ALTER TABLE `$table` ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL AFTER `status_aktif`"; // Try putting it after status_aktif for officers, for customers it'll just be at end if column doesn't exist
        // For customers table, status_aktif doesn't exist, so let's just add it. ALTER TABLE rules are flexible.
        if ($table === 'data_pelanggan') {
            $sql = "ALTER TABLE `$table` ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL";
        }

        $conn->exec($sql);
        echo "Successfully added 'deleted_at' column to table '$table'.\n";
    } catch (PDOException $e) {
        echo "Error adding column to '$table': " . $e->getMessage() . "\n";
    }
}

try {
    echo "Starting Soft Delete Migration...\n";
    addDeletedAtColumn($conn, 'data_petugas');
    addDeletedAtColumn($conn, 'data_pelanggan');
    echo "Migration Completed.\n";
} catch (Exception $e) {
    echo "Fatal Error: " . $e->getMessage();
}
?>