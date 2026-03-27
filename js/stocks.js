const API = window.location.origin + '/api';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': localStorage.getItem('bankvi_token') || ''
  };
}

function ouvrirModalStock() {
  document.getElementById('modal-stock').classList.add('open');
}

function fermerModalStock() {
  document.getElementById('modal-stock').classList.remove('open');
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

document.getElementById('search-input').addEventListener('input', function() {
  const val = this.value.toLowerCase();
  document.querySelectorAll('.stock-card').forEach(card => {
    const nom = card.querySelector('.lc-name')?.textContent.toLowerCase();
    card.style.display = nom?.includes(val) ? '' : 'none';
  });
});

function mettreAJourMetriques(stocks) {
  const vals = document.querySelectorAll('.metric-value');
  if (vals[0]) vals[0].textContent = stocks.length;
  if (vals[1]) vals[1].textContent = stocks.filter(s => s.quantite <= s.seuil_alerte && s.quantite > 0).length;
  if (vals[2]) vals[2].textContent = stocks.filter(s => s.quantite === 0).length;
}

function getStatutStock(stock) {
  if (stock.quantite === 0) return { label: 'Rupture', classe: 'out' };
  if (stock.quantite <= stock.seuil_alerte) return { label: 'Stock bas', classe: 'low' };
  return { label: 'OK', classe: 'ok' };
}

function afficherStocks(stocks) {
  const container = document.querySelector('.cards-list');
  if (!container) return;
  if (stocks.length === 0) {
    container.innerHTML = '<p style="padding:1.5rem;text-align:center;color:#a0a0a0;">Aucun produit — Ajoute ton premier produit</p>';
    return;
  }
  container.innerHTML = stocks.map(s => {
    const statut = getStatutStock(s);
    const pct    = Math.min(100, Math.round((s.quantite / (s.seuil_alerte * 5)) * 100));
    return `
      <div class="stock-card ${statut.classe === 'out' ? 'danger' : statut.classe === 'low' ? 'warn' : ''}">
        <div class="sc-top">
          <div class="lc-left">
            <div class="lc-avatar ${statut.classe === 'ok' ? 'green' : statut.classe === 'low' ? 'blue' : 'red'}">${s.nom.substring(0,2).toUpperCase()}</div>
            <div><p class="lc-name">${s.nom}</p><p class="lc-sub">${s.categorie}</p></div>
          </div>
          <span class="badge-stock ${statut.classe}">${statut.label}</span>
        </div>
        <div class="stock-bar-wrap">
          <div class="stock-bar-labels"><span>${s.quantite} unités</span><span>Seuil: ${s.seuil_alerte}</span></div>
          <div class="stock-bar"><div class="stock-bar-fill ${statut.classe}" style="width:${pct}%"></div></div>
        </div>
        <p class="stock-price">Prix : <strong>${Number(s.prix_unitaire).toLocaleString('fr-FR')} F</strong></p>
        <div class="list-card-actions">
          <button class="btn-success-sm">Commander</button>
          <button class="btn-neutral-sm">Modifier</button>
        </div>
      </div>`;
  }).join('');
}

async function chargerStocks() {
  try {
    const res    = await fetch(`${API}/stocks`, { headers: getHeaders() });
    const stocks = await res.json();
    afficherStocks(stocks);
    mettreAJourMetriques(stocks);
  } catch(e) {
    console.log('Erreur stocks');
  }
}

async function enregistrerStock() {
  const nom       = document.getElementById('stock-nom').value.trim();
  const categorie = document.getElementById('stock-categorie').value;
  const quantite  = document.getElementById('stock-quantite').value;
  const seuil     = document.getElementById('stock-seuil').value;
  const prix      = document.getElementById('stock-prix').value;

  if (!nom || !quantite || !prix) {
    alert('Remplis tous les champs obligatoires');
    return;
  }

  try {
    await fetch(`${API}/stocks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ nom, categorie, quantite: Number(quantite), seuil_alerte: Number(seuil) || 5, prix_unitaire: Number(prix) })
    });
    document.getElementById('stock-nom').value      = '';
    document.getElementById('stock-quantite').value = '';
    document.getElementById('stock-seuil').value    = '';
    document.getElementById('stock-prix').value     = '';
    fermerModalStock();
    chargerStocks();
  } catch(e) {
    alert('Erreur — serveur non disponible');
  }
}

document.getElementById('btn-enregistrer-stock').addEventListener('click', enregistrerStock);

chargerStocks();