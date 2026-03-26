const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

let db;
const DB_PATH = path.join(__dirname, '../bankvi.db');

async function getDb() {
  if (db) return db;
  
  const SQL = await initSqlJs();
  
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS ventes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produit TEXT NOT NULL,
      quantite INTEGER NOT NULL,
      montant REAL NOT NULL,
      mode_paiement TEXT NOT NULL,
      client TEXT,
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dettes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client TEXT NOT NULL,
      produit TEXT NOT NULL,
      montant REAL NOT NULL,
      date_remboursement TEXT,
      statut TEXT DEFAULT 'en_cours',
      date_creation TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      categorie TEXT NOT NULL,
      quantite INTEGER NOT NULL,
      seuil_alerte INTEGER DEFAULT 5,
      prix_unitaire REAL NOT NULL
    );
  `);

  sauvegarderDb();
  console.log('Base de données BANKVI initialisée');
  return db;
}

function sauvegarderDb() {
  if (db) {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }
}

module.exports = { getDb, sauvegarderDb };