<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_auth();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $conditions = [];
    $params = [];


/* Filtra le assegnazioni, ruoli */
    if (($_SESSION['role'] ?? '') !== 'academy') {
        $conditions[] = 'a.employee_id = :current_employee';
        $params['current_employee'] = (int) $_SESSION['user_id'];
    } elseif (positive_int($_GET['employeeId'] ?? 0) > 0) {
        $conditions[] = 'a.employee_id = :employee_id';
        $params['employee_id'] = positive_int($_GET['employeeId']);
    }

    if (positive_int($_GET['id'] ?? 0) > 0) {
        $conditions[] = 'a.id = :id';
        $params['id'] = positive_int($_GET['id']);
    }
    if (positive_int($_GET['courseId'] ?? 0) > 0) {
        $conditions[] = 'a.course_id = :course_id';
        $params['course_id'] = positive_int($_GET['courseId']);
    }
    if (trim((string) ($_GET['category'] ?? '')) !== '') {
        $conditions[] = 'c.category = :category';
        $params['category'] = trim((string) $_GET['category']);
    }
    if (trim((string) ($_GET['status'] ?? '')) !== '') {
        $status = trim((string) $_GET['status']);
        if (!in_array($status, ['assigned', 'completed', 'expired', 'cancelled'], true)) {
            json_response(['success' => false, 'message' => 'Filtro stato non valido.'], 422);
        }
        if ($status === 'expired') {
            $conditions[] = 'a.status = "assigned" AND a.due_on < CURDATE()';
        } elseif ($status === 'assigned') {
            $conditions[] = 'a.status = "assigned" AND a.due_on >= CURDATE()';
        } else {
            $conditions[] = 'a.status = :status';
            $params['status'] = $status;
        }
    }
    if (trim((string) ($_GET['dueFrom'] ?? '')) !== '') {
        $conditions[] = 'a.due_on >= :due_from';
        $params['due_from'] = (string) $_GET['dueFrom'];
    }
    if (trim((string) ($_GET['dueTo'] ?? '')) !== '') {
        $conditions[] = 'a.due_on <= :due_to';
        $params['due_to'] = (string) $_GET['dueTo'];
    }

    $sql = 'SELECT a.*, c.title, c.description, c.category, c.duration_hours,
                   c.is_mandatory, c.is_active, u.first_name, u.last_name, u.email
            FROM course_assignments a
            INNER JOIN courses c ON c.id = a.course_id
            INNER JOIN users u ON u.id = a.employee_id';
    if ($conditions !== []) $sql .= ' WHERE ' . implode(' AND ', array_map(fn ($c) => "($c)", $conditions));
    $sql .= ' ORDER BY a.due_on ASC, c.title ASC';

    $query = $pdo->prepare($sql);
    $query->execute($params);
    $assignments = array_map('assignment_to_json', $query->fetchAll());

    if (positive_int($_GET['id'] ?? 0) > 0 && $assignments === []) {
        json_response(['success' => false, 'message' => 'Assegnazione non trovata.'], 404);
    }
    json_response(['success' => true, 'assignments' => $assignments]);
}
    /*Solo un academy può assegnare corsi */
if ($method === 'POST') {
    require_academy();
    $data = get_json_body();
    $values = validate_assignment($pdo, $data);
    $query = $pdo->prepare(
        'INSERT INTO course_assignments (course_id, employee_id, assigned_on, due_on, status, completed_on)
         VALUES (:course_id, :employee_id, :assigned_on, :due_on, :status, :completed_on)'
    );
    try {
        $query->execute($values);
    } catch (PDOException $exception) {
        if ($exception->getCode() === '23000') {
            json_response(['success' => false, 'message' => 'Questa assegnazione esiste già.'], 409);
        }
        throw $exception;
    }
    json_response(['success' => true, 'message' => 'Corso assegnato.', 'id' => (int) $pdo->lastInsertId()], 201);
}

if ($method === 'PUT') {
    $data = get_json_body();
    $id = positive_int($data['id'] ?? 0);
    if ($id === 0) json_response(['success' => false, 'message' => 'Assegnazione non valida.'], 422);

    $existing = get_assignment($pdo, $id);
    $action = (string) ($data['action'] ?? 'update');

    /* Controlla che il dipendente sia il proprietario dell'assegnazione */
    if ($action === 'complete') {
        if (($_SESSION['role'] ?? '') !== 'academy' && (int) $existing['employee_id'] !== (int) $_SESSION['user_id']) {
            json_response(['success' => false, 'message' => 'Non puoi completare corsi assegnati ad altri.'], 403);
        }
        if ($existing['status'] !== 'assigned') {
            json_response(['success' => false, 'message' => 'Questa assegnazione non può essere completata.'], 409);
        }
        $completedOn = trim((string) ($data['completedOn'] ?? date('Y-m-d')));
        if (!valid_date($completedOn) || $completedOn < $existing['assigned_on']) {
            json_response(['success' => false, 'message' => 'La data di completamento non è valida.'], 422);
        }
        $query = $pdo->prepare(
            'UPDATE course_assignments SET status = "completed", completed_on = :date WHERE id = :id'
        );
        $query->execute(['date' => $completedOn, 'id' => $id]);
        json_response(['success' => true, 'message' => 'Corso segnato come completato.']);
    }

    require_academy();
    if ($action === 'cancel') {
        if ($existing['status'] === 'completed') {
            json_response(['success' => false, 'message' => 'Un corso completato non può essere annullato.'], 409);
        }
        $query = $pdo->prepare(
            'UPDATE course_assignments SET status = "cancelled", completed_on = NULL WHERE id = :id'
        );
        $query->execute(['id' => $id]);
        json_response(['success' => true, 'message' => 'Assegnazione annullata.']);
    }

    $values = validate_assignment($pdo, $data, true);
    $values['id'] = $id;
    $query = $pdo->prepare(
        'UPDATE course_assignments SET course_id = :course_id, employee_id = :employee_id,
         assigned_on = :assigned_on, due_on = :due_on, status = :status,
         completed_on = :completed_on WHERE id = :id'
    );
    $query->execute($values);
    json_response(['success' => true, 'message' => 'Assegnazione aggiornata.']);
}

if ($method === 'DELETE') {
    require_academy();
    $data = get_json_body();
    $id = positive_int($data['id'] ?? $_GET['id'] ?? 0);
    $existing = get_assignment($pdo, $id);
    if ($existing['status'] === 'completed') {
        json_response(['success' => false, 'message' => 'Un corso completato non può essere annullato.'], 409);
    }
    $query = $pdo->prepare('UPDATE course_assignments SET status = "cancelled" WHERE id = :id');
    $query->execute(['id' => $id]);
    json_response(['success' => true, 'message' => 'Assegnazione annullata.']);
}

json_response(['success' => false, 'message' => 'Metodo HTTP non consentito.'], 405);

function get_assignment(PDO $pdo, int $id): array
{
    $query = $pdo->prepare('SELECT * FROM course_assignments WHERE id = :id');
    $query->execute(['id' => $id]);
    $assignment = $query->fetch();
    if (!$assignment) json_response(['success' => false, 'message' => 'Assegnazione non trovata.'], 404);
    return $assignment;
}

function validate_assignment(PDO $pdo, array $data, bool $allowInactiveCourse = false): array
{
    $courseId = positive_int($data['courseId'] ?? 0);
    $employeeId = positive_int($data['employeeId'] ?? 0);
    $assignedOn = trim((string) ($data['assignedOn'] ?? ''));
    $dueOn = trim((string) ($data['dueOn'] ?? ''));
    $status = trim((string) ($data['status'] ?? 'assigned'));
    $completedOn = trim((string) ($data['completedOn'] ?? '')) ?: null;
    $errors = [];
    if ($courseId === 0) $errors[] = 'Seleziona un corso.';
    if ($employeeId === 0) $errors[] = 'Seleziona un dipendente.';
    if (!valid_date($assignedOn)) $errors[] = 'La data di assegnazione non è valida.';
    if (!valid_date($dueOn)) $errors[] = 'La scadenza non è valida.';
    if (valid_date($assignedOn) && valid_date($dueOn) && $dueOn < $assignedOn) {
        $errors[] = 'La scadenza non può precedere la data di assegnazione.';
    }
    if (!in_array($status, ['assigned', 'completed', 'cancelled'], true)) $errors[] = 'Stato non valido.';
    if ($status === 'completed' && $completedOn === null) $errors[] = 'Inserisci la data di completamento.';
    if ($completedOn !== null && (!valid_date($completedOn) || $completedOn < $assignedOn)) {
        $errors[] = 'La data di completamento non è valida.';
    }
    if ($status !== 'completed') $completedOn = null;
    if ($errors !== []) json_response(['success' => false, 'message' => implode(' ', $errors)], 422);

    $course = $pdo->prepare('SELECT is_active FROM courses WHERE id = :id');
    $course->execute(['id' => $courseId]);
    $courseData = $course->fetch();
    if (!$courseData) json_response(['success' => false, 'message' => 'Corso non trovato.'], 422);
    if (!$allowInactiveCourse && !(bool) $courseData['is_active']) {
        json_response(['success' => false, 'message' => 'Un corso non attivo non può essere assegnato.'], 409);
    }

    $employee = $pdo->prepare('SELECT id FROM users WHERE id = :id AND role = "employee"');
    $employee->execute(['id' => $employeeId]);
    if (!$employee->fetch()) json_response(['success' => false, 'message' => 'Dipendente non trovato.'], 422);

    return [
        'course_id' => $courseId,
        'employee_id' => $employeeId,
        'assigned_on' => $assignedOn,
        'due_on' => $dueOn,
        'status' => $status,
        'completed_on' => $completedOn,
    ];
}

function assignment_to_json(array $row): array
{
    $displayStatus = $row['status'];
    if ($displayStatus === 'assigned' && $row['due_on'] < date('Y-m-d')) $displayStatus = 'expired';
    return [
        'id' => (int) $row['id'],
        'courseId' => (int) $row['course_id'],
        'employeeId' => (int) $row['employee_id'],
        'employeeName' => $row['first_name'] . ' ' . $row['last_name'],
        'employeeEmail' => $row['email'],
        'title' => $row['title'],
        'description' => $row['description'],
        'category' => $row['category'],
        'durationHours' => (float) $row['duration_hours'],
        'isMandatory' => (bool) $row['is_mandatory'],
        'courseActive' => (bool) $row['is_active'],
        'assignedOn' => $row['assigned_on'],
        'dueOn' => $row['due_on'],
        'status' => $displayStatus,
        'completedOn' => $row['completed_on'],
    ];
}
