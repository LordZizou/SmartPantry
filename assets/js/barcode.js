// Gestione scanner barcode con jsQR

// Riferimenti DOM
const modalScanner = document.getElementById('modal-scanner');
const scannerVideo = document.getElementById('scanner-video');
const scannerCanvas = document.getElementById('scanner-canvas');
const scannerStatus = document.getElementById('scanner-status');
const btnScanBarcode = document.getElementById('btn-scan-barcode');
const btnCloseScanner = document.getElementById('btn-close-scanner');

// Variabili per lo scanner
let scannerStream = null;
let scannerInterval = null;

/**
 * Avvia lo scanner barcode (apre la fotocamera)
 */
async function startScanner() {
    modalScanner.classList.add('active');
    scannerStatus.textContent = 'Avvio fotocamera...';

    try {
        // Richiede accesso alla fotocamera posteriore
        scannerStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });

        scannerVideo.srcObject = scannerStream;
        scannerVideo.play();

        scannerStatus.textContent = 'Inquadra il barcode con la fotocamera...';

        // Attende che il video sia pronto prima di iniziare la scansione
        scannerVideo.addEventListener('loadedmetadata', function () {
            scannerCanvas.width = scannerVideo.videoWidth;
            scannerCanvas.height = scannerVideo.videoHeight;

            // Avvia il loop di scansione
            const ctx = scannerCanvas.getContext('2d');
            scannerInterval = setInterval(() => {
                scanFrame(ctx);
            }, 200); // Scansiona ogni 200ms
        });
    } catch (error) {
        scannerStatus.textContent = 'Errore: impossibile accedere alla fotocamera';
    }
}

/**
 * Analizza un singolo frame del video alla ricerca di un barcode/QR
 */
function scanFrame(ctx) {
    if (scannerVideo.readyState !== scannerVideo.HAVE_ENOUGH_DATA) return;

    // Disegna il frame corrente sul canvas
    ctx.drawImage(scannerVideo, 0, 0, scannerCanvas.width, scannerCanvas.height);

    // Ottiene i dati dell'immagine per jsQR
    const imageData = ctx.getImageData(0, 0, scannerCanvas.width, scannerCanvas.height);

    // Prova a decodificare un codice QR/barcode
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code && code.data) {
        // Barcode trovato — ferma lo scanner e cerca il prodotto
        scannerStatus.textContent = 'Barcode trovato: ' + code.data;
        stopScanner();
        lookupBarcode(code.data);
    }
}

/**
 * Ferma lo scanner e chiude la fotocamera
 */
function stopScanner() {
    // Ferma il loop di scansione
    if (scannerInterval) {
        clearInterval(scannerInterval);
        scannerInterval = null;
    }

    // Ferma lo stream della fotocamera
    if (scannerStream) {
        scannerStream.getTracks().forEach(track => track.stop());
        scannerStream = null;
    }

    scannerVideo.srcObject = null;
    modalScanner.classList.remove('active');
}

/**
 * Cerca il prodotto tramite barcode sull'API OpenFoodFacts
 */
async function lookupBarcode(barcode) {
    try {
        const response = await fetch('/api/barcode/lookup.php?barcode=' + encodeURIComponent(barcode));
        const data = await response.json();

        if (data.success) {
            // Pre-compila il form di aggiunta prodotto con i dati trovati
            fillProductForm(data.product);
        } else {
            alert('Prodotto non trovato nel database OpenFoodFacts.\nPuoi inserirlo manualmente.');
            openAddModal();
            document.getElementById('product-barcode').value = barcode;
        }
    } catch (error) {
        alert('Errore nella ricerca del prodotto');
    }
}

/**
 * Pre-compila il form di aggiunta prodotto con i dati del barcode
 */
function fillProductForm(product) {
    // Apre il modale di aggiunta
    openAddModal();

    // Compila i campi con i dati del prodotto
    document.getElementById('product-name').value = product.name || '';
    document.getElementById('product-brand').value = product.brand || '';
    document.getElementById('product-barcode').value = product.barcode || '';
}

// === Event listeners ===

// Pulsante per avviare lo scanner
btnScanBarcode.addEventListener('click', startScanner);

// Pulsante per chiudere lo scanner
btnCloseScanner.addEventListener('click', stopScanner);

// Chiudi scanner cliccando fuori dal modale
modalScanner.addEventListener('click', function (e) {
    if (e.target === modalScanner) {
        stopScanner();
    }
});
