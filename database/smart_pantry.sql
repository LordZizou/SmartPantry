-- Schema del database Smart Pantry
-- Creazione database e selezione

CREATE DATABASE IF NOT EXISTS smart_pantry
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_general_ci;

USE smart_pantry;

-- Tabella utenti
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabella categorie prodotti
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Tabella prodotti in dispensa
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT DEFAULT NULL,
    name VARCHAR(100) NOT NULL,
    brand VARCHAR(100) DEFAULT NULL,
    barcode VARCHAR(50) DEFAULT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit VARCHAR(20) DEFAULT 'pz',
    expiry_date DATE DEFAULT NULL,
    nutritional_info JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Tabella cache ricette da Spoonacular
CREATE TABLE IF NOT EXISTS recipes_cache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    spoonacular_id INT NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    ingredients JSON DEFAULT NULL,
    instructions TEXT DEFAULT NULL,
    image_url VARCHAR(500) DEFAULT NULL,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Indici per migliorare le performance delle query più comuni
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_expiry_date ON products(expiry_date);
CREATE INDEX idx_recipes_cache_spoonacular_id ON recipes_cache(spoonacular_id);

-- Dati di esempio per le categorie
INSERT INTO categories (name) VALUES
    ('Latticini'),
    ('Carne'),
    ('Verdura'),
    ('Frutta'),
    ('Cereali'),
    ('Bevande'),
    ('Altro');
