const API = window.location.origin + '/api';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': localStorage.getItem('bankvi_token') || ''
  };
}

function ouvrirModalVente() {
  document.getElementById('modal-vente').classList.add('open');
}

function fermerModalVente() {
  document.getElementById('modal-vente').classList.remove('open');
}

function selectMode(el) {
  document.querySelectorAll('.pay-mode').forEach(e => e.classList.remove('active'));
  el.classList.add('active');
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

function mettreAJourHero(ventes) {
  const aujourd = new Date().toLocaleDateString('fr-FR');
  const ventesJour = ventes.filter(v => new Date(v.date).toLocaleDateString('fr-FR') === aujourd);
  const total = ventesJour.reduce((s, v) => s + v.montant, 0);
  const hero = document.querySelector('.hero-amount');
  if (hero) hero.textContent = Number(total).toLocaleString('fr-FR') + ' F';
  const sub = document.querySelector('.hero-sub');
  if (sub) sub.textContent = ventesJour.length + ' ventes enregistrées';
}

function getBadgeMode(mode) {
  if (mode === 'Cash') return 'cash';
  if (mode === 'À crédit') return 'credit';
  return 'partial';
}

async function chargerVentes() {
  try {
    const res    = await fetch(`${API}/ventes`, { headers: getHeaders() });
    const ventes = await res.json();
    afficherVentes(ventes);
    mettreAJourHero(ventes);
  } catch(e) {
    console.log('Erreur ventes');
  }
}

function afficherVentes(ventes) {
  const container = document.querySelector('.cards-list');
  if (!container) return;
  if (ventes.length === 0) {
    container.innerHTML = '<p style="padding:1.5rem;text-align:center;color:#a0a0a0;">Aucune vente — Enregistre ta première vente</p>';
    return;
  }
  container.innerHTML = ventes.map(v => `
    <div class="list-card">
      <div class="lc-left">
        <div class="lc-avatar green">V</div>
        <div>
          <p class="lc-name">${v.produit}</p>
          <p class="lc-sub">Qté: ${v.quantite} — ${new Date(v.date).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</p>
        </div>
      </div>
      <div class="lc-right">
        <p class="lc-amount green">+${Number(v.montant).toLocaleString('fr-FR')} F</p>
        <span class="badge-mode ${getBadgeMode(v.mode_paiement)}">${v.mode_paiement}</span>
      </div>
    </div>`).join('');
}

async function enregistrerVente() {
  const produit  = document.getElementById('vente-produit').value.trim();
  const quantite = document.getElementById('vente-quantite').value;
  const montant  = document.getElementById('vente-montant').value;
  const mode     = document.querySelector('.pay-mode.active')?.textContent.trim() || 'Cash';
  const client   = document.getElementById('vente-client').value.trim();

  if (!produit || !quantite || !montant) {
    alert('Remplis tous les champs obligatoires');
    return;
  }

  try {
    await fetch(`${API}/ventes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ produit, quantite: Number(quantite), montant: Number(montant), mode_paiement: mode, client: client || '' })
    });
    if (mode === 'À crédit' && client) {
      await fetch(`${API}/dettes`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ client, produit, montant: Number(montant), date_remboursement: '' })
      });
    }
    document.getElementById('vente-produit').value  = '';
    document.getElementById('vente-quantite').value = '';
    document.getElementById('vente-montant').value  = '';
    document.getElementById('vente-client').value   = '';
    fermerModalVente();
    chargerVentes();
  } catch(e) {
    alert('Erreur — serveur non disponible');
  }
}

document.getElementById('btn-enregistrer-vente').addEventListener('click', enregistrerVente);

chargerVentes();