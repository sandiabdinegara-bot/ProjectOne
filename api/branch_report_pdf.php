<?php
require_once 'config.php';
require_once 'fpdf/fpdf.php';

// Get filters from URL
$search = $_GET['search'] ?? null;

// Database Query
$conditions = [];
$params = [];

if ($search) {
    $conditions[] = "(cabang LIKE ? OR kode_cabang LIKE ? OR alamat LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

$sql = "SELECT * FROM cabang";
if (!empty($conditions)) {
    $sql .= " WHERE " . implode(" AND ", $conditions);
}
$sql .= " ORDER BY id ASC";

$stmt = $conn->prepare($sql);
$stmt->execute($params);
$branches = $stmt->fetchAll(PDO::FETCH_ASSOC);

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
        $this->Cell(72, 5, 'RPT-BRN-001', 0, 1, 'R');

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
$pdf->Cell(0, 10, 'LAPORAN DATA CABANG', 0, 1, 'C');
$pdf->SetFont('Arial', '', 9);
$pdf->SetTextColor(100);
$pdf->Cell(0, 5, 'Dicetak pada: ' . date('d F Y') . ' pukul ' . date('H.i'), 0, 1, 'C');
$pdf->Ln(5);

// Table Header
$pdf->SetFillColor(14, 165, 233); // Blue Header
$pdf->SetTextColor(255); // White Text
$pdf->SetDrawColor(226, 232, 240); // Lighter border
$pdf->SetFont('Arial', 'B', 9);

// Column Widths
$w = array(15, 40, 60, 112, 40);
$header = array('NO', 'KODE CABANG', 'NAMA CABANG', 'ALAMAT', 'TELEPON');

for ($i = 0; $i < count($header); $i++) {
    $pdf->Cell($w[$i], 12, $header[$i], 1, 0, 'C', true);
}
$pdf->Ln();

// Table Body
$pdf->SetTextColor(51); // Dark Gray
$pdf->SetFont('Arial', '', 9);
$pdf->SetFillColor(255);

$index = 1;
foreach ($branches as $branch) {
    $pdf->Cell($w[0], 12, $index++, 1, 0, 'C');
    $pdf->Cell($w[1], 12, $branch['kode_cabang'], 1, 0, 'C');
    $pdf->Cell($w[2], 12, $branch['cabang'], 1, 0, 'L');
    $pdf->Cell($w[3], 12, $branch['alamat'] ?: '-', 1, 0, 'L');
    $pdf->Cell($w[4], 12, $branch['telepon'] ?: '-', 1, 1, 'C');
}

$pdf->Output('I', 'Laporan_Cabang_' . date('Y-m-d') . '.pdf');
?>