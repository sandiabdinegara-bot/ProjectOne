<?php
require_once 'config.php';
require_once 'fpdf/fpdf.php';

// Get filters from URL
$month = $_GET['month'] ?? date('n');
$year = $_GET['year'] ?? date('Y');
$branch_code = $_GET['branch_code'] ?? 'Semua';

// Database Query
// We look for 0 usage in selected month and join with previous month
$sql = "SELECT 
            rec.id_sambungan, rec.nama, dp.alamat, dp.kode_tarif, c.cabang as nama_cabang,
            rec.stan_akhir as stan_sekarang,
            prev.stan_akhir as stan_lalu,
            prev2.stan_akhir as stan_lalu_2
        FROM data_pencatatan rec
        JOIN data_pelanggan dp ON rec.id_pelanggan = dp.id
        LEFT JOIN cabang c ON dp.kode_cabang = c.kode_cabang
        
        -- Previous Month
        LEFT JOIN data_pencatatan prev ON rec.id_pelanggan = prev.id_pelanggan 
            AND (
                (rec.bulan > 1 AND prev.bulan = rec.bulan - 1 AND prev.tahun = rec.tahun) OR
                (rec.bulan = 1 AND prev.bulan = 12 AND prev.tahun = rec.tahun - 1)
            )
            
        -- 2 Months Ago (Optional but good for 'Macet' detection)
        LEFT JOIN data_pencatatan prev2 ON rec.id_pelanggan = prev2.id_pelanggan
            AND (
                (rec.bulan > 2 AND prev2.bulan = rec.bulan - 2 AND prev2.tahun = rec.tahun) OR
                (rec.bulan = 2 AND prev2.bulan = 1 AND prev2.tahun = rec.tahun) OR
                (rec.bulan = 1 AND prev2.bulan = 11 AND prev2.tahun = rec.tahun - 1)
            )
            
        WHERE rec.bulan = ? AND rec.tahun = ?
        AND (rec.stan_akhir - IFNULL(prev.stan_akhir, 0)) = 0";

$params = [$month, $year];

if ($branch_code !== 'Semua') {
    $sql .= " AND dp.kode_cabang = ?";
    $params[] = $branch_code;
}

$sql .= " ORDER BY c.cabang ASC, rec.nama ASC";

$stmt = $conn->prepare($sql);
$stmt->execute($params);
$recordings = $stmt->fetchAll(PDO::FETCH_ASSOC);

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
        $this->Cell(150, 5, 'Laporan Pelanggan Pemakaian Nol / Meter Macet', 0, 1, 'L');
        $this->Cell(30);
        $this->Cell(150, 5, 'Deteksi dini meter tidak berputar atau rumah kosong secara sistem', 0, 0, 'L');

        $this->SetXY(210, 15);
        $this->SetFont('Arial', '', 7);
        $this->SetTextColor(150);
        $this->Cell(72, 5, 'KODE DOKUMEN', 0, 1, 'R');
        $this->SetX(210);
        $this->SetFont('Arial', 'B', 10);
        $this->Cell(72, 5, 'RPT-TEC-ZRO-001', 0, 1, 'R');

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
$pdf->SetMargins(15, 15, 15);

$pdf->SetFont('Arial', 'B', 14);
$pdf->SetTextColor(15, 23, 42);
$pdf->Cell(0, 10, 'LAPORAN MONITORING PEMAKAIAN NOL / METER MACET', 0, 1, 'C');
$pdf->SetFont('Arial', 'B', 11);
$pdf->Cell(0, 7, 'Periode: ' . strtoupper($periodDisplay) . ' | Cabang: ' . ($branch_code === 'Semua' ? 'SEMUA CABANG' : $branch_code), 0, 1, 'C');
$pdf->Ln(5);

// Table Header
$pdf->SetFillColor(30, 41, 59); // Dark Slate for Technical Report
$pdf->SetTextColor(255);
$pdf->SetDrawColor(50);
$pdf->SetFont('Arial', 'B', 8);

$w = array(10, 25, 50, 75, 22, 28, 28, 29);
$header = array('NO', 'ID SAMB', 'NAMA PELANGGAN', 'ALAMAT', 'TARIF', 'BLN INI (m3)', 'BLN LALU (m3)', 'STATUS MACET');

foreach ($header as $i => $h) {
    $pdf->Cell($w[$i], 10, $h, 1, 0, 'C', true);
}
$pdf->Ln();

// Table Body
$pdf->SetTextColor(51);
$pdf->SetFont('Arial', '', 8);

if (empty($recordings)) {
    $pdf->Cell(array_sum($w), 10, 'Tidak ada data pemakaian nol pada periode ini.', 1, 1, 'C');
} else {
    $index = 1;
    foreach ($recordings as $row) {
        // Strategic: Highlight if consecutive 0s
        $is_stuck = false;
        $prev_usage = ($row['stan_lalu'] !== null && $row['stan_lalu_2'] !== null) ? ($row['stan_lalu'] - $row['stan_lalu_2']) : null;

        if ($prev_usage === 0) {
            $pdf->SetFillColor(255, 247, 237); // Light Orange
            $is_stuck = true;
            $fill = true;
        } else {
            $pdf->SetFillColor(255);
            $fill = false;
        }

        $pdf->Cell($w[0], 10, $index++, 1, 0, 'C', $fill);
        $pdf->Cell($w[1], 10, $row['id_sambungan'], 1, 0, 'C', $fill);
        $pdf->Cell($w[2], 10, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', substr($row['nama'], 0, 28)), 1, 0, 'L', $fill);
        $pdf->Cell($w[3], 10, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', substr($row['alamat'], 0, 45)), 1, 0, 'L', $fill);
        $pdf->Cell($w[4], 10, $row['kode_tarif'], 1, 0, 'C', $fill);
        $pdf->Cell($w[5], 10, '0 m3', 1, 0, 'C', $fill);
        $pdf->Cell($w[6], 10, ($prev_usage !== null ? $prev_usage . ' m3' : '-'), 1, 0, 'C', $fill);

        $statusText = $is_stuck ? '2 BULAN NOL' : 'PEMAKAIAN NOL';
        if ($is_stuck)
            $pdf->SetTextColor(194, 65, 12); // Orange 700
        $pdf->Cell($w[7], 10, $statusText, 1, 1, 'C', $fill);
        $pdf->SetTextColor(51);
    }
}

$pdf->Ln(10);
$pdf->SetFont('Arial', 'I', 8);
$pdf->SetTextColor(100);
$pdf->Cell(0, 5, '* Analisa: Pelanggan dengan status [2 BULAN NOL] diremehkan untuk dilakukan pengecekan fisik meter (kemungkinan macet atau rumah tidak berpenghuni).', 0, 1, 'L');

$pdf->Output('I', 'Laporan_Pemakaian_Nol_' . $periodDisplay . '.pdf');
?>