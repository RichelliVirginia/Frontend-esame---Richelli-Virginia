<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_method('GET');
require_academy();

$conditions = ['a.status <> "cancelled"'];
$params = [];
$month = trim((string) ($_GET['month'] ?? ''));
$category = trim((string) ($_GET['category'] ?? ''));
$employeeId = positive_int($_GET['employeeId'] ?? 0);

if ($month !== '') {
    if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
        json_response(['success' => false, 'message' => 'Il mese deve avere formato AAAA-MM.'], 422);
    }
    $conditions[] = 'DATE_FORMAT(a.assigned_on, "%Y-%m") = :month';
    $params['month'] = $month;
}
if ($category !== '') {
    $conditions[] = 'c.category = :category';
    $params['category'] = $category;
}
if ($employeeId > 0) {
    $conditions[] = 'a.employee_id = :employee_id';
    $params['employee_id'] = $employeeId;
}

$sql = 'SELECT DATE_FORMAT(a.assigned_on, "%Y-%m") AS month, c.category,
               COUNT(*) AS assigned_count,
               SUM(CASE WHEN a.status = "completed" THEN 1 ELSE 0 END) AS completed_count
        FROM course_assignments a
        INNER JOIN courses c ON c.id = a.course_id
        WHERE ' . implode(' AND ', $conditions) . '
        GROUP BY DATE_FORMAT(a.assigned_on, "%Y-%m"), c.category
        ORDER BY month DESC, c.category';
$query = $pdo->prepare($sql);
$query->execute($params);

$statistics = array_map(static function (array $row): array {
    $assigned = (int) $row['assigned_count'];
    $completed = (int) $row['completed_count'];
    return [
        'month' => $row['month'],
        'category' => $row['category'],
        'assignedCount' => $assigned,
        'completedCount' => $completed,
        'completionPercentage' => $assigned > 0 ? round($completed / $assigned * 100, 2) : 0,
    ];
}, $query->fetchAll());

json_response(['success' => true, 'statistics' => $statistics]);
