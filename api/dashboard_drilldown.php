<?php
header('Content-Type: application/json');
require_once 'config.php';

try {
    $bulan_berjalan = date('n');
    $tahun_berjalan = date('Y');
    $branch_code = $_GET['branch_code'] ?? null;

    if (!$branch_code) {
        // 1. Level Cabang (Default)
        // Menampilkan data progres tiap cabang
        $sql = "
            SELECT 
                c.kode_cabang, 
                c.cabang as nama,
                (SELECT COUNT(*) FROM data_pelanggan dp WHERE dp.kode_cabang = c.kode_cabang AND dp.deleted_at IS NULL) as total_pelanggan,
                (SELECT COUNT(*) FROM data_pencatatan p 
                 JOIN data_pelanggan dp ON p.id_pelanggan = dp.id
                 WHERE dp.kode_cabang = c.kode_cabang AND p.bulan = ? AND p.tahun = ?) as pelanggan_tercatat
            FROM cabang c
            ORDER BY c.kode_cabang ASC
        ";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$bulan_berjalan, $tahun_berjalan]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calculate percentage for each branch
        foreach ($results as &$row) {
            $row['total_pelanggan'] = (int)$row['total_pelanggan'];
            $row['pelanggan_tercatat'] = (int)$row['pelanggan_tercatat'];
            $row['percentage'] = $row['total_pelanggan'] > 0 
                ? round(($row['pelanggan_tercatat'] / $row['total_pelanggan']) * 100, 1) 
                : 0;
        }

        echo json_encode([
            'level' => 'branch',
            'data' => $results
        ]);
    } else {
        // 2. Level Petugas (Jika branch_code diberikan)
        // Menampilkan data progres tiap petugas di cabang tersebut
        
        // Ambil daftar petugas yang punya wilayah di cabang ini
        $sql_officers = "
            SELECT DISTINCT p.id, p.nama
            FROM data_petugas p
            JOIN data_wilayah_petugas wp ON p.id = wp.id_petugas
            WHERE wp.kode_cabang = ? AND p.deleted_at IS NULL
            ORDER BY p.nama ASC
        ";
        $stmt_off = $conn->prepare($sql_officers);
        $stmt_off->execute([$branch_code]);
        $officers = $stmt_off->fetchAll(PDO::FETCH_ASSOC);

        $results = [];
        foreach ($officers as $off) {
            // Hitung total pelanggan di rute-rute si petugas (hanya di cabang ini)
            $sql_total = "
                SELECT COUNT(*) 
                FROM data_pelanggan 
                WHERE kode_cabang = ? AND deleted_at IS NULL
                AND kode_rute IN (SELECT kode_rute FROM data_wilayah_petugas WHERE id_petugas = ? AND kode_cabang = ?)
            ";
            $stmt_total = $conn->prepare($sql_total);
            $stmt_total->execute([$branch_code, $off['id'], $branch_code]);
            $total_cust = $stmt_total->fetchColumn();

            // Hitung yang sudah tercatat bulan ini
            $sql_done = "
                SELECT COUNT(*) 
                FROM data_pencatatan p
                JOIN data_pelanggan dp ON p.id_pelanggan = dp.id
                WHERE dp.kode_cabang = ? AND p.bulan = ? AND p.tahun = ?
                AND dp.kode_rute IN (SELECT kode_rute FROM data_wilayah_petugas WHERE id_petugas = ? AND kode_cabang = ?)
            ";
            $stmt_done = $conn->prepare($sql_done);
            $stmt_done->execute([$branch_code, $bulan_berjalan, $tahun_berjalan, $off['id'], $branch_code]);
            $done_cust = $stmt_done->fetchColumn();

            $results[] = [
                'id' => $off['id'],
                'nama' => $off['nama'],
                'total_pelanggan' => (int)$total_cust,
                'pelanggan_tercatat' => (int)$done_cust,
                'percentage' => $total_cust > 0 ? round(($done_cust / $total_cust) * 100, 1) : 0
            ];
        }

        echo json_encode([
            'level' => 'officer',
            'branch_code' => $branch_code,
            'data' => $results
        ]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
?>
