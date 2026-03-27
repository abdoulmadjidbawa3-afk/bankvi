const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const { getDb, sauvegarderDb } = require('./js/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.use(express.static(path.join(__dirname)));

// ===== MIDDLEWARE AUTH =====
async function authentifier(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'Non autorisé' });

  const db = await getDb();
  const result = db.exec(`SELECT * FROM utilisateurs WHERE token = '${token}'`);
  if (!result[0]?.values.length) return res.status(401).json({ message: 'Token invalide' });

  const u = result[0].values[0];
  req.utilisateur = { id: u[0], nom: u[1], boutique: u[2], tel: u[3] };
  next();
}

// ===== AUTH =====
app.post('/api/auth/register', async (req, res) => {
  const db = await getDb();
  const { nom, boutique, tel, password } = req.body;

  const existe = db.exec(`SELECT id FROM utilisateurs WHERE tel = '${tel}'`);
  if (existe[0]?.values.length > 0) {
    return res.status(400).json({ message: 'Ce numéro est déjà utilisé' });
  }

  const hash = crypto.createHash('sha256').update(password).digest('hex');
  db.run(`INSERT INTO utilisateurs (nom, boutique, tel, password) VALUES (?, ?, ?, ?)`,
    [nom, boutique, tel, hash]);
  sauvegarderDb();
  res.json({ message: 'Compte créé avec succès' });
});

app.post('/api/auth/login', async (req, res) => {
  const db = await getDb();
  const { identifiant, password } = req.body;
  const hash = crypto.createHash('sha256').update(password).digest('hex');

  const result = db.exec(
    `SELECT * FROM utilisateurs WHERE tel = '${identifiant}' AND password = '${hash}'`
  );

  if (!result[0]?.values.length) {
    return res.status(401).json({ message: 'Identifiants incorrects' });
  }

  const u = result[0].values[0];
  const token = crypto.randomBytes(32).toString('hex');
  db.run(`UPDATE utilisateurs SET token = '${token}' WHERE id = ${u[0]}`);
  sauvegarderDb();

  res.json({
    token,
    user: { id: u[0], nom: u[1], boutique: u[2], tel: u[3] }
  });
});

// ===== ROUTES VENTES =====
app.get('/api/ventes', authentifier, async (req, res) => {
  const db = await getDb();
  const result = db.exec(`SELECT * FROM ventes WHERE utilisateur_id = ${req.utilisateur.id} ORDER BY date DESC`);
  const ventes = result[0] ? result[0].values.map(r => ({
    id: r[0], utilisateur_id: r[1], produit: r[2], quantite: r[3],
    montant: r[4], mode_paiement: r[5], client: r[6], date: r[7]
  })) : [];
  res.json(ventes);
});

app.post('/api/ventes', authentifier, async (req, res) => {
  const db = await getDb();
  const { produit, quantite, montant, mode_paiement, client } = req.body;
  db.run(
    `INSERT INTO ventes (utilisateur_id, produit, quantite, montant, mode_paiement, client, date)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
    [req.utilisateur.id, produit, quantite, montant, mode_paiement, client || '']
  );
  sauvegarderDb();
  res.json({ message: 'Vente enregistrée' });
});

// ===== ROUTES DETTES =====
app.get('/api/dettes', authentifier, async (req, res) => {
  const db = await getDb();
  const result = db.exec(`SELECT * FROM dettes WHERE utilisateur_id = ${req.utilisateur.id} ORDER BY date_creation DESC`);
  const dettes = result[0] ? result[0].values.map(r => ({
    id: r[0], utilisateur_id: r[1], client: r[2], produit: r[3], montant: r[4],
    date_remboursement: r[5], statut: r[6], date_creation: r[7]
  })) : [];
  res.json(dettes);
});

app.post('/api/dettes', authentifier, async (req, res) => {
  const db = await getDb();
  const { client, produit, montant, date_remboursement } = req.body;
  db.run(
    `INSERT INTO dettes (utilisateur_id, client, produit, montant, date_remboursement, statut, date_creation)
     VALUES (?, ?, ?, ?, ?, 'en_cours', datetime('now', 'localtime'))`,
    [req.utilisateur.id, client, produit, montant, date_remboursement]
  );
  sauvegarderDb();
  res.json({ message: 'Dette enregistrée' });
});

app.put('/api/dettes/:id/payer', authentifier, async (req, res) => {
  const db = await getDb();
  db.run(`UPDATE dettes SET statut = 'payee' WHERE id = ? AND utilisateur_id = ?`,
    [req.params.id, req.utilisateur.id]);
  sauvegarderDb();
  res.json({ message: 'Dette marquée comme payée' });
});

// ===== ROUTES STOCKS =====
app.get('/api/stocks', authentifier, async (req, res) => {
  const db = await getDb();
  const result = db.exec(`SELECT * FROM stocks WHERE utilisateur_id = ${req.utilisateur.id} ORDER BY nom ASC`);
  const stocks = result[0] ? result[0].values.map(r => ({
    id: r[0], utilisateur_id: r[1], nom: r[2], categorie: r[3],
    quantite: r[4], seuil_alerte: r[5], prix_unitaire: r[6]
  })) : [];
  res.json(stocks);
});

app.post('/api/stocks', authentifier, async (req, res) => {
  const db = await getDb();
  const { nom, categorie, quantite, seuil_alerte, prix_unitaire } = req.body;
  db.run(
    `INSERT INTO stocks (utilisateur_id, nom, categorie, quantite, seuil_alerte, prix_unitaire)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.utilisateur.id, nom, categorie, quantite, seuil_alerte, prix_unitaire]
  );
  sauvegarderDb();
  res.json({ message: 'Produit ajouté' });
});

// ===== DASHBOARD =====
app.get('/api/dashboard', authentifier, async (req, res) => {
  const db = await getDb();
  const uid = req.utilisateur.id;

  const ventes = db.exec(`
    SELECT COALESCE(SUM(montant),0), COUNT(*)
    FROM ventes
    WHERE utilisateur_id = ${uid} AND date(date) = date('now','localtime')
  `);

  const dettes = db.exec(`
    SELECT COALESCE(SUM(montant),0), COUNT(*)
    FROM dettes
    WHERE utilisateur_id = ${uid} AND statut = 'en_cours'
  `);

  const stocks = db.exec(`
    SELECT COUNT(*) FROM stocks
    WHERE utilisateur_id = ${uid} AND quantite <= seuil_alerte
  `);

  res.json({
    ventes_jour:     ventes[0]?.values[0][0] || 0,
    ventes_count:    ventes[0]?.values[0][1] || 0,
    dettes_total:    dettes[0]?.values[0][0] || 0,
    dettes_count:    dettes[0]?.values[0][1] || 0,
    stocks_critique: stocks[0]?.values[0][0] || 0
  });
});

// ===== STATUT NOUVEAU COMPTE =====
app.get('/api/statut', authentifier, async (req, res) => {
  const db = await getDb();
  const uid = req.utilisateur.id;

  const ventes = db.exec(`SELECT COUNT(*) FROM ventes WHERE utilisateur_id = ${uid}`);
  const dettes = db.exec(`SELECT COUNT(*) FROM dettes WHERE utilisateur_id = ${uid}`);
  const stocks = db.exec(`SELECT COUNT(*) FROM stocks WHERE utilisateur_id = ${uid}`);

  const nbVentes = ventes[0]?.values[0][0] || 0;
  const nbDettes = dettes[0]?.values[0][0] || 0;
  const nbStocks = stocks[0]?.values[0][0] || 0;

  res.json({
    premiereVente: nbVentes === 0,
    premiereDette: nbDettes === 0,
    premierStock:  nbStocks === 0,
    nouveau:       nbVentes === 0 && nbDettes === 0 && nbStocks === 0
  });
});

app.listen(PORT, () => {
  console.log(`BANKVI tourne sur port ${PORT}`);
});