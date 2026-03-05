<?php
require_once 'config.php';
require_once 'fpdf/fpdf.php';

// Get filters from URL
$month = $_GET['month'] ?? date('n');
$year = $_GET['year'] ?? date('Y');
$branch_code = $_GET['branch_code'] ?? 'Semua';
$threshold = $_GET['threshold'] ?? 100; // default 100 meters

// Haversine Formula for distance calculation
function calculateDistance($lat1, $lon1, $lat2, $lon2)
{
    if (!$lat1 || !$lon1 || !$lat2 || !$lon2)
        return null;

    $earth_radius = 6371000; // in meters

    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);

    $a = sin($dLat / 2) * sin($dLat / 2) +
        cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
        sin($dLon / 2) * sin($dLon / 2);

    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    return $earth_radius * $c;
}

// Database Query
$conditions = ["rec.bulan = ?", "rec.tahun = ?"];
$params = [$month, $year];

if ($branch_code !== 'Semua') {
    $conditions[] = "dp.kode_cabang = ?";
    $params[] = $branch_code;
}

$sql = "SELECT rec.id, rec.id_sambungan, rec.nama, rec.latitude as rec_lat, rec.longitude as rec_lng, 
               dp.latitude as base_lat, dp.longitude as base_lng, dp.alamat,
               c.cabang as nama_cabang, rec.petugas
        FROM data_pencatatan rec
        JOIN data_pelanggan dp ON rec.id_pelanggan = dp.id
        LEFT JOIN cabang c ON dp.kode_cabang = c.kode_cabang
        WHERE " . implode(" AND ", $conditions) . "
        ORDER BY rec.nama ASC";

$stmt = $conn->prepare($sql);
$stmt->execute($params);
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Calculate distances and filter (if needed)
$data = [];
foreach ($results as $row) {
    $distance = calculateDistance($row['rec_lat'], $row['rec_lng'], $row['base_lat'], $row['base_lng']);

    // We include all but identify those above threshold
    $row['distance'] = $distance;
    $row['is_anomaly'] = ($distance !== null && $distance > $threshold);
    $data[] = $row;
}

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
        $this->Cell(150, 5, 'Laporan Audit Koordinasi GPS (Anti-Nembak Stan)', 0, 1, 'L');
        $this->Cell(30);
        $this->Cell(150, 5, 'Verifikasi ketepatan lokasi pengambilan foto meter di lapangan', 0, 0, 'L');

        $this->SetXY(210, 15);
        $this->SetFont('Arial', '', 7);
        $this->SetTextColor(150);
        $this->Cell(72, 5, 'KODE DOKUMEN', 0, 1, 'R');
        $this->SetX(210);
        $this->SetFont('Arial', 'B', 10);
        $this->Cell(72, 5, 'RPT-ADM-GPS-001', 0, 1, 'R');

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
$pdf->Cell(0, 10, 'LAPORAN AUDIT LOKASI GPS (JARAK BACA METER)', 0, 1, 'C');
$pdf->SetFont('Arial', 'B', 11);
$pdf->Cell(0, 7, 'Periode: ' . strtoupper($periodDisplay) . ' | Cabang: ' . ($branch_code === 'Semua' ? 'SEMUA CABANG' : $branch_code), 0, 1, 'C');
$pdf->Ln(5);

// Table Header
$pdf->SetFillColor(0, 0, 0); // Black for a serious audit report
$pdf->SetTextColor(255);
$pdf->SetDrawColor(50);
$pdf->SetFont('Arial', 'B', 8);

$w = array(10, 25, 45, 60, 45, 45, 38);
$header = array('NO', 'ID SAMB', 'NAMA PELANGGAN', 'ALAMAT', 'KOORD. MASTER', 'KOORD. BACA', 'JARAK (METER)');

foreach ($header as $i => $h) {
    $pdf->Cell($w[$i], 10, $h, 1, 0, 'C', true);
}
$pdf->Ln();

// Table Body
$pdf->SetTextColor(51);
$pdf->SetFont('Arial', '', 8);

if (empty($data)) {
    $pdf->Cell(array_sum($w), 10, 'Tidak ada data pencatatan pada periode ini.', 1, 1, 'C');
} else {
    $index = 1;
    foreach ($data as $row) {
        // Handle anomaly styling
        if ($row['is_anomaly']) {
            $pdf->SetFillColor(254, 226, 226); // Light Red
            $pdf->SetTextColor(153, 27, 27); // Dark Red
            $fill = true;
        } else {
            $pdf->SetFillColor(255);
            $pdf->SetTextColor(51);
            $fill = false;
        }

        $pdf->Cell($w[0], 10, $index++, 1, 0, 'C', $fill);
        $pdf->Cell($w[1], 10, $row['id_sambungan'], 1, 0, 'C', $fill);
        $pdf->Cell($w[2], 10, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', substr($row['nama'], 0, 25)), 1, 0, 'L', $fill);

        $pdf->Cell($w[3], 10, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', substr($row['alamat'], 0, 35)), 1, 0, 'L', $fill);

        $pdf->Cell($w[4], 10, $row['base_lat'] ? $row['base_lat'] . ',' . $row['base_lng'] : '-', 1, 0, 'C', $fill);
        $pdf->Cell($w[5], 10, $row['rec_lat'] ? $row['rec_lat'] . ',' . $row['rec_lng'] : '-', 1, 0, 'C', $fill);

        $distText = ($row['distance'] !== null) ? round($row['distance'], 2) . ' m' : 'N/A';
        if ($row['is_anomaly'])
            $distText .= ' [!]';

        $pdf->Cell($w[6], 10, $distText, 1, 1, 'C', $fill);
    }
}

$pdf->Ln(5);
$pdf->SetTextColor(100);
$pdf->SetFont('Arial', 'I', 8);
$pdf->Cell(0, 5, '* Catatan: Jarak dihitung menggunakan formula Haversine. Anomali (merah) adalah pembacaan > ' . $threshold . ' meter dari lokasi master.', 0, 1, 'L');

$pdf->Output('I', 'Laporan_Audit_GPS_' . $periodDisplay . '.pdf');
?>