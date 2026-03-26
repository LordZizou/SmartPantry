# Smart Pantry — CLAUDE.md

## Descrizione progetto
Web app scolastica per gestione dispensa domestica.
Progetto di gruppo (2 studenti). Backend condiviso con API REST.

## Stack tecnologico
- **Backend**: PHP (API REST pura, no framework)
- **Database**: MariaDB
- **Frontend**: HTML, CSS, JavaScript 
- **Comunicazione**: AJAX + JSON
- **Hosting locale**: XAMPP 

## Struttura cartelle (da rispettare)
smart-pantry/
├── api/
│   ├── auth/
│   ├── pantry/
│   ├── recipes/
│   └── config/
├── assets/
│   ├── css/
│   ├── js/
│   └── img/
├── pages/
└── index.html

## API esterne utilizzate
- OpenFoodFacts: https://world.openfoodfacts.org/api/v0/product/BARCODE.json (gratuita, no key)
- Spoonacular: ricette (richiede API key — da inserire in config)

## Regole di sviluppo
- Ogni endpoint PHP risponde SEMPRE in JSON
- Headers CORS abilitati su tutti gli endpoint
- Autenticazione tramite PHP sessions
- Nessun framework CSS (solo CSS vanilla o variabili custom)
- Commenti in italiano nel codice
- Nomi variabili e funzioni in inglese

## Configurazione
- API keys in api/config/config.php (file escluso da git via .gitignore)
- Non hardcodare mai chiavi nel codice

## Stato attuale
- [ ] Struttura cartelle
- [ ] Database schema
- [ ] Autenticazione (register/login)
- [ ] CRUD dispensa
- [ ] Scanner barcode + OpenFoodFacts
- [ ] Suggerimenti ricette
- [ ] Valori nutrizionali

## Note importanti
- Il progetto è scolastico: il codice deve essere leggibile e commentato
- Non usare librerie esterne salvo jsQR per il barcode scanner
