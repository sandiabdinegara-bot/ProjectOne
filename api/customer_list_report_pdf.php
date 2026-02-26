<?php
require_once 'config.php';
require_once 'fpdf/fpdf.php';

// Get filters from URL
$branch_code = $_GET['branch_code'] ?? 'Semua';

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

// Get Branch Name for Title
$branch_name = "Semua Cabang";
if ($branch_code !== 'Semua' && !empty($customers)) {
    $branch_name = $customers[0]['nama_cabang'];
}

// PDF Generation
class PDF extends FPDF
{
    function Header()
    {
        // Logo
        $logoPath = '../logo.png';
        if (file_exists($logoPath)) {
            $this->Image($logoPath, 15, 12, 25, 0, 'JPG');
        }

        // Title
        $this->SetFont('Arial', 'B', 20);
        $this->SetTextColor(14, 165, 233); // Blue accent
        $this->Cell(30); // Spacer for logo
        $this->Cell(150, 10, 'PDAM SMART Indramayu', 0, 1, 'L');

        $this->SetFont('Arial', '', 10);
        $this->SetTextColor(100, 116, 139); // Gray text
        $this->Cell(30); // Spacer for logo
        $this->Cell(150, 5, 'Sistem Informasi Manajemen Pelanggan Terintegrasi', 0, 1, 'L');
        $this->Cell(30); // Spacer
        $this->Cell(150, 5, 'Jl. Unit Pelayanan No. 45, Kab. Indramayu | Telp: (0234) 123456', 0, 0, 'L');

        // Document Code (Top Right)
        $this->SetXY(210, 15);
        $this->SetFont('Arial', '', 7);
        $this->SetTextColor(150);
        $this->Cell(72, 5, 'KODE DOKUMEN', 0, 1, 'R');
        $this->SetX(210);
        $this->SetFont('Arial', 'B', 10);
        $this->Cell(72, 5, 'RPT-CST-MBR-001', 0, 1, 'R');

        // Horizontal Line
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

// Create Instance (Landscape, A4)
$pdf = new PDF('L', 'mm', 'A4');
$pdf->AliasNbPages();
$pdf->AddPage();
$pdf->SetMargins(15, 15, 15);

// Report Title
$pdf->SetFont('Arial', 'B', 16);
$pdf->SetTextColor(15, 23, 42); // Slate 900
$pdf->Cell(0, 10, 'LAPORAN DATA PELANGGAN AKTIF', 0, 1, 'C');
$pdf->SetFont('Arial', 'B', 12);
$pdf->Cell(0, 7, strtoupper($branch_name), 0, 1, 'C');
$pdf->SetFont('Arial', '', 9);
$pdf->SetTextColor(100);
$pdf->Cell(0, 5, 'Per Tanggal: ' . date('d F Y'), 0, 1, 'C');
$pdf->Ln(5);

// Table Header
$pdf->SetFillColor(14, 165, 233); // Blue Header
$pdf->SetTextColor(255); // White Text
$pdf->SetDrawColor(226, 232, 240); // Lighter border
$pdf->SetFont('Arial', 'B', 9);

// Column Widths
$w = array(12, 35, 30, 60, 80, 25, 25);
$header = array('NO', 'NO. SAMBUNGAN', 'ID METER', 'NAMA PELANGGAN', 'ALAMAT', 'RUTE', 'TARIF');

for ($i = 0; $i < count($header); $i++) {
    $pdf->Cell($w[$i], 12, $header[$i], 1, 0, 'C', true);
}
$pdf->Ln();

// Table Body
$pdf->SetTextColor(51); // Dark Gray
$pdf->SetFont('Arial', '', 9);
$pdf->SetFillColor(255);

if (empty($customers)) {
    $pdf->Cell(array_sum($w), 12, 'Tidak ada data pelanggan untuk cabang ini.', 1, 1, 'C');
} else {
    $index = 1;
    foreach ($customers as $row) {
        $pdf->Cell($w[0], 10, $index++, 1, 0, 'C');
        $pdf->Cell($w[1], 10, $row['id_sambungan'], 1, 0, 'C');
        $pdf->Cell($w[2], 10, $row['id_meter'], 1, 0, 'C');
        $pdf->Cell($w[3], 10, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $row['nama']), 1, 0, 'L');

        // MultiCell for Alamat to handle long text
        $x = $pdf->GetX();
        $y = $pdf->GetY();
        $pdf->MultiCell($w[4], 10, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $row['alamat'] ?: '-'), 1, 'L');
        $pdf->SetXY($x + $w[4], $y);

        $pdf->Cell($w[5], 10, $row['kode_rute'] ?: '-', 1, 0, 'C');
        $pdf->Cell($w[6], 10, $row['kode_tarif'] ?: '-', 1, 1, 'C');
    }
}

$pdf->Output('I', 'Laporan_Pelanggan_' . str_replace(' ', '_', $branch_name) . '_' . date('Y-m-d') . '.pdf');
