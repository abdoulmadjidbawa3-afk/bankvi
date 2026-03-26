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
// ===== ROUTES VENTES =====
app.get('/api/ventes', async (req, res) => {
  const db = await getDb();
  const result = db.exec('SELECT * FROM ventes ORDER BY date DESC');
  const ventes = result[0] ? result[0].values.map(r => ({
    id: r[0], produit: r[1], quantite: r[2],
    montant: r[3], mode_paiement: r[4], client: r[5], date: r[6]
  })) : [];
  res.json(ventes);
});

app.post('/api/ventes', async (req, res) => {
  const db = await getDb();
  const { produit, quantite, montant, mode_paiement, client } = req.body;
  db.run(
    `INSERT INTO ventes (produit, quantite, montant, mode_paiement, client, date)
     VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
    [produit, quantite, montant, mode_paiement, client || '']
  );
  sauvegarderDb();
  res.json({ message: 'Vente enregistrée' });
});

// ===== ROUTES DETTES =====
app.get('/api/dettes', async (req, res) => {
  const db = await getDb();
  const result = db.exec('SELECT * FROM dettes ORDER BY date_creation DESC');
  const dettes = result[0] ? result[0].values.map(r => ({
    id: r[0], client: r[1], produit: r[2], montant: r[3],
    date_remboursement: r[4], statut: r[5], date_creation: r[6]
  })) : [];
  res.json(dettes);
});

app.post('/api/dettes', async (req, res) => {
  const db = await getDb();
  const { client, produit, montant, date_remboursement } = req.body;
  db.run(
    `INSERT INTO dettes (client, produit, montant, date_remboursement, statut, date_creation)
     VALUES (?, ?, ?, ?, 'en_cours', datetime('now', 'localtime'))`,
    [client, produit, montant, date_remboursement]
  );
  sauvegarderDb();
  res.json({ message: 'Dette enregistrée' });
});

app.put('/api/dettes/:id/payer', async (req, res) => {
  const db = await getDb();
  db.run("UPDATE dettes SET statut = 'payee' WHERE id = ?", [req.params.id]);
  sauvegarderDb();
  res.json({ message: 'Dette marquée comme payée' });
});

// ===== ROUTES STOCKS =====
app.get('/api/stocks', async (req, res) => {
  const db = await getDb();
  const result = db.exec('SELECT * FROM stocks ORDER BY nom ASC');
  const stocks = result[0] ? result[0].values.map(r => ({
    id: r[0], nom: r[1], categorie: r[2],
    quantite: r[3], seuil_alerte: r[4], prix_unitaire: r[5]
  })) : [];
  res.json(stocks);
});

app.post('/api/stocks', async (req, res) => {
  const db = await getDb();
  const { nom, categorie, quantite, seuil_alerte, prix_unitaire } = req.body;
  db.run(
    'INSERT INTO stocks (nom, categorie, quantite, seuil_alerte, prix_unitaire) VALUES (?, ?, ?, ?, ?)',
    [nom, categorie, quantite, seuil_alerte, prix_unitaire]
  );
  sauvegarderDb();
  res.json({ message: 'Produit ajouté' });
});

// ===== ROUTE DASHBOARD =====
app.get('/api/dashboard', async (req, res) => {
  const db = await getDb();

  const ventes = db.exec(`
    SELECT COALESCE(SUM(montant),0), COUNT(*)
    FROM ventes WHERE date(date) = date('now','localtime')
  `);

  const dettes = db.exec(`
    SELECT COALESCE(SUM(montant),0), COUNT(*)
    FROM dettes WHERE statut = 'en_cours'
  `);

  const stocks = db.exec(`
    SELECT COUNT(*) FROM stocks WHERE quantite <= seuil_alerte
  `);
// ===== ROUTE STATUT NOUVEAU COMPTE =====
app.get('/api/statut', async (req, res) => {
  const db = await getDb();

  const ventes = db.exec('SELECT COUNT(*) FROM ventes');
  const dettes = db.exec('SELECT COUNT(*) FROM dettes');
  const stocks = db.exec('SELECT COUNT(*) FROM stocks');

  const nbVentes = ventes[0]?.values[0][0] || 0;
  const nbDettes = dettes[0]?.values[0][0] || 0;
  const nbStocks = stocks[0]?.values[0][0] || 0;

  res.json({
    premiereVente:  nbVentes === 0,
    premiereDette:  nbDettes === 0,
    premierStock:   nbStocks === 0,
    nouveau:        nbVentes === 0 && nbDettes === 0 && nbStocks === 0
  });
});
  res.json({
    ventes_jour:     ventes[0]?.values[0][0] || 0,
    ventes_count:    ventes[0]?.values[0][1] || 0,
    dettes_total:    dettes[0]?.values[0][0] || 0,
    dettes_count:    dettes[0]?.values[0][1] || 0,
    stocks_critique: stocks[0]?.values[0][0] || 0
  });
});

// ===== AUTH =====
app.post('/api/auth/register', async (req, res) => {
  const db = await getDb();
  const { nom, boutique, tel, password } = req.body;

  const existe = db.exec(`SELECT id FROM utilisateurs WHERE tel = '${tel}'`);
  if (existe[0]?.values.length > 0) {
    return res.status(400).json({ message: 'Ce numéro est déjà utilisé' });
  }

  const hash = crypto.createHash('sha256').update(password).digest('hex');
  db.run(
    `INSERT INTO utilisateurs (nom, boutique, tel, password) VALUES (?, ?, ?, ?)`,
    [nom, boutique, tel, hash]
  );
  sauvegarderDb();
  res.json({ message: 'Compte créé avec succès' });
});

app.post('/api/auth/login', async (req, res) => {
  const db = await getDb();
  const { identifiant, password } = req.body;
  const hash = crypto.createHash('sha256').update(password).digest('hex');

  const result = db.exec(
    `SELECT * FROM utilisateurs WHERE (tel = '${identifiant}') AND password = '${hash}'`
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

app.listen(PORT, () => {
  console.log(`BANKVI tourne sur port ${PORT}`);
});