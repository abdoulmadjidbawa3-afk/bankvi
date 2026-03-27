const API = window.location.origin + '/api';
const user = JSON.parse(localStorage.getItem('bankvi_user') || '{}');
const prenom = user.nom ? user.nom.split(' ')[0] : 'Client';

// ===== DONNÉES DÉMO PERSONNALISÉES =====
function getDemoVentes() {
  return [
    { id: 'demo-1', produit: 'Sucre cristal 25kg', quantite: 3, montant: 9000, mode_paiement: 'Cash', client: prenom, date: new Date().toISOString() },
    { id: 'demo-2', produit: 'Savon de ménage x10', quantite: 10, montant: 4500, mode_paiement: 'Cash', client: '', date: new Date().toISOString() },
    { id: 'demo-3', produit: 'Huile de palme x5', quantite: 5, montant: 15500, mode_paiement: 'À crédit', client: prenom, date: new Date().toISOString() },
  ];
}

function getDemoDettes() {
  return [
    { id: 'demo-1', client: prenom, produit: 'Tissu wax x3', montant: 25000, statut: 'en_cours', date_creation: new Date().toISOString() },
    { id: 'demo-2', client: prenom + ' (ami)', produit: 'Riz 50kg x2', montant: 18500, statut: 'en_cours', date_creation: new Date().toISOString() },
  ];
}

function getDemoStocks() {
  return [
    { id: 'demo-1', nom: 'Riz importé 50kg', categorie: 'Alimentation', quantite: 1, seuil_alerte: 5, prix_unitaire: 11000 },
    { id: 'demo-2', nom: 'Huile de palme', categorie: 'Alimentation', quantite: 0, seuil_alerte: 5, prix_unitaire: 3100 },
    { id: 'demo-3', nom: 'Sucre cristal', categorie: 'Alimentation', quantite: 5, seuil_alerte: 8, prix_unitaire: 5500 },
    { id: 'demo-4', nom: 'Savon de ménage', categorie: 'Hygiène', quantite: 38, seuil_alerte: 10, prix_unitaire: 450 },
  ];
}

// ===== VÉRIFIER STATUT =====
async function getStatut() {
  try {
    const res = await fetch(`${API}/statut`);
    return await res.json();
  } catch(e) {
    return { premiereVente: false, premiereDette: false, premierStock: false, nouveau: false };
  }
}

// ===== INJECTER DÉMO VENTES =====
async function injecterDemoVentes(container) {
  const statut = await getStatut();
  if (!statut.premiereVente) return false;

  const ventes = getDemoVentes();
  container.innerHTML = `
    <div class="demo-banner">
      <span>👆 Exemple — Enregistre ta première vente pour commencer</span>
    </div>
    ${ventes.map(v => `
      <div class="list-card demo-card">
        <div class="lc-left">
          <div class="lc-avatar green">V</div>
          <div>
            <p class="lc-name">${v.produit}</p>
            <p class="lc-sub">Qté: ${v.quantite} — exemple</p>
          </div>
        </div>
        <div class="lc-right">
          <p class="lc-amount green">+${Number(v.montant).toLocaleString('fr-FR')} F</p>
          <span class="badge-mode ${v.mode_paiement === 'Cash' ? 'cash' : 'credit'}">${v.mode_paiement}</span>
        </div>
      </div>
    `).join('')}
  `;
  return true;
}

// ===== INJECTER DÉMO DETTES =====
async function injecterDemoDettes(container) {
  const statut = await getStatut();
  if (!statut.premiereDette) return false;

  const dettes = getDemoDettes();
  container.innerHTML = `
    <div class="demo-banner">
      <span>👆 Exemple — Ajoute ta première dette pour commencer</span>
    </div>
    ${dettes.map(d => `
      <div class="list-card urgent demo-card">
        <div class="lc-left">
          <div class="lc-avatar red">${d.client.substring(0,2).toUpperCase()}</div>
          <div>
            <p class="lc-name">${d.client}</p>
            <p class="lc-sub">${d.produit} — exemple</p>
          </div>
        </div>
        <div class="lc-right">
          <p class="lc-amount red">${Number(d.montant).toLocaleString('fr-FR')} F</p>
          <p class="lc-days">exemple</p>
        </div>
      </div>
      <div class="list-card-actions">
        <button class="btn-success-sm" disabled style="opacity:0.4;cursor:not-allowed;">Marquer payé</button>
        <button class="btn-neutral-sm" disabled style="opacity:0.4;cursor:not-allowed;">Rappel</button>
      </div>
    `).join('')}
  `;
  return true;
}

// ===== INJECTER DÉMO STOCKS =====
async function injecterDemoStocks(container) {
  const statut = await getStatut();
  if (!statut.premierStock) return false;

  const stocks = getDemoStocks();

  function getStatutStock(s) {
    if (s.quantite === 0) return { label: 'Rupture', classe: 'out' };
    if (s.quantite <= s.seuil_alerte) return { label: 'Stock bas', classe: 'low' };
    return { label: 'OK', classe: 'ok' };
  }

  container.innerHTML = `
    <div class="demo-banner">
      <span>👆 Exemple — Ajoute ton premier produit pour commencer</span>
    </div>
    ${stocks.map(s => {
      const st = getStatutStock(s);
      const pct = Math.min(100, Math.round((s.quantite / (s.seuil_alerte * 5)) * 100));
      return `
        <div class="stock-card ${st.classe === 'out' ? 'danger' : st.classe === 'low' ? 'warn' : ''} demo-card">
          <div class="sc-top">
            <div class="lc-left">
              <div class="lc-avatar ${st.classe === 'ok' ? 'green' : st.classe === 'low' ? 'blue' : 'red'}">
                ${s.nom.substring(0,2).toUpperCase()}
              </div>
              <div>
                <p class="lc-name">${s.nom}</p>
                <p class="lc-sub">${s.categorie} — exemple</p>
              </div>
            </div>
            <span class="badge-stock ${st.classe}">${st.label}</span>
          </div>
          <div class="stock-bar-wrap">
            <div class="stock-bar-labels">
              <span>${s.quantite} unités</span>
              <span>Seuil: ${s.seuil_alerte}</span>
            </div>
            <div class="stock-bar">
              <div class="stock-bar-fill ${st.classe}" style="width:${pct}%"></div>
            </div>
          </div>
          <p class="stock-price">Prix unitaire : <strong>${Number(s.prix_unitaire).toLocaleString('fr-FR')} F</strong></p>
          <div class="list-card-actions">
            <button class="btn-success-sm" disabled style="opacity:0.4;cursor:not-allowed;">Commander</button>
            <button class="btn-neutral-sm" disabled style="opacity:0.4;cursor:not-allowed;">Modifier</button>
          </div>
        </div>
      `;
    }).join('')}
  `;
  return true;
}

// ===== DÉMO DASHBOARD =====
async function injecterDemoDashboard() {
  const statut = await getStatut();
  if (!statut.nouveau) return false;

  const hero = document.querySelector('.hero-amount');
  if (hero) {
    hero.textContent = '-- F';
    const sub = document.querySelector('.hero-sub');
    if (sub) sub.textContent = 'Aucune vente encore';
    const stats = document.querySelectorAll('.hs-val');
    stats.forEach(s => s.textContent = '-- F');
  }

  const metriques = document.querySelectorAll('.metric-value');
  if (metriques[0]) metriques[0].textContent = '-- F';
  if (metriques[1]) metriques[1].textContent = '--';
  if (metriques[2]) metriques[2].textContent = '-- F';
  if (metriques[3]) metriques[3].textContent = '--';

  const liste = document.querySelector('.cards-list');
  if (liste) {
    await injecterDemoDettes(liste);
  }

  return true;
}