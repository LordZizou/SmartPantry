// Gestione autenticazione (login e registrazione) via AJAX

// Percorso base delle API (relativo alla posizione di index.html)
const API_BASE = 'api';

// Riferimenti agli elementi del DOM
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authTitle = document.getElementById('auth-title');
const authMessage = document.getElementById('auth-message');
const switchLink = document.getElementById('switch-link');
const switchText = document.getElementById('switch-text');

// Stato corrente: 'login' o 'register'
let currentMode = 'login';

/**
 * Mostra un messaggio all'utente (errore o successo)
 */
function showMessage(text, type = 'error') {
    authMessage.textContent = text;
    authMessage.className = 'message ' + type;
}

/**
 * Nasconde il messaggio
 */
function hideMessage() {
    authMessage.className = 'message';
    authMessage.textContent = '';
}

/**
 * Alterna tra form di login e registrazione
 */
switchLink.addEventListener('click', function (e) {
    e.preventDefault();
    hideMessage();

    if (currentMode === 'login') {
        // Passa a registrazione
        currentMode = 'register';
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        authTitle.textContent = 'Crea il tuo account';
        switchText.textContent = 'Hai già un account?';
        switchLink.textContent = 'Accedi';
    } else {
        // Passa a login
        currentMode = 'login';
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        authTitle.textContent = 'Accedi a Smart Pantry';
        switchText.textContent = 'Non hai un account?';
        switchLink.textContent = 'Registrati';
    }
});

/**
 * Gestione submit form di login
 */
loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideMessage();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showMessage('Compila tutti i campi');
        return;
    }

    try {
        const response = await fetch(API_BASE + '/auth/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            showMessage('Login effettuato! Reindirizzamento...', 'success');
            // Reindirizza alla pagina dispensa dopo il login
            setTimeout(() => {
                window.location.href = 'pages/pantry.html';
            }, 500);
        } else {
            showMessage(data.error || 'Errore durante il login');
        }
    } catch (error) {
        showMessage('Errore di connessione al server');
    }
});

/**
 * Gestione submit form di registrazione
 */
registerForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideMessage();

    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;

    if (!username || !email || !password) {
        showMessage('Compila tutti i campi');
        return;
    }

    if (password.length < 6) {
        showMessage('La password deve avere almeno 6 caratteri');
        return;
    }

    try {
        const response = await fetch(API_BASE + '/auth/register.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (data.success) {
            showMessage('Registrazione completata! Reindirizzamento...', 'success');
            // Reindirizza alla pagina dispensa dopo la registrazione
            setTimeout(() => {
                window.location.href = 'pages/pantry.html';
            }, 500);
        } else {
            showMessage(data.error || 'Errore durante la registrazione');
        }
    } catch (error) {
        showMessage('Errore di connessione al server');
    }
});
