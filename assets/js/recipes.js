// Gestione ricerca e visualizzazione ricette via AJAX

// Riferimenti DOM
const recipeList = document.getElementById('recipe-list');
const recipeLoader = document.getElementById('recipe-loader');
const togglePantryOnly = document.getElementById('toggle-pantry-only');
const btnSearchRecipes = document.getElementById('btn-search-recipes');
const btnLogout = document.getElementById('btn-logout');

/**
 * Cerca ricette basate sugli ingredienti in dispensa
 */
async function searchRecipes() {
    // Mostra il loader e nasconde la lista
    recipeLoader.style.display = 'block';
    recipeList.innerHTML = '';

    // Il toggle NON selezionato = solo dispensa (pantry_only=true)
    // Il toggle selezionato = anche altri ingredienti (pantry_only=false)
    const pantryOnly = !togglePantryOnly.checked;

    try {
        const response = await fetch('../api/recipes/suggest.php?pantry_only=' + pantryOnly);
        const data = await response.json();

        recipeLoader.style.display = 'none';

        if (!data.success) {
            if (response.status === 401) {
                window.location.href = '../index.html';
                return;
            }
            recipeList.innerHTML = '<div class="empty-state"><p>' + (data.error || 'Errore nella ricerca') + '</p></div>';
            return;
        }

        renderRecipes(data.recipes);
    } catch (error) {
        recipeLoader.style.display = 'none';
        recipeList.innerHTML = '<div class="empty-state"><p>Errore di connessione al server</p></div>';
    }
}

/**
 * Renderizza la lista delle ricette nel DOM
 */
function renderRecipes(recipes) {
    if (!recipes || recipes.length === 0) {
        recipeList.innerHTML = '<div class="empty-state"><p>Nessuna ricetta trovata con gli ingredienti disponibili</p></div>';
        return;
    }

    recipeList.innerHTML = recipes.map(recipe => {
        // Lista ingredienti disponibili (in verde)
        const usedHtml = recipe.used_ingredients.map(ing =>
            `<li class="available">${escapeHtml(ing)}</li>`
        ).join('');

        // Lista ingredienti mancanti (in rosso)
        const missedHtml = recipe.missed_ingredients.map(ing =>
            `<li class="missing">${escapeHtml(ing)}</li>`
        ).join('');

        // Link alla ricetta su Spoonacular
        const recipeUrl = 'https://spoonacular.com/recipes/' + recipe.spoonacular_id;

        return `
            <div class="recipe-card">
                ${recipe.image_url ? `<img src="${escapeHtml(recipe.image_url)}" alt="${escapeHtml(recipe.title)}">` : ''}
                <div class="recipe-body">
                    <h3>${escapeHtml(recipe.title)}</h3>
                    <p style="margin-bottom: 8px;">
                        <strong>Ingredienti disponibili:</strong> ${recipe.used_ingredients.length} |
                        <strong>Mancanti:</strong> ${recipe.missed_count}
                    </p>
                    <ul class="ingredient-list">
                        ${usedHtml}
                        ${missedHtml}
                    </ul>
                    <a href="${recipeUrl}" target="_blank" class="btn btn-small btn-primary" style="margin-top: 12px; display: inline-block;">
                        Vedi ricetta completa
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Escape HTML per prevenire XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// === Event listeners ===

// Pulsante cerca ricette
btnSearchRecipes.addEventListener('click', searchRecipes);

// Logout
btnLogout.addEventListener('click', async function (e) {
    e.preventDefault();
    try {
        await fetch('../api/auth/logout.php');
    } catch (error) {
        // Ignora errori di rete durante il logout
    }
    window.location.href = '../index.html';
});
