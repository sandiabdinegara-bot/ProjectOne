<?php
require_once 'config.php';

$type = $_GET['type'] ?? '';
$parentId = $_GET['parent_id'] ?? null;
$parentKode = $_GET['parent_kode'] ?? null;

try {
    // Helper to get ID from Kode
    if (!$parentId && $parentKode) {
        if ($type === 'desa') {
            $stmt = $conn->prepare("SELECT id FROM zone_kecamatan WHERE kode_kecamatan = ?");
            $stmt->execute([$parentKode]);
            $parentId = $stmt->fetchColumn();
        } else if ($type === 'rw') {
            // Need to know which kecamatan too? Usually kode_desa is unique only within kecamatan or globally?
            // For now assume global or at least unique enough for this app
            $stmt = $conn->prepare("SELECT id FROM zone_desa WHERE kode_desa = ?");
            $stmt->execute([$parentKode]);
            $parentId = $stmt->fetchColumn();
        } else if ($type === 'rt') {
            $stmt = $conn->prepare("SELECT id FROM zone_rw WHERE kode_rw = ?");
            $stmt->execute([$parentKode]);
            $parentId = $stmt->fetchColumn();
        }
    }

    switch ($type) {
        case 'kecamatan':
            $stmt = $conn->query("SELECT id, kode_kecamatan, kecamatan FROM zone_kecamatan ORDER BY kecamatan ASC");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'desa':
            $kecId = $_GET['kec_id'] ?? $parentId;
            if (!$kecId && isset($_GET['kec_kode'])) {
                $stmt = $conn->prepare("SELECT id FROM zone_kecamatan WHERE kode_kecamatan = ?");
                $stmt->execute([$_GET['kec_kode']]);
                $kecId = $stmt->fetchColumn();
            }
            if (!$kecId) {
                echo json_encode([]);
                break;
            }
            $stmt = $conn->prepare("SELECT id, kode_desa, desa FROM zone_desa WHERE id_kecamatan = ? ORDER BY desa ASC");
            $stmt->execute([$kecId]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'rw':
            $kecId = $_GET['kec_id'] ?? null;
            $desaId = $_GET['desa_id'] ?? null;

            // Resolve Kec ID from Kode
            if (!$kecId && isset($_GET['kec_kode'])) {
                $stmt = $conn->prepare("SELECT id FROM zone_kecamatan WHERE kode_kecamatan = ?");
                $stmt->execute([$_GET['kec_kode']]);
                $kecId = $stmt->fetchColumn();
            }

            // Resolve Desa ID from Kode (Requires Kec ID to be unique within Kecamatan)
            if (!$desaId && isset($_GET['desa_kode']) && $kecId) {
                $stmt = $conn->prepare("SELECT id FROM zone_desa WHERE id_kecamatan = ? AND kode_desa = ?");
                $stmt->execute([$kecId, $_GET['desa_kode']]);
                $desaId = $stmt->fetchColumn();
            }

            // If we only have desa_id, get kec_id from it
            if ($desaId && !$kecId) {
                $stmt = $conn->prepare("SELECT id_kecamatan FROM zone_desa WHERE id = ?");
                $stmt->execute([$desaId]);
                $kecId = $stmt->fetchColumn();
            }

            if (!$kecId || !$desaId) {
                echo json_encode([]);
                break;
            }

            $stmt = $conn->prepare("SELECT id, kode_rw, rw FROM zone_rw WHERE id_kecamatan = ? AND id_desa = ? ORDER BY kode_rw ASC");
            $stmt->execute([$kecId, $desaId]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'rt':
            $kecId = $_GET['kec_id'] ?? null;
            $desaId = $_GET['desa_id'] ?? null;
            $rwId = $_GET['rw_id'] ?? null;

            // Resolve hierarchy from kodes if provided
            if (!$kecId && isset($_GET['kec_kode'])) {
                $stmt = $conn->prepare("SELECT id FROM zone_kecamatan WHERE kode_kecamatan = ?");
                $stmt->execute([$_GET['kec_kode']]);
                $kecId = $stmt->fetchColumn();
            }
            if ($kecId && !$desaId && isset($_GET['desa_kode'])) {
                $stmt = $conn->prepare("SELECT id FROM zone_desa WHERE id_kecamatan = ? AND kode_desa = ?");
                $stmt->execute([$kecId, $_GET['desa_kode']]);
                $desaId = $stmt->fetchColumn();
            }
            if ($kecId && $desaId && !$rwId && isset($_GET['rw_kode'])) {
                $stmt = $conn->prepare("SELECT id FROM zone_rw WHERE id_kecamatan = ? AND id_desa = ? AND kode_rw = ?");
                $stmt->execute([$kecId, $desaId, $_GET['rw_kode']]);
                $rwId = $stmt->fetchColumn();
            }

            // If we only have rwId, fetch others for the query
            if ($rwId && (!$kecId || !$desaId)) {
                $stmt = $conn->prepare("SELECT id_kecamatan, id_desa FROM zone_rw WHERE id = ?");
                $stmt->execute([$rwId]);
                $rw = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($rw) {
                    $kecId = $rw['id_kecamatan'];
                    $desaId = $rw['id_desa'];
                }
            }

            if (!$kecId || !$desaId || !$rwId) {
                echo json_encode([]);
                break;
            }

            $stmt = $conn->prepare("SELECT id, kode_rt, rt FROM zone_rt WHERE id_kecamatan = ? AND id_desa = ? AND id_rw = ? ORDER BY kode_rt ASC");
            $stmt->execute([$kecId, $desaId, $rwId]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        default:
            echo json_encode(["error" => "Invalid type"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>