<?php
require_once 'config.php';

// Get filters from URL
$month = $_GET['month'] ?? date('n');
$year = $_GET['year'] ?? date('Y');
$kondisi_meter = $_GET['kondisi_meter'] ?? null;
$ocr_status = $_GET['ocr_status'] ?? null;
$usage_status = $_GET['usage_status'] ?? null;

// Database Query
$conditions = ["rec.bulan = ?", "rec.tahun = ?"];
$params = [$month, $year];

if ($kondisi_meter && $kondisi_meter !== 'Semua') {
    $conditions[] = "rec.status_laporan = ?";
    $params[] = $kondisi_meter;
}

if ($ocr_status && $ocr_status !== 'Semua') {
    if ($ocr_status === 'Sesuai') {
        $conditions[] = "(rec.ai_ocr_status = 'GREEN' OR (rec.ai_ocr_status IS NULL AND rec.stan_akhir > 0 AND rec.foto IS NOT NULL))";
    } elseif ($ocr_status === 'Butuh Review') {
        $conditions[] = "rec.ai_ocr_status = 'YELLOW'";
    } elseif ($ocr_status === 'Mismatch') {
        $conditions[] = "rec.ai_ocr_status = 'RED'";
    } elseif ($ocr_status === 'Terverifikasi') {
        $conditions[] = "rec.tgl_verifikasi IS NOT NULL AND rec.tgl_verifikasi != ''";
    }
}

$sql = "SELECT rec.*, sk.status_kondisi as keterangan_kondisi
        FROM data_pencatatan rec
        LEFT JOIN status_kondisi sk ON rec.status_laporan = sk.kode_kondisi
        WHERE " . implode(" AND ", $conditions) . "
        ORDER BY rec.nama ASC";

$stmt = $conn->prepare($sql);
$stmt->execute($params);
$recordings = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Fetch Status Analisa ranges
$stmt_analisa = $conn->query("SELECT min, max, status_analisa FROM status_analisa ORDER BY CAST(min AS SIGNED) ASC");
$status_analisa_options = $stmt_analisa->fetchAll(PDO::FETCH_ASSOC);

// Helper function to calculate usage and status
function getAnalysis($rec, $status_analisa_options)
{
    global $conn;
    $prevMonth = intval($rec['bulan']) - 1;
    $prevYear = intval($rec['tahun']);
    if ($prevMonth === 0) {
        $prevMonth = 12;
        $prevYear -= 1;
    }

    $stmt = $conn->prepare("SELECT stan_akhir FROM data_pencatatan WHERE id_sambungan = ? AND bulan = ? AND tahun = ? LIMIT 1");
    $stmt->execute([$rec['id_sambungan'], $prevMonth, $prevYear]);
    $prevRec = $stmt->fetch(PDO::FETCH_ASSOC);
    $stan_awal = $prevRec ? intval($prevRec['stan_akhir']) : 0;

    $usage = intval($rec['stan_akhir']) - $stan_awal;
    if (intval($rec['stan_akhir']) === 0)
        $usage = 0;

    $status = '-';
    if ($usage < 0) {
        $status = 'Meter Mundur';
    } else {
        foreach ($status_analisa_options as $opt) {
            if ($usage >= intval($opt['min']) && $usage <= intval($opt['max'])) {
                $status = $opt['status_analisa'];
                break;
            }
        }
    }

    return ['usage' => $usage, 'status' => $status, 'stan_awal' => $stan_awal];
}

// Process data
$data = [];
foreach ($recordings as $rec) {
    $analysis = getAnalysis($rec, $status_analisa_options);

    // Usage status filter
    if ($usage_status && $usage_status !== 'Semua' && $analysis['status'] !== $usage_status) {
        continue;
    }

    $ocr = $rec['ai_ocr_status'] ?: ($rec['stan_akhir'] > 0 && $rec['foto'] ? 'GREEN' : '-');
    $ocr_label = $ocr === 'GREEN' ? 'Sesuai' : ($ocr === 'YELLOW' ? 'Butuh Review' : ($ocr === 'RED' ? 'Mismatch' : '-'));

    $data[] = [
        'ID Sambungan' => $rec['id_sambungan'],
        'Nama Pelanggan' => $rec['nama'],
        'Stan Awal' => $analysis['stan_awal'],
        'Stan Akhir' => $rec['stan_akhir'],
        'Pemakaian (m3)' => $analysis['usage'],
        'Status OCR' => $ocr_label,
        'Hasil Analisa' => $analysis['status'],
        'Kondisi Meter' => $rec['keterangan_kondisi'] ?: '-',
        'Tanggal Verifikasi' => $rec['tgl_verifikasi'] ?: '-'
    ];
}

// Set Headers for CSV Download
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename=Laporan_Analisa_ABM_' . date('Y-m-d') . '.csv');

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