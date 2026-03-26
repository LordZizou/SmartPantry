<?php
// Endpoint per aggiungere un prodotto alla dispensa
session_start();
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

// Verifica autenticazione
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Accesso non autorizzato']);
    exit;
}

// Accetta solo richieste POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Metodo non consentito']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

// Validazione nome prodotto (unico campo obbligatorio)
$name = trim($data['name'] ?? '');
if (empty($name)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Il nome del prodotto è obbligatorio']);
    exit;
}

// Prepara i dati per l'inserimento
$userId         = $_SESSION['user_id'];
$categoryId     = $data['category_id'] ?? null;
$brand          = trim($data['brand'] ?? '');
$barcode        = trim($data['barcode'] ?? '');
$quantity       = $data['quantity'] ?? 1;
$unit           = trim($data['unit'] ?? 'pz');
$expiryDate     = $data['expiry_date'] ?? null;
$nutritionalInfo = isset($data['nutritional_info']) ? json_encode($data['nutritional_info']) : null;

$stmt = $pdo->prepare(
    'INSERT INTO products (user_id, category_id, name, brand, barcode, quantity, unit, expiry_date, nutritional_info)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
);

$stmt->execute([
    $userId,
    $categoryId ?: null,
    $name,
    $brand ?: null,
    $barcode ?: null,
    $quantity,
    $unit,
    $expiryDate ?: null,
    $nutritionalInfo,
]);

echo json_encode([
    'success' => true,
    'message' => 'Prodotto aggiunto alla dispensa',
    'product_id' => $pdo->lastInsertId()
]);
