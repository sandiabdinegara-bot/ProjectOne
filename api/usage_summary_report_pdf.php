<?php
require_once 'config.php';
require_once 'fpdf/fpdf.php';

// Get filters from URL
$month = $_GET['month'] ?? date('n');
$year = $_GET['year'] ?? date('Y');
$branch_code = $_GET['branch_code'] ?? 'Semua';

// Database Query for Summary
// We join current records with previous month to get stan_awal and calculate usage
$sql = "SELECT 
            dp.kode_cabang, 
            c.cabang as nama_cabang, 
            dp.kode_tarif,
            t.tarif as nama_tarif,
            COUNT(rec.id) as total_pelanggan,
            SUM(CASE WHEN rec.stan_akhir = 0 THEN 0 ELSE (rec.stan_akhir - IFNULL(prev.stan_akhir, 0)) END) as total_pemakaian
        FROM data_pencatatan rec
        JOIN data_pelanggan dp ON rec.id_pelanggan = dp.id
        LEFT JOIN cabang c ON dp.kode_cabang = c.kode_cabang
        LEFT JOIN tarif t ON dp.kode_tarif = t.kode_tarif
        LEFT JOIN data_pencatatan prev ON rec.id_pelanggan = prev.id_pelanggan 
            AND (
                (rec.bulan > 1 AND prev.bulan = rec.bulan - 1 AND prev.tahun = rec.tahun) OR
                (rec.bulan = 1 AND prev.bulan = 12 AND prev.tahun = rec.tahun - 1)
            )
        WHERE rec.bulan = ? AND rec.tahun = ?";

$params = [$month, $year];

if ($branch_code !== 'Semua') {
    $sql .= " AND dp.kode_cabang = ?";
    $params[] = $branch_code;
}

$sql .= " GROUP BY dp.kode_cabang, dp.kode_tarif
          ORDER BY dp.kode_cabang ASC, dp.kode_tarif ASC";

$stmt = $conn->prepare($sql);
$stmt->execute($params);
$summary_data = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Get Month Name
$monthNames = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
$periodDisplay = $monthNames[intval($month)] . " " . $year;

// PDF Generation
class PDF extends FPDF
{
    function Header()
    {
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
        $this->Cell(150, 5, 'Laporan Rekapitulasi Pemakaian Per Cabang & Tarif (LPP)', 0, 1, 'L');
        $this->Cell(30);
        $this->Cell(150, 5, 'Ringkasan total kubikasi air yang terjual berdasarkan kategori', 0, 0, 'L');

        $this->SetXY(140, 15);
        $this->SetFont('Arial', '', 7);
        $this->SetTextColor(150);
        $this->Cell(55, 5, 'KODE DOKUMEN', 0, 1, 'R');
        $this->SetX(140);
        $this->SetFont('Arial', 'B', 10);
        $this->Cell(55, 5, 'RPT-FIN-LPP-001', 0, 1, 'R');

        $this->SetDrawColor(14, 165, 233);
        $this->SetLineWidth(0.8);
        $this->Line(15, 38, 195, 38);
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

$pdf = new PDF('P', 'mm', 'A4');
$pdf->AliasNbPages();
$pdf->AddPage();
$pdf->SetMargins(15, 15, 15);

$pdf->SetFont('Arial', 'B', 14);
$pdf->SetTextColor(15, 23, 42);
$pdf->Cell(0, 10, 'REKAPITULASI PEMAKAIAN AIR (LPP)', 0, 1, 'C');
$pdf->SetFont('Arial', 'B', 11);
$pdf->Cell(0, 7, 'Periode: ' . strtoupper($periodDisplay), 0, 1, 'C');
$pdf->Ln(5);

// Table Header
$pdf->SetFillColor(14, 165, 233);
$pdf->SetTextColor(255);
$pdf->SetDrawColor(226, 232, 240);
$pdf->SetFont('Arial', 'B', 9);

$w = array(10, 45, 50, 35, 40);
$header = array('NO', 'CABANG', 'TARIF', 'PELANGGAN', 'PEMAKAIAN (m3)');

foreach ($header as $i => $h) {
    $pdf->Cell($w[$i], 12, $h, 1, 0, 'C', true);
}
$pdf->Ln();

// Table Body
$pdf->SetTextColor(51);
$pdf->SetFont('Arial', '', 9);

$total_all_customers = 0;
$total_all_usage = 0;

if (empty($summary_data)) {
    $pdf->Cell(array_sum($w), 12, 'Tidak ada data pemakaian pada periode ini.', 1, 1, 'C');
} else {
    $index = 1;
    $current_branch = '';

    foreach ($summary_data as $row) {
        $pdf->Cell($w[0], 10, $index++, 1, 0, 'C');

        // Show branch name only on first occurrence
        $branch_display = ($row['nama_cabang'] !== $current_branch) ? $row['nama_cabang'] : '';
        $pdf->Cell($w[1], 10, $branch_display, 1, 0, 'L');
        $current_branch = $row['nama_cabang'];

        $pdf->Cell($w[2], 10, '[' . $row['kode_tarif'] . '] ' . ($row['nama_tarif'] ?: 'N/A'), 1, 0, 'L');
        $pdf->Cell($w[3], 10, number_format($row['total_pelanggan'], 0, ',', '.'), 1, 0, 'C');
        $pdf->Cell($w[4], 10, number_format($row['total_pemakaian'], 0, ',', '.') . ' m3', 1, 1, 'R');

        $total_all_customers += $row['total_pelanggan'];
        $total_all_usage += $row['total_pemakaian'];
    }

    // Grand Total Row
    $pdf->SetFont('Arial', 'B', 9);
    $pdf->SetFillColor(248, 250, 252);
    $pdf->Cell($w[0] + $w[1] + $w[2], 12, 'GRAND TOTAL', 1, 0, 'R', true);
    $pdf->Cell($w[3], 12, number_format($total_all_customers, 0, ',', '.'), 1, 0, 'C', true);
    $pdf->Cell($w[4], 12, number_format($total_all_usage, 0, ',', '.') . ' m3', 1, 1, 'R', true);
}

$pdf->Ln(10);
// Signatures
$pdf->SetFont('Arial', '', 10);
$pdf->Cell(120);
$pdf->Cell(60, 5, 'Indramayu, ' . date('d F Y'), 0, 1, 'C');
$pdf->Cell(120);
$pdf->Cell(60, 5, 'Dibuat Oleh,', 0, 1, 'C');
$pdf->Ln(20);
$pdf->Cell(120);
$pdf->SetFont('Arial', 'B', 10);
$pdf->Cell(60, 5, '____________________', 0, 1, 'C');
$pdf->Cell(120);
$pdf->SetFont('Arial', '', 9);
$pdf->Cell(60, 5, 'Staf Administrasi & Umum', 0, 1, 'C');

$pdf->Output('I', 'Laporan_Rekap_Pemakaian_' . $periodDisplay . '.pdf');
?>