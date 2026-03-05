<?php
require_once 'config.php';
require_once 'fpdf/fpdf.php';

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

// Fetch all recordings for initial and final stand mapping
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
function getAnalysis($rec, $recordings, $status_analisa_options)
{
    // stan_awal calculation logic similar to frontend
    $prevMonth = intval($rec['bulan']) - 1;
    $prevYear = intval($rec['tahun']);
    if ($prevMonth === 0) {
        $prevMonth = 12;
        $prevYear -= 1;
    }

    // Note: In a real scenario, we might need a separate query for stan_awal if not in the current set
    // For now, we'll try to find it in the provided recordings or assume 0 if not found
    // To be more accurate, we should probably fetch previous month data specifically

    // Simplification: use stan_awal if it was stored or fetch it separately. 
    // Given the architecture, let's assume usage is already calculated if possible or fetch prev record.

    global $conn;
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

// Filter by usage status if requested
if ($usage_status && $usage_status !== 'Semua') {
    $filtered_recordings = [];
    foreach ($recordings as $rec) {
        $analysis = getAnalysis($rec, $recordings, $status_analisa_options);
        if ($analysis['status'] === $usage_status) {
            $rec['usage'] = $analysis['usage'];
            $rec['status_pemakaian'] = $analysis['status'];
            $rec['stan_awal'] = $analysis['stan_awal'];
            $filtered_recordings[] = $rec;
        }
    }
    $recordings = $filtered_recordings;
} else {
    foreach ($recordings as &$rec) {
        $analysis = getAnalysis($rec, $recordings, $status_analisa_options);
        $rec['usage'] = $analysis['usage'];
        $rec['status_pemakaian'] = $analysis['status'];
        $rec['stan_awal'] = $analysis['stan_awal'];
    }
}

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
        $this->Cell(150, 5, 'Laporan Analisa Baca Meter Terintegrasi', 0, 1, 'L');
        $this->Cell(30);
        $this->Cell(150, 5, 'Periode: ' . ($_GET['month'] ?? date('n')) . '/' . ($_GET['year'] ?? date('Y')), 0, 0, 'L');

        $this->SetXY(210, 15);
        $this->SetFont('Arial', '', 7);
        $this->SetTextColor(150);
        $this->Cell(72, 5, 'KODE DOKUMEN', 0, 1, 'R');
        $this->SetX(210);
        $this->SetFont('Arial', 'B', 10);
        $this->Cell(72, 5, 'RPT-OCR-001', 0, 1, 'R');

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
$pdf->Cell(0, 10, 'LAPORAN ABM', 0, 1, 'C');
$pdf->Ln(2);

// Filter Info
$pdf->SetFont('Arial', '', 8);
$pdf->SetTextColor(100);
$filter_text = "Filter: ";
$filter_text .= "Kondisi: " . ($_GET['kondisi_meter'] ?? 'Semua') . " | ";
$filter_text .= "OCR: " . ($_GET['ocr_status'] ?? 'Semua') . " | ";
$filter_text .= "Usage: " . ($_GET['usage_status'] ?? 'Semua');
$pdf->Cell(0, 5, $filter_text, 0, 1, 'L');

$pdf->SetFillColor(14, 165, 233);
$pdf->SetTextColor(255);
$pdf->SetFont('Arial', 'B', 7);

// Column Widths
$w = array(8, 28, 45, 18, 18, 18, 25, 45, 30, 42);
$header = array('NO', 'ID SAMBUNGAN', 'NAMA PELANGGAN', 'AWAL', 'AKHIR', 'M3', 'STATUS OCR', 'HASIL ANALISA', 'KONDISI', 'TGL VERIF');

for ($i = 0; $i < count($header); $i++) {
    $pdf->Cell($w[$i], 8, $header[$i], 1, 0, 'C', true);
}
$pdf->Ln();

$pdf->SetTextColor(51);
$pdf->SetFont('Arial', '', 7);
$pdf->SetFillColor(255);

$index = 1;
foreach ($recordings as $rec) {
    $pdf->Cell($w[0], 7, $index++, 1, 0, 'C');
    $pdf->Cell($w[1], 7, $rec['id_sambungan'], 1, 0, 'C');
    $pdf->Cell($w[2], 7, substr($rec['nama'], 0, 30), 1, 0, 'L');
    $pdf->Cell($w[3], 7, $rec['stan_awal'], 1, 0, 'C');
    $pdf->Cell($w[4], 7, $rec['stan_akhir'], 1, 0, 'C');
    $pdf->Cell($w[5], 7, $rec['usage'], 1, 0, 'C');

    $ocr = $rec['ai_ocr_status'] ?: ($rec['stan_akhir'] > 0 && $rec['foto'] ? 'GREEN' : '-');
    $ocr_label = $ocr === 'GREEN' ? 'Sesuai' : ($ocr === 'YELLOW' ? 'Butuh Review' : ($ocr === 'RED' ? 'Mismatch' : '-'));
    $pdf->Cell($w[6], 7, $ocr_label, 1, 0, 'C');

    $pdf->Cell($w[7], 7, $rec['status_pemakaian'], 1, 0, 'L');
    $pdf->Cell($w[8], 7, $rec['keterangan_kondisi'] ?: '-', 1, 0, 'L');
    $pdf->Cell($w[9], 7, $rec['tgl_verifikasi'] ?: '-', 1, 1, 'C');
}

$pdf->Output('I', 'Laporan_Analisa_OCR_' . date('Y-m-d') . '.pdf');
?>