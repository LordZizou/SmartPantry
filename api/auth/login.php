<?php
// Endpoint login utente
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

$email    = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

// Validazione campi obbligatori
if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Email e password sono obbligatori']);
    exit;
}

// Cerca l'utente nel database
$stmt = $pdo->prepare('SELECT id, username, email, password_hash FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

// Verifica credenziali
if (!$user || !password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Credenziali non valide']);
    exit;
}

// Avvia la sessione
$_SESSION['user_id']  = $user['id'];
$_SESSION['username'] = $user['username'];

echo json_encode([
    'success' => true,
    'message' => 'Login effettuato',
    'user'    => [
        'id'       => $user['id'],
        'username' => $user['username'],
        'email'    => $user['email'],
    ]
]);
