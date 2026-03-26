<?php
// Endpoint registrazione utente
session_start();
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

// Accetta solo richieste POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Metodo non consentito']);
    exit;
}

// Legge i dati dalla richiesta
$data = json_decode(file_get_contents('php://input'), true);

$username = trim($data['username'] ?? '');
$email    = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

// Validazione campi obbligatori
if (empty($username) || empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Tutti i campi sono obbligatori']);
    exit;
}

// Validazione formato email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Email non valida']);
    exit;
}

// Validazione lunghezza password (minimo 6 caratteri)
if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'La password deve avere almeno 6 caratteri']);
    exit;
}

// Controlla se username o email esistono già
$stmt = $pdo->prepare('SELECT id FROM users WHERE username = ? OR email = ?');
$stmt->execute([$username, $email]);

if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['success' => false, 'error' => 'Username o email già registrati']);
    exit;
}

// Crea hash della password e inserisce l'utente
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)');
$stmt->execute([$username, $email, $passwordHash]);

// Avvia la sessione per l'utente appena registrato
$_SESSION['user_id']  = $pdo->lastInsertId();
$_SESSION['username'] = $username;

echo json_encode([
    'success' => true,
    'message' => 'Registrazione completata',
    'user'    => [
        'id'       => $_SESSION['user_id'],
        'username' => $username,
        'email'    => $email,
    ]
]);
