<?php
header('Content-Type: application/json');
require_once 'config.php';

try {
    $bulan_berjalan = date('n');
    $tahun_berjalan = date('Y');

    // 1. KPI Counts
    $count_pelanggan = $conn->query("SELECT COUNT(*) FROM data_pelanggan WHERE deleted_at IS NULL")->fetchColumn();
    $count_cabang = $conn->query("SELECT COUNT(*) FROM cabang")->fetchColumn();
    $count_petugas = $conn->query("SELECT COUNT(*) FROM data_petugas WHERE deleted_at IS NULL")->fetchColumn();

    // 2. Reading Progress (Current Month)
    $stmt_pencatatan_bulan_ini = $conn->prepare("SELECT COUNT(*) FROM data_pencatatan WHERE bulan = ? AND tahun = ?");
    $stmt_pencatatan_bulan_ini->execute([$bulan_berjalan, $tahun_berjalan]);
    $count_pencatatan = $stmt_pencatatan_bulan_ini->fetchColumn();

    $progress_percentage = $count_pelanggan > 0 ? ($count_pencatatan / $count_pelanggan) * 100 : 0;

    // 3. OCR Status Distribution (Current Month)
    $stmt_ocr_status = $conn->prepare("SELECT ai_ocr_status as label, COUNT(*) as value FROM data_pencatatan WHERE bulan = ? AND tahun = ? AND ai_ocr_status IS NOT NULL AND ai_ocr_status != '' GROUP BY ai_ocr_status");
    $stmt_ocr_status->execute([$bulan_berjalan, $tahun_berjalan]);
    $ocr_distribution = $stmt_ocr_status->fetchAll(PDO::FETCH_ASSOC);

    // 4. Meter Condition Distribution (Current Month)
    $stmt_kondisi = $conn->prepare("
        SELECT 
            COALESCE(sk.status_kondisi, dp.status_laporan) as label, 
            COUNT(*) as value 
        FROM data_pencatatan dp
        LEFT JOIN status_kondisi sk ON dp.status_laporan = sk.kode_kondisi
        WHERE dp.bulan = ? AND dp.tahun = ? 
        AND dp.status_laporan IS NOT NULL AND dp.status_laporan != '' 
        GROUP BY label
    ");
    $stmt_kondisi->execute([$bulan_berjalan, $tahun_berjalan]);
    $kondisi_distribution = $stmt_kondisi->fetchAll(PDO::FETCH_ASSOC);

    // 5. Monthly Usage Trends (Dynamic Months, Max 5)
    $num_months = isset($_GET['months']) ? min(5, max(1, (int) $_GET['months'])) : 3;
    $usage_trends = [];
    for ($i = $num_months - 1; $i >= 0; $i--) {
        $m = date('n', strtotime("-$i month"));
        $y = date('Y', strtotime("-$i month"));
        $month_name = date('M', strtotime("-$i month"));

        $stmt_usage = $conn->prepare("SELECT SUM(stan_akhir - IFNULL((SELECT p2.stan_akhir FROM data_pencatatan p2 WHERE p2.id_pelanggan = data_pencatatan.id_pelanggan AND ((p2.bulan = data_pencatatan.bulan - 1 AND p2.tahun = data_pencatatan.tahun) OR (p2.bulan = 12 AND p2.tahun = data_pencatatan.tahun - 1)) LIMIT 1), 0)) as total_usage 
                                     FROM data_pencatatan 
                                     WHERE bulan = ? AND tahun = ?");
        $stmt_usage->execute([$m, $y]);
        $total_usage = $stmt_usage->fetchColumn() ?: 0;

        $usage_trends[] = [
            'month' => $month_name,
            'usage' => (float) $total_usage
        ];
    }

    echo json_encode([
        'summary' => [
            'total_customers' => (int) $count_pelanggan,
            'total_branches' => (int) $count_cabang,
            'total_officers' => (int) $count_petugas,
            'reading_progress' => [
                'count' => (int) $count_pencatatan,
                'total' => (int) $count_pelanggan,
                'percentage' => round($progress_percentage, 1)
            ]
        ],
        'ocr_status' => $ocr_distribution,
        'meter_condition' => $kondisi_distribution,
        'usage_trends' => $usage_trends
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
?>