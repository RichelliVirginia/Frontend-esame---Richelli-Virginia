<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_academy();

$method = $_SERVER['REQUEST_METHOD'];

/* Legge i corsi */
if ($method === 'GET') {
    $conditions = [];
    $params = [];
    if (isset($_GET['id'])) {
        $conditions[] = 'id = :id';
        $params['id'] = positive_int($_GET['id']);
    }

    if (trim((string) ($_GET['category'] ?? '')) !== '') {
        $conditions[] = 'category = :category';
        $params['category'] = trim((string) $_GET['category']);
    }
    if (isset($_GET['active']) && $_GET['active'] !== '') {
        $conditions[] = 'is_active = :active';
        $params['active'] = bool_value($_GET['active']);
    }

    $sql = 'SELECT * FROM courses';
    if ($conditions !== []) $sql .= ' WHERE ' . implode(' AND ', $conditions);
    $sql .= ' ORDER BY is_active DESC, category, title';

    $query = $pdo->prepare($sql);
    $query->execute($params);
    $courses = array_map('course_to_json', $query->fetchAll());

    if (isset($_GET['id']) && $courses === []) {
        json_response(['success' => false, 'message' => 'Corso non trovato.'], 404);
    }

    json_response(['success' => true, 'courses' => $courses]);
}

/* Creazione di un nuovo corso */
if ($method === 'POST') {
    $data = get_json_body();
    $course = validate_course($data);
    $query = $pdo->prepare(
        'INSERT INTO courses (title, description, category, duration_hours, is_mandatory, is_active)
         VALUES (:title, :description, :category, :duration, :mandatory, :active)'
    );
    $query->execute($course);
    json_response(['success' => true, 'message' => 'Corso creato.', 'id' => (int) $pdo->lastInsertId()], 201);
}

/*Modifica o disattiva un corso */
if ($method === 'PUT') {
    $data = get_json_body();
    $id = positive_int($data['id'] ?? 0);
    if ($id === 0) json_response(['success' => false, 'message' => 'Corso non valido.'], 422);

    if (($data['action'] ?? '') === 'deactivate') {
        $query = $pdo->prepare('UPDATE courses SET is_active = 0 WHERE id = :id');
        $query->execute(['id' => $id]);
        if ($query->rowCount() === 0) ensure_course_exists($pdo, $id);
        json_response(['success' => true, 'message' => 'Corso disattivato.']);
    }

    $course = validate_course($data);
    $course['id'] = $id;
    $query = $pdo->prepare(
        'UPDATE courses SET title = :title, description = :description, category = :category,
         duration_hours = :duration, is_mandatory = :mandatory, is_active = :active WHERE id = :id'
    );
    $query->execute($course);
    ensure_course_exists($pdo, $id);
    json_response(['success' => true, 'message' => 'Corso aggiornato.']);
}

/* Elimina di un corso */
if ($method === 'DELETE') {
    $data = get_json_body();
    $id = positive_int($data['id'] ?? $_GET['id'] ?? 0);
    if ($id === 0) json_response(['success' => false, 'message' => 'Corso non valido.'], 422);
    ensure_course_exists($pdo, $id);

    $linked = $pdo->prepare('SELECT COUNT(*) FROM course_assignments WHERE course_id = :id');
    $linked->execute(['id' => $id]);
    if ((int) $linked->fetchColumn() > 0) {
        json_response([
            'success' => false,
            'message' => 'Il corso ha assegnazioni collegate: puoi disattivarlo, ma non eliminarlo.',
        ], 409);
    }

    $delete = $pdo->prepare('DELETE FROM courses WHERE id = :id');
    $delete->execute(['id' => $id]);
    json_response(['success' => true, 'message' => 'Corso eliminato.']);
}

json_response(['success' => false, 'message' => 'Metodo HTTP non consentito.'], 405);

function validate_course(array $data): array
{
    $title = trim((string) ($data['title'] ?? ''));
    $category = trim((string) ($data['category'] ?? ''));
    $duration = filter_var($data['durationHours'] ?? null, FILTER_VALIDATE_FLOAT);
    $errors = [];
    if ($title === '') $errors[] = 'Il titolo è obbligatorio.';
    if ($category === '') $errors[] = 'La categoria è obbligatoria.';
    if ($duration === false || $duration <= 0) $errors[] = 'La durata deve essere maggiore di zero.';
    if ($errors !== []) json_response(['success' => false, 'message' => implode(' ', $errors)], 422);

    return [
        'title' => $title,
        'description' => trim((string) ($data['description'] ?? '')),
        'category' => $category,
        'duration' => $duration,
        'mandatory' => bool_value($data['isMandatory'] ?? false),
        'active' => bool_value($data['isActive'] ?? true),
    ];
}

function ensure_course_exists(PDO $pdo, int $id): void
{
    $query = $pdo->prepare('SELECT id FROM courses WHERE id = :id');
    $query->execute(['id' => $id]);
    if (!$query->fetch()) json_response(['success' => false, 'message' => 'Corso non trovato.'], 404);
}

function course_to_json(array $course): array
{
    return [
        'id' => (int) $course['id'],
        'title' => $course['title'],
        'description' => $course['description'],
        'category' => $course['category'],
        'durationHours' => (float) $course['duration_hours'],
        'isMandatory' => (bool) $course['is_mandatory'],
        'isActive' => (bool) $course['is_active'],
    ];
}
