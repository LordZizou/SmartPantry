// Gestione CRUD dispensa via AJAX

// Percorso base delle API
// Percorso relativo dalla cartella pages/ alla cartella api/
const API_BASE = '../api';

// Riferimenti DOM
const productList = document.getElementById('product-list');
const emptyState = document.getElementById('empty-state');
const filterCategory = document.getElementById('filter-category');
const modalProduct = document.getElementById('modal-product');
const modalTitle = document.getElementById('modal-title');
const formProduct = document.getElementById('form-product');
const btnAddProduct = document.getElementById('btn-add-product');
const btnAddFirst = document.getElementById('btn-add-first');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const btnLogout = document.getElementById('btn-logout');

/**
 * Carica la lista dei prodotti dalla dispensa
 */
async function loadProducts() {
    const categoryId = filterCategory.value;
    let url = API_BASE + '/pantry/list.php';
    if (categoryId) {
        url += '?category_id=' + categoryId;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.success) {
            // Se non autenticato, reindirizza al login
            if (response.status === 401) {
                window.location.href = '../index.html';
                return;
            }
            productList.innerHTML = '<p class="loader">Errore nel caricamento</p>';
            return;
        }

        // Popola il filtro categorie (solo la prima volta)
        if (filterCategory.options.length <= 1 && data.categories) {
            data.categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                filterCategory.appendChild(option);
            });

            // Popola anche il select nel modale
            populateCategorySelect(data.categories);
        }

        // Renderizza i prodotti
        renderProducts(data.products);
    } catch (error) {
        productList.innerHTML = '<p class="loader">Errore di connessione</p>';
    }
}

/**
 * Popola il select delle categorie nel modale prodotto
 */
function populateCategorySelect(categories) {
    const select = document.getElementById('product-category');
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        select.appendChild(option);
    });
}

/**
 * Renderizza la lista prodotti nel DOM
 */
function renderProducts(products) {
    if (!products || products.length === 0) {
        productList.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    productList.style.display = 'grid';
    emptyState.style.display = 'none';

    productList.innerHTML = products.map(product => {
        // Determina il badge di scadenza
        let badge = '';
        if (product.expiry_status === 'expired') {
            badge = '<span class="badge badge-expired">Scaduto</span>';
        } else if (product.expiry_status === 'expiring_soon') {
            badge = '<span class="badge badge-expiring">In scadenza</span>';
        } else if (product.expiry_date) {
            badge = '<span class="badge badge-ok">OK</span>';
        }

        // Formatta la data di scadenza
        const expiryText = product.expiry_date
            ? new Date(product.expiry_date).toLocaleDateString('it-IT')
            : 'Nessuna scadenza';

        return `
            <div class="product-card">
                <div class="product-info">
                    <h3>${escapeHtml(product.name)} ${badge}</h3>
                    <p>${product.brand ? escapeHtml(product.brand) + ' — ' : ''}${product.quantity} ${product.unit}</p>
                    <p>Scadenza: ${expiryText}</p>
                    <p style="font-size: 0.8rem; color: var(--text-light);">${product.category_name || 'Senza categoria'}</p>
                </div>
                <div class="product-actions">
                    <button class="btn btn-small btn-primary" onclick="editProduct(${product.id})">Modifica</button>
                    <button class="btn btn-small btn-danger" onclick="deleteProduct(${product.id})">Elimina</button>
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

/**
 * Apre il modale per aggiungere un prodotto
 */
function openAddModal() {
    modalTitle.textContent = 'Aggiungi prodotto';
    formProduct.reset();
    document.getElementById('product-id').value = '';
    modalProduct.classList.add('active');
}

/**
 * Apre il modale per modificare un prodotto esistente
 */
async function editProduct(id) {
    // Cerca il prodotto nella lista attuale per pre-compilare il form
    try {
        const response = await fetch(API_BASE + '/pantry/list.php');
        const data = await response.json();
        const product = data.products.find(p => p.id == id);

        if (!product) return;

        modalTitle.textContent = 'Modifica prodotto';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-brand').value = product.brand || '';
        document.getElementById('product-barcode').value = product.barcode || '';
        document.getElementById('product-category').value = product.category_id || '';
        document.getElementById('product-quantity').value = product.quantity;
        document.getElementById('product-unit').value = product.unit;
        document.getElementById('product-expiry').value = product.expiry_date || '';

        modalProduct.classList.add('active');
    } catch (error) {
        alert('Errore nel caricamento del prodotto');
    }
}

/**
 * Elimina un prodotto dalla dispensa
 */
async function deleteProduct(id) {
    if (!confirm('Sei sicuro di voler eliminare questo prodotto?')) return;

    try {
        const response = await fetch(API_BASE + '/pantry/delete.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });

        const data = await response.json();
        if (data.success) {
            loadProducts(); // Ricarica la lista
        } else {
            alert(data.error || 'Errore durante l\'eliminazione');
        }
    } catch (error) {
        alert('Errore di connessione');
    }
}

/**
 * Gestione submit form prodotto (aggiunta o modifica)
 */
formProduct.addEventListener('submit', async function (e) {
    e.preventDefault();

    const productId = document.getElementById('product-id').value;
    const isEdit = !!productId;

    // Raccoglie i dati dal form
    const productData = {
        name: document.getElementById('product-name').value.trim(),
        brand: document.getElementById('product-brand').value.trim(),
        barcode: document.getElementById('product-barcode').value.trim(),
        category_id: document.getElementById('product-category').value || null,
        quantity: parseFloat(document.getElementById('product-quantity').value) || 1,
        unit: document.getElementById('product-unit').value,
        expiry_date: document.getElementById('product-expiry').value || null,
    };

    // Aggiunge l'ID se è una modifica
    if (isEdit) {
        productData.id = parseInt(productId);
    }

    const url = isEdit
        ? API_BASE + '/pantry/edit.php'
        : API_BASE + '/pantry/add.php';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });

        const data = await response.json();
        if (data.success) {
            modalProduct.classList.remove('active');
            loadProducts(); // Ricarica la lista
        } else {
            alert(data.error || 'Errore durante il salvataggio');
        }
    } catch (error) {
        alert('Errore di connessione');
    }
});

// === Event listeners ===

// Pulsanti per aprire il modale
btnAddProduct.addEventListener('click', openAddModal);
btnAddFirst.addEventListener('click', openAddModal);

// Chiudi modale
btnCancelModal.addEventListener('click', function () {
    modalProduct.classList.remove('active');
});

// Chiudi modale cliccando fuori
modalProduct.addEventListener('click', function (e) {
    if (e.target === modalProduct) {
        modalProduct.classList.remove('active');
    }
});

// Filtro per categoria
filterCategory.addEventListener('change', loadProducts);

// Logout
btnLogout.addEventListener('click', async function (e) {
    e.preventDefault();
    try {
        await fetch(API_BASE + '/auth/logout.php');
    } catch (error) {
        // Ignora errori di rete durante il logout
    }
    window.location.href = '../index.html';
});

// Carica i prodotti all'avvio della pagina
loadProducts();
