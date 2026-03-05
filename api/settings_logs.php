<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $page     = max(1, (int)($_GET['page'] ?? 1));
        $per_page = 5;
        $offset   = ($page - 1) * $per_page;
        $search   = $_GET['search'] ?? '';
        $date_from = $_GET['date_from'] ?? '';
        $date_to   = $_GET['date_to'] ?? '';

        $where = ['1=1'];
        $params = [];

        if ($search) {
            $where[] = "(action LIKE ? OR detail LIKE ? OR username LIKE ?)";
            $like = "%$search%";
            $params = array_merge($params, [$like, $like, $like]);
        }
        if ($date_from) {
            $where[] = "DATE(created_at) >= ?";
            $params[] = $date_from;
        }
        if ($date_to) {
            $where[] = "DATE(created_at) <= ?";
            $params[] = $date_to;
        }

        $where_sql = implode(' AND ', $where);

        // Total count
        $count_stmt = $conn->prepare("SELECT COUNT(*) FROM activity_logs WHERE $where_sql");
        $count_stmt->execute($params);
        $total = (int)$count_stmt->fetchColumn();

        // Data
        $data_stmt = $conn->prepare("SELECT id, username, action, detail, ip_address, created_at FROM activity_logs WHERE $where_sql ORDER BY created_at DESC LIMIT $per_page OFFSET $offset");
        $data_stmt->execute($params);
        $logs = $data_stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'logs'       => $logs,
            'total'      => $total,
            'page'       => $page,
            'per_page'   => $per_page,
            'total_pages'=> ceil($total / $per_page)
        ]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
?>
