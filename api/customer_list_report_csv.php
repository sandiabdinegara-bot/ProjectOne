<?php
require_once 'config.php';

// Get filters from URL
$branch_code = $_GET['branch_code'] ?? 'Semua';
$format = $_GET['format'] ?? 'csv'; // 'csv' or 'excel' (excel uses CSV header but with .xls extension for simple compat)

// Database Query
$conditions = ["dp.deleted_at IS NULL"];
$params = [];

if ($branch_code !== 'Semua') {
    $conditions[] = "dp.kode_cabang = ?";
    $params[] = $branch_code;
}

$sql = "SELECT dp.*, c.cabang as nama_cabang 
        FROM data_pelanggan dp
        LEFT JOIN cabang c ON dp.kode_cabang = c.kode_cabang";

if (!empty($conditions)) {
    $sql .= " WHERE " . implode(" AND ", $conditions);
}
$sql .= " ORDER BY dp.kode_cabang ASC, dp.kode_rute ASC, dp.id_sambungan ASC";

$stmt = $conn->prepare($sql);
$stmt->execute($params);
$customers = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Header for Download
$filename = "Laporan_Pelanggan_" . ($branch_code === 'Semua' ? 'Semua_Cabang' : $branch_code) . "_" . date('Ymd');

if ($format === 'excel') {
    header('Content-Type: application/vnd.ms-excel');
    header('Content-Disposition: attachment; filename="' . $filename . '.xls"');
} else {
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $filename . '.csv"');
}

$output = fopen('php://output', 'w');

// UTF-8 BOM for Excel compatibility
fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

// Column Headers
fputcsv($output, [
    'NO',
    'NO. SAMBUNGAN',
    'ID METER',
    'ID TAG',
    'NAMA PELANGGAN',
    'ALAMAT',
    'TELEPON',
    'KODE CABANG',
    'NAMA CABANG',
    'KODE RUTE',
    'KODE TARIF',
    'KECAMATAN',
    'DESA',
    'RW',
    'RT',
    'LONGITUDE',
    'LATITUDE',
    'TANGGAL AKTIF'
]);

// Data Rows
$index = 1;
foreach ($customers as $row) {
    fputcsv($output, [
        $index++,
        '="' . $row['id_sambungan'] . '"',
        '="' . $row['id_meter'] . '"',
        '="' . $row['id_tag'] . '"',
        $row['nama'],
        $row['alamat'],
        $row['telepon'],
        $row['kode_cabang'],
        $row['nama_cabang'],
        $row['kode_rute'],
        $row['kode_tarif'],
        $row['kode_kecamatan'],
        $row['kode_desa'],
        $row['kode_rw'],
        $row['kode_rt'],
        $row['longitude'],
        $row['latitude'],
        $row['active_date']
    ]);
}

fclose($output);
?>