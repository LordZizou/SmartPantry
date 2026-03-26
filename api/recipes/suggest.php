<?php
// Endpoint per suggerire ricette basate sugli ingredienti in dispensa
// NOTA: Spoonacular ha un limite di 50 chiamate giornaliere — usare con parsimonia
session_start();
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/config.php';

// Verifica autenticazione
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Accesso non autorizzato']);
    exit;
}

$userId = $_SESSION['user_id'];

// Parametro opzionale: mostra solo ricette fattibili con ingredienti in dispensa
$pantryOnly = isset($_GET['pantry_only']) && $_GET['pantry_only'] === 'true';

// Recupera gli ingredienti dalla dispensa dell'utente
$stmt = $pdo->prepare('SELECT DISTINCT name FROM products WHERE user_id = ?');
$stmt->execute([$userId]);
$ingredients = $stmt->fetchAll(PDO::FETCH_COLUMN);

if (empty($ingredients)) {
    echo json_encode([
        'success' => true,
        'recipes' => [],
        'message' => 'Nessun ingrediente in dispensa'
    ]);
    exit;
}

// Prepara la lista ingredienti separati da virgola per Spoonacular
$ingredientsList = implode(',', $ingredients);

// Chiama l'API Spoonacular per trovare ricette
$url = "https://api.spoonacular.com/recipes/findByIngredients?"
     . "ingredients=" . urlencode($ingredientsList)
     . "&number=10"
     . "&ranking=2"  // Minimizza ingredienti mancanti
     . "&apiKey=" . SPOONACULAR_API_KEY;

$response = file_get_contents($url);

if ($response === false) {
    http_response_code(502);
    echo json_encode(['success' => false, 'error' => 'Errore nella comunicazione con Spoonacular']);
    exit;
}

$recipesData = json_decode($response, true);

if (!is_array($recipesData)) {
    http_response_code(502);
    echo json_encode(['success' => false, 'error' => 'Risposta non valida da Spoonacular']);
    exit;
}

// Elabora le ricette e calcola compatibilità
$recipes = [];

foreach ($recipesData as $recipe) {
    // Ingredienti disponibili in dispensa
    $usedIngredients = [];
    foreach ($recipe['usedIngredients'] ?? [] as $ing) {
        $usedIngredients[] = $ing['name'];
    }

    // Ingredienti mancanti
    $missedIngredients = [];
    foreach ($recipe['missedIngredients'] ?? [] as $ing) {
        $missedIngredients[] = $ing['name'];
    }

    $missedCount = count($missedIngredients);

    // Se richiesto solo ricette con ingredienti in dispensa, salta quelle con mancanti
    if ($pantryOnly && $missedCount > 0) {
        continue;
    }

    $recipes[] = [
        'spoonacular_id'     => $recipe['id'],
        'title'              => $recipe['title'],
        'image_url'          => $recipe['image'] ?? '',
        'used_ingredients'   => $usedIngredients,
        'missed_ingredients' => $missedIngredients,
        'missed_count'       => $missedCount,
    ];

    // Salva in cache la ricetta nel database (ignora se già presente)
    $cacheStmt = $pdo->prepare(
        'INSERT IGNORE INTO recipes_cache (spoonacular_id, title, ingredients, image_url)
         VALUES (?, ?, ?, ?)'
    );
    $cacheStmt->execute([
        $recipe['id'],
        $recipe['title'],
        json_encode(array_merge($usedIngredients, $missedIngredients)),
        $recipe['image'] ?? '',
    ]);
}

// Ordina per numero ingredienti mancanti (crescente = più compatibili prima)
usort($recipes, function ($a, $b) {
    return $a['missed_count'] - $b['missed_count'];
});

echo json_encode([
    'success'            => true,
    'recipes'            => $recipes,
    'pantry_ingredients' => $ingredients,
    'pantry_only'        => $pantryOnly,
]);
