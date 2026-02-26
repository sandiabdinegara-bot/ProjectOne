<?php
require_once 'config.php';

// Get filters from URL
$month = $_GET['month'] ?? date('n');
$year = $_GET['year'] ?? date('Y');
$branch_code = $_GET['branch_code'] ?? 'Semua';
$date_filter = $_GET['date'] ?? null;
$start_date = $_GET['start_date'] ?? null;
$end_date = $_GET['end_date'] ?? null;
$format = $_GET['format'] ?? 'csv';

// Logic for Period Display
$isCurrentMonth = ($month == date('n') && $year == date('Y'));

// SQL Subquery Construction
$rec_conditions = [];
$rec_params = [];

if ($start_date && $end_date) {
    // 1. Range Mode (Prioritized if filled)
    $rec_conditions[] = "DATE(rec.tgl_pencatatan) BETWEEN ? AND ?";
    $rec_params[] = $start_date;
    $rec_params[] = $end_date;
} elseif ($date_filter) {
    // 2. Single Date Mode
    $rec_conditions[] = "DATE(rec.tgl_pencatatan) = ?";
    $rec_params[] = $date_filter;
} else {
    // 3. Past Month - Full Month Mode
    $rec_conditions[] = "rec.bulan = ?";
    $rec_conditions[] = "rec.tahun = ?";
    $rec_params[] = $month;
    $rec_params[] = $year;
}

$rec_cond_str = implode(" AND ", $rec_conditions);

// Main SQL
$conditions_petugas = ["p.deleted_at IS NULL"];
$params_petugas = [];

if ($branch_code !== 'Semua') {
    $conditions_petugas[] = "p.kode_cabang = ?";
    $params_petugas[] = $branch_code;
}

$sql = "
    SELECT 
        p.id,
        p.nama as nama_petugas,
        c.cabang as nama_cabang,
        (
            SELECT COUNT(DISTINCT dp.id) 
            FROM data_pelanggan dp 
            JOIN data_wilayah_petugas dwp ON dp.kode_rute = dwp.kode_rute 
            WHERE dwp.id_petugas = p.id AND dwp.status_aktif = 'Aktif'
        ) as total_pelanggan,
        (
            SELECT COUNT(*) 
            FROM data_pencatatan rec 
            WHERE rec.petugas = p.nama AND $rec_cond_str
        ) as total_dibaca,
        (
            SELECT COUNT(*) 
            FROM data_pencatatan rec 
            WHERE rec.petugas = p.nama AND $rec_cond_str 
            AND (rec.ai_ocr_status = 'GREEN' OR (rec.ai_ocr_status IS NULL AND rec.stan_akhir > 0 AND rec.foto IS NOT NULL))
        ) as sesuai,
        (
            SELECT COUNT(*) 
            FROM data_pencatatan rec 
            WHERE rec.petugas = p.nama AND $rec_cond_str 
            AND (rec.ai_ocr_status = 'YELLOW' OR rec.ai_ocr_status = 'RED')
        ) as mismatch
    FROM data_petugas p
    LEFT JOIN cabang c ON p.kode_cabang = c.kode_cabang
    WHERE " . implode(" AND ", $conditions_petugas) . "
    ORDER BY p.nama ASC
";

$final_params = array_merge($rec_params, $rec_params, $rec_params, $params_petugas);
$stmt = $conn->prepare($sql);
$stmt->execute($final_params);
$performance_data = $stmt->fetchAll(PDO::FETCH_ASSOC);

$data = [];
$index = 1;
foreach ($performance_data as $row) {
    if ($row['total_pelanggan'] == 0 && $row['total_dibaca'] == 0)
        continue;

    $percentage = $row['total_pelanggan'] > 0 ? round(($row['total_dibaca'] / $row['total_pelanggan']) * 100, 1) : 0;

    $data[] = [
        'No' => $index++,
        'Nama Petugas' => $row['nama_petugas'],
        'Cabang' => $row['nama_cabang'] ?: '-',
        'Target Pelanggan' => $row['total_pelanggan'],
        'Terbaca' => $row['total_dibaca'],
        'Capaian (%)' => $percentage . '%',
        'Sesuai Foto' => $row['sesuai'],
        'Review/Mismatch' => $row['mismatch']
    ];
}

// Set Headers for Download
if ($format === 'excel') {
    header('Content-Type: application/vnd.ms-excel; charset=utf-8');
    header('Content-Disposition: attachment; filename=Laporan_Kinerja_Petugas_' . date('Y-m-d') . '.xls');
} else {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=Laporan_Kinerja_Petugas_' . date('Y-m-d') . '.csv');
}

$output = fopen('php://output', 'w');

// Add BOM for Excel UTF-8 support
fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

// Add Headers
if (!empty($data)) {
    fputcsv($output, array_keys($data[0]));
}

// Add Rows
foreach ($data as $row) {
    fputcsv($output, $row);
}

fclose($output);
?>