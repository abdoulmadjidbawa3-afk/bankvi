const API = window.location.origin + '/api';

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

// ===== CHARGER STOCKS =====
async function initialiserStocks() {
  const container = document.querySelector('.cards-list');
  const injected = await injecterDemoStocks(container);
  if (!injected) chargerStocks();
}
initialiserStocks();

function mettreAJourMetriques(stocks) {
  const total    = stocks.length;
  const bas      = stocks.filter(s => s.quantite <= s.seuil_alerte && s.quantite > 0).length;
  const rupture  = stocks.filter(s => s.quantite === 0).length;
  const vals     = document.querySelectorAll('.metric-value');
  if (vals[0]) vals[0].textContent = total;
  if (vals[1]) vals[1].textContent = bas;
  if (vals[2]) vals[2].textContent = rupture;
}

function getStatut(stock) {
  if (stock.quantite === 0) return { label: 'Rupture', classe: 'out' };
  if (stock.quantite <= stock.seuil_alerte) return { label: 'Stock bas', classe: 'low' };
  return { label: 'OK', classe: 'ok' };
}

function getPourcentage(stock) {
  return Math.min(100, Math.round((stock.quantite / (stock.seuil_alerte * 5)) * 100));
}

function afficherStocks(stocks) {
  const container = document.querySelector('.cards-list');
  if (!container) return;

  if (stocks.length === 0) {
    container.innerHTML = '<p style="padding:1rem;text-align:center;color:#a0a0a0;">Aucun produit — Ajoute ton premier produit</p>';
    return;
  }

  container.innerHTML = stocks.map(s => {
    const statut = getStatut(s);
    const pct    = getPourcentage(s);
    return `
      <div class="stock-card ${statut.classe === 'out' ? 'danger' : statut.classe === 'low' ? 'warn' : ''}">
        <div class="sc-top">
          <div class="lc-left">
            <div class="lc-avatar ${statut.classe === 'ok' ? 'green' : statut.classe === 'low' ? 'blue' : 'red'}">
              ${s.nom.substring(0,2).toUpperCase()}
            </div>
            <div>
              <p class="lc-name">${s.nom}</p>
              <p class="lc-sub">${s.categorie}</p>
            </div>
          </div>
          <span class="badge-stock ${statut.classe}">${statut.label}</span>
        </div>
        <div class="stock-bar-wrap">
          <div class="stock-bar-labels">
            <span>${s.quantite} unités restantes</span>
            <span>Seuil: ${s.seuil_alerte}</span>
          </div>
          <div class="stock-bar">
            <div class="stock-bar-fill ${statut.classe}" style="width:${pct}%"></div>
          </div>
        </div>
        <p class="stock-price">Prix unitaire : <strong>${Number(s.prix_unitaire).toLocaleString('fr-FR')} F</strong></p>
        <div class="list-card-actions">
          <button class="btn-success-sm">Commander</button>
          <button class="btn-neutral-sm">Modifier</button>
        </div>
      </div>
    `;
  }).join('');
}

// ===== ENREGISTRER STOCK =====
async function enregistrerStock() {
  const inputs  = document.querySelectorAll('#modal-stock input');
  const select  = document.querySelector('#modal-stock select');
  const nom     = inputs[0].value.trim();
  const categorie = select.value;
  const quantite  = inputs[1].value;
  const seuil     = inputs[2].value;
  const prix      = inputs[3].value;

  if (!nom || !quantite || !prix) {
    alert('Remplis tous les champs obligatoires');
    return;
  }

  try {
    await fetch(`${API}/stocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom,
        categorie,
        quantite: Number(quantite),
        seuil_alerte: Number(seuil) || 5,
        prix_unitaire: Number(prix)
      })
    });
    fermerModalStock();
    chargerStocks();
  } catch(e) {
    alert('Erreur — serveur non disponible');
  }
}

document.querySelector('.btn-save').addEventListener('click', enregistrerStock);

async function initialiserStocks() {
  const container = document.querySelector('.cards-list');
  if (!container) return;
  const injected = await injecterDemoStocks(container);
  if (!injected) chargerStocks();
}
initialiserStocks();