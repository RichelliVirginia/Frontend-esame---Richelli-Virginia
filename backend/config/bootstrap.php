<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$allowedOrigins = [
    'http://localhost',
    'http://127.0.0.1',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}

header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

session_set_cookie_params([
    'httponly' => true,
    'secure' => false,
    'samesite' => 'Lax',
]);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/database.php';

function get_json_body(): array
{
    $rawBody = file_get_contents('php://input');

    if ($rawBody === false || trim($rawBody) === '') {
        return [];
    }

    $data = json_decode($rawBody, true);

    if (!is_array($data)) {
        json_response([
            'success' => false,
            'message' => 'JSON non valido.'
        ], 400);
    }

    return $data;
}

function require_method(string $method): void
{
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        json_response([
            'success' => false,
            'message' => 'Metodo HTTP non consentito.'
        ], 405);
    }
}

function require_auth(): void
{
    if (!isset($_SESSION['user_id'])) {
        json_response([
            'success' => false,
            'message' => 'Devi effettuare il login.'
        ], 401);
    }
}

function require_admin(): void
{
    require_auth();

    if (($_SESSION['role'] ?? '') !== 'admin') {
        json_response([
            'success' => false,
            'message' => 'Accesso riservato agli amministratori.'
        ], 403);
    }
}
