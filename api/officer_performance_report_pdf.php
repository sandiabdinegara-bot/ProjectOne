<?php
require_once 'config.php';
require_once 'fpdf/fpdf.php';

// Get filters from URL
$month = $_GET['month'] ?? date('n');
$year = $_GET['year'] ?? date('Y');
$branch_code = $_GET['branch_code'] ?? 'Semua';
$date_filter = $_GET['date'] ?? null;
$start_date = $_GET['start_date'] ?? null;
$end_date = $_GET['end_date'] ?? null;

// Month Name Helper
$months = [
    1 => 'Januari',
    2 => 'Februari',
    3 => 'Maret',
    4 => 'April',
    5 => 'Mei',
    6 => 'Juni',
    7 => 'Juli',
    8 => 'Agustus',
    9 => 'September',
    10 => 'Oktober',
    11 => 'November',
    12 => 'Desember'
];
$monthName = $months[intval($month)];

$branch_name = 'Semua Cabang';
if ($branch_code !== 'Semua') {
    $stmt_c = $conn->prepare("SELECT cabang FROM cabang WHERE kode_cabang = ?");
    $stmt_c->execute([$branch_code]);
    $c_data = $stmt_c->fetch(PDO::FETCH_ASSOC);
    if ($c_data)
        $branch_name = $c_data['cabang'];
}

// Logic for Period Display
$isCurrentMonth = ($month == date('n') && $year == date('Y'));
$periode_display = "";

// SQL Subquery Construction
$rec_conditions = [];
$rec_params = [];

if ($start_date && $end_date) {
    // 1. Range Mode (Prioritized if filled)
    $rec_conditions[] = "DATE(rec.tgl_pencatatan) BETWEEN ? AND ?";
    $rec_params[] = $start_date;
    $rec_params[] = $end_date;
    $periode_display = date('d/m/Y', strtotime($start_date)) . " s/d " . date('d/m/Y', strtotime($end_date));
} elseif ($date_filter) {
    // 2. Single Date Mode
    $rec_conditions[] = "DATE(rec.tgl_pencatatan) = ?";
    $rec_params[] = $date_filter;
    $periode_display = date('d/m/Y', strtotime($date_filter));
} else {
    // 3. Past Month - Full Month Mode
    $rec_conditions[] = "rec.bulan = ?";
    $rec_conditions[] = "rec.tahun = ?";
    $rec_params[] = $month;
    $rec_params[] = $year;
    $periode_display = $monthName . ' ' . $year;
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

// PDF Generation
class PDF extends FPDF
{
    function Header()
    {
        global $periode_display, $branch_name;
        $logoPath = '../logo.png';
        if (file_exists($logoPath)) {
            $this->Image($logoPath, 15, 12, 25, 0, 'JPG');
        }

        $this->SetFont('Arial', 'B', 20);
        $this->SetTextColor(14, 165, 233);
        $this->Cell(30);
        $this->Cell(150, 10, 'PDAM SMART Indramayu', 0, 1, 'L');

        $this->SetFont('Arial', '', 10);
        $this->SetTextColor(100, 116, 139);
        $this->Cell(30);
        $this->Cell(150, 5, 'Laporan Kinerja Pembaca Meter (Realisasi & Kesesuaian Foto)', 0, 1, 'L');
        $this->Cell(30);
        $this->Cell(150, 5, 'Cabang: ' . $branch_name . ' | Periode: ' . $periode_display, 0, 0, 'L');


        $this->SetXY(210, 15);
        $this->SetFont('Arial', '', 7);
        $this->SetTextColor(150);
        $this->Cell(72, 5, 'KODE DOKUMEN', 0, 1, 'R');
        $this->SetX(210);
        $this->SetFont('Arial', 'B', 10);
        $this->Cell(72, 5, 'RPT-PERF-001', 0, 1, 'R');

        $this->SetDrawColor(14, 165, 233);
        $this->SetLineWidth(0.8);
        $this->Line(15, 38, 282, 38);
        $this->Ln(15);
    }

    function Footer()
    {
        $this->SetY(-15);
        $this->SetFont('Arial', 'I', 8);
        $this->SetTextColor(150);
        $this->Cell(0, 10, 'Halaman ' . $this->PageNo() . ' / {nb}', 0, 0, 'C');
        $this->Cell(0, 10, 'Dicetak pada: ' . date('d/m/Y H:i'), 0, 0, 'R');
    }
}

$pdf = new PDF('L', 'mm', 'A4');
$pdf->AliasNbPages();
$pdf->AddPage();
$pdf->SetMargins(10, 15, 10);

$pdf->SetFont('Arial', 'B', 14);
$pdf->SetTextColor(15, 23, 42);
$pdf->Cell(0, 10, 'LAPORAN KINERJA PETUGAS', 0, 1, 'C');
$pdf->Ln(2);

// Table Header
$pdf->SetFillColor(14, 165, 233);
$pdf->SetTextColor(255);
$pdf->SetFont('Arial', 'B', 8);

// Column Widths
$w = array(10, 45, 35, 30, 30, 30, 35, 62);
$header = array('NO', 'NAMA PETUGAS', 'CABANG', 'TARGET PELANGGAN', 'TERBACA', 'CAPAIAN (%)', 'SESUAI FOTO', 'REVIEW/MISMATCH');

for ($i = 0; $i < count($header); $i++) {
    $pdf->Cell($w[$i], 10, $header[$i], 1, 0, 'C', true);
}
$pdf->Ln();

$pdf->SetTextColor(51);
$pdf->SetFont('Arial', '', 8);
$pdf->SetFillColor(255);

$index = 1;
foreach ($performance_data as $row) {
    if ($row['total_pelanggan'] == 0 && $row['total_dibaca'] == 0)
        continue; // Skip petugas without assignment or output

    $percentage = $row['total_pelanggan'] > 0 ? round(($row['total_dibaca'] / $row['total_pelanggan']) * 100, 1) : 0;

    $pdf->Cell($w[0], 8, $index++, 1, 0, 'C');
    $pdf->Cell($w[1], 8, $row['nama_petugas'], 1, 0, 'L');
    $pdf->Cell($w[2], 8, $row['nama_cabang'] ?: '-', 1, 0, 'L');
    $pdf->Cell($w[3], 8, number_format($row['total_pelanggan']), 1, 0, 'C');
    $pdf->Cell($w[4], 8, number_format($row['total_dibaca']), 1, 0, 'C');

    // Color coding for percentage
    if ($percentage < 50)
        $pdf->SetTextColor(185, 28, 28); // Red
    elseif ($percentage < 85)
        $pdf->SetTextColor(180, 83, 9); // Amber
    else
        $pdf->SetTextColor(21, 128, 61); // Green

    $pdf->Cell($w[5], 8, $percentage . '%', 1, 0, 'C');
    $pdf->SetTextColor(51);

    $pdf->Cell($w[6], 8, number_format($row['sesuai']), 1, 0, 'C');
    $pdf->Cell($w[7], 8, number_format($row['mismatch']), 1, 1, 'C');
}

$pdf->Output('I', 'Laporan_Kinerja_Petugas_' . date('Y-m-d') . '.pdf');
?>