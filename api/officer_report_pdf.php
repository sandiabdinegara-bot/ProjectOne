<?php
require_once 'config.php';
require_once 'fpdf/fpdf.php';

// Get filters from URL
$branch_code = $_GET['branch_code'] ?? null;
$search = $_GET['search'] ?? null;
$status = $_GET['status'] ?? null;

// Database Query
$conditions = ["p.deleted_at IS NULL"];
$params = [];

if ($branch_code && $branch_code !== 'All') {
    $conditions[] = "p.kode_cabang = ?";
    $params[] = $branch_code;
}

if ($search) {
    $conditions[] = "(p.nama LIKE ? OR p.nik LIKE ? OR p.ktp LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

if ($status && $status !== 'Semua') {
    $conditions[] = "p.status_aktif = ?";
    $params[] = $status;
}

$sql = "SELECT p.*, c.cabang as nama_cabang 
        FROM data_petugas p 
        LEFT JOIN cabang c ON p.kode_cabang = c.kode_cabang 
        WHERE " . implode(" AND ", $conditions) . " 
        ORDER BY p.nama ASC";

$stmt = $conn->prepare($sql);
$stmt->execute($params);
$officers = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Fetch routes for each officer
$stmt_routes = $conn->prepare("SELECT kode_rute FROM data_wilayah_petugas WHERE id_petugas = ?");
foreach ($officers as &$off) {
    $stmt_routes->execute([$off['id']]);
    $routes = $stmt_routes->fetchAll(PDO::FETCH_COLUMN);
    $off['kode_rute'] = implode(", ", $routes);
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
        $this->Cell(72, 5, 'RPT-OFF-001', 0, 1, 'R');

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
$pdf->Cell(0, 10, 'LAPORAN DATA PETUGAS', 0, 1, 'C');
$pdf->SetFont('Arial', '', 9);
$pdf->SetTextColor(100);
$pdf->Cell(0, 5, 'Dicetak pada: ' . date('d F Y') . ' pukul ' . date('H.i'), 0, 1, 'C');
$pdf->Ln(5);

// Table Header
$pdf->SetFillColor(14, 165, 233); // Blue Header
$pdf->SetTextColor(255); // White Text
$pdf->SetDrawColor(226, 232, 240); // Lighter border
$pdf->SetFont('Arial', 'B', 8);

// Column Widths
$w = array(10, 25, 35, 30, 55, 15, 97);
$header = array('NO', 'NIK', 'NO. KTP', 'CABANG', 'NAMA PETUGAS', 'FOTO', 'ALAMAT');

for ($i = 0; $i < count($header); $i++) {
    $pdf->Cell($w[$i], 10, $header[$i], 1, 0, 'C', true);
}
$pdf->Ln();

// Table Body
$pdf->SetTextColor(51); // Dark Gray
$pdf->SetFont('Arial', '', 8);
$pdf->SetFillColor(255);

$index = 1;
foreach ($officers as $off) {
    $pdf->Cell($w[0], 12, $index++, 1, 0, 'C');
    $pdf->Cell($w[1], 12, $off['nik'], 1, 0, 'C');
    $pdf->Cell($w[2], 12, $off['ktp'] ?: '-', 1, 0, 'C');
    $pdf->Cell($w[3], 12, $off['nama_cabang'] ?: '-', 1, 0, 'L');
    $pdf->Cell($w[4], 12, $off['nama'], 1, 0, 'L');

    // Photo Handling
    $x = $pdf->GetX();
    $y = $pdf->GetY();
    $pdf->Cell($w[5], 12, '', 1, 0, 'C'); // Placeholder for border

    if (!empty($off['foto_petugas'])) {
        $filename = basename($off['foto_petugas']);
        $imgPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'foto_petugas' . DIRECTORY_SEPARATOR . $filename;
        if (file_exists($imgPath)) {
            // Put image inside the cell
            $pdf->Image($imgPath, $x + 2.5, $y + 1, 10, 10);
        }
    } else {
        $pdf->SetXY($x, $y);
        $pdf->Cell($w[5], 12, '-', 0, 0, 'C');
        $pdf->SetXY($x + $w[5], $y);
    }

    $pdf->Cell($w[6], 12, substr($off['alamat'], 0, 50) . (strlen($off['alamat']) > 50 ? '...' : ''), 1, 1, 'L');
}

$pdf->Output('I', 'Laporan_Petugas_' . date('Y-m-d') . '.pdf');
?>