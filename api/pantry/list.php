<?php
// Endpoint per elencare i prodotti in dispensa dell'utente
session_start();
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

// Verifica autenticazione
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Accesso non autorizzato']);
    exit;
}

$userId = $_SESSION['user_id'];

// Filtro opzionale per categoria
$categoryId = $_GET['category_id'] ?? null;

// Costruisce la query con eventuale filtro categoria
$sql = 'SELECT p.*, c.name AS category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.user_id = ?';
$params = [$userId];

if ($categoryId) {
    $sql .= ' AND p.category_id = ?';
    $params[] = $categoryId;
}

$sql .= ' ORDER BY p.expiry_date ASC';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$products = $stmt->fetchAll();

// Calcola la data limite per avviso scadenza (3 giorni da oggi)
$today       = new DateTime();
$warningDate = (new DateTime())->modify('+3 days');

// Aggiunge informazioni sullo stato di scadenza a ogni prodotto
foreach ($products as &$product) {
    if ($product['expiry_date']) {
        $expiry = new DateTime($product['expiry_date']);
        if ($expiry < $today) {
            $product['expiry_status'] = 'expired';       // Scaduto
        } elseif ($expiry <= $warningDate) {
            $product['expiry_status'] = 'expiring_soon';  // In scadenza entro 3 giorni
        } else {
            $product['expiry_status'] = 'ok';             // Ancora valido
        }
    } else {
        $product['expiry_status'] = 'no_date';            // Nessuna data di scadenza
    }
}

// Recupera anche le categorie disponibili per il filtro
$categories = $pdo->query('SELECT * FROM categories ORDER BY name')->fetchAll();

echo json_encode([
    'success'    => true,
    'products'   => $products,
    'categories' => $categories
]);
