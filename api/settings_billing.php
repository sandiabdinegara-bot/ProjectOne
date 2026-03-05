<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

function logActivity($conn, $username, $action, $detail) {
    try {
        $stmt = $conn->prepare("INSERT INTO activity_logs (username, action, detail, ip_address) VALUES (?, ?, ?, ?)");
        $stmt->execute([$username, $action, $detail, $_SERVER['REMOTE_ADDR'] ?? '']);
    } catch (Exception $e) {}
}

switch ($method) {
    case 'GET':
        // Get tariff list + denda config
        $tarif_stmt = $conn->query("SELECT kode_tarif, tarif, harga_1, harga_2, harga_3, tanggal_sk, nomor_sk, status_aktif FROM tarif ORDER BY kode_tarif ASC");
        $tarif = $tarif_stmt->fetchAll(PDO::FETCH_ASSOC);

        $config_stmt = $conn->query("SELECT config_key, config_value FROM app_config WHERE config_key IN ('denda_keterlambatan','jatuh_tempo')");
        $config_rows = $config_stmt->fetchAll(PDO::FETCH_ASSOC);
        $config = [];
        foreach ($config_rows as $row) {
            $config[$row['config_key']] = $row['config_value'];
        }

        echo json_encode(['tarif' => $tarif, 'config' => $config]);
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $conn->beginTransaction();

        // Update tariffs
        if (!empty($data['tarif']) && is_array($data['tarif'])) {
            $stmt = $conn->prepare("UPDATE tarif SET harga_1 = ?, harga_2 = ?, harga_3 = ? WHERE kode_tarif = ?");
            foreach ($data['tarif'] as $item) {
                if (!empty($item['kode_tarif'])) {
                    $stmt->execute([
                        $item['harga_1'] ?? 0,
                        $item['harga_2'] ?? 0,
                        $item['harga_3'] ?? 0,
                        $item['kode_tarif']
                    ]);
                }
            }
        }

        // Update denda config
        if (isset($data['denda_keterlambatan'])) {
            $stmt = $conn->prepare("INSERT INTO app_config (config_key, config_value) VALUES ('denda_keterlambatan', ?) ON DUPLICATE KEY UPDATE config_value = ?");
            $stmt->execute([$data['denda_keterlambatan'], $data['denda_keterlambatan']]);
        }
        if (isset($data['jatuh_tempo'])) {
            $stmt = $conn->prepare("INSERT INTO app_config (config_key, config_value) VALUES ('jatuh_tempo', ?) ON DUPLICATE KEY UPDATE config_value = ?");
            $stmt->execute([$data['jatuh_tempo'], $data['jatuh_tempo']]);
        }

        $conn->commit();
        logActivity($conn, 'admin', 'Update Tarif & Denda', 'Konfigurasi tarif dan denda diperbarui.');
        echo json_encode(['success' => true, 'message' => 'Tarif dan konfigurasi denda berhasil disimpan.']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
?>
