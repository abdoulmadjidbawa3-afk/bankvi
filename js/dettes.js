const API = 'http://localhost:3000/api';

function ouvrirModal() {
  document.getElementById('modal-dette').classList.add('open');
}

function fermerModal() {
  document.getElementById('modal-dette').classList.remove('open');
}

// Filtres
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// ===== CHARGER DETTES =====
async function chargerDettes() {
  try {
    const res = await fetch(`${API}/dettes`);
    const dettes = await res.json();
    afficherDettes(dettes);
    mettreAJourHero(dettes);
  } catch(e) {
    console.log('Serveur non disponible');
  }
}

function mettreAJourHero(dettes) {
  const enCours = dettes.filter(d => d.statut === 'en_cours');
  const total = enCours.reduce((s, d) => s + d.montant, 0);
  const hero = document.querySelector('.hero-amount');
  if (hero) hero.textContent = Number(total).toLocaleString('fr-FR') + ' F';
  const sub = document.querySelector('.hero-sub');
  if (sub) sub.textContent = enCours.length + ' clients concernés';
}

function afficherDettes(dettes) {
  const urgentes = dettes.filter(d => d.statut === 'en_cours');
  const container = document.querySelector('.cards-list');
  if (!container) return;

  if (urgentes.length === 0) {
    container.innerHTML = '<p style="padding:1rem;text-align:center;color:#a0a0a0;">Aucune dette en cours</p>';
    return;
  }

  container.innerHTML = urgentes.map(d => `
    <div class="list-card urgent" id="dette-${d.id}">
      <div class="lc-left">
        <div class="lc-avatar red">${d.client.substring(0,2).toUpperCase()}</div>
        <div>
          <p class="lc-name">${d.client}</p>
          <p class="lc-sub">${d.produit}</p>
        </div>
      </div>
      <div class="lc-right">
        <p class="lc-amount red">${Number(d.montant).toLocaleString('fr-FR')} F</p>
        <p class="lc-days">${new Date(d.date_creation).toLocaleDateString('fr-FR')}</p>
      </div>
    </div>
    <div class="list-card-actions">
      <button class="btn-success-sm" onclick="marquerPaye(${d.id})">Marquer payé</button>
      <button class="btn-neutral-sm">Rappel envoyé</button>
    </div>
  `).join('');
}

// ===== ENREGISTRER DETTE =====
async function enregistrerDette() {
  const client = document.getElementById('input-nom').value.trim();
  const produit = document.getElementById('input-produit').value.trim();
  const montant = document.getElementById('input-montant').value;
  const date_remboursement = document.getElementById('input-date').value;

  if (!client || !produit || !montant) {
    alert('Remplis tous les champs obligatoires');
    return;
  }

  try {
    await fetch(`${API}/dettes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client, produit, montant: Number(montant), date_remboursement })
    });
    fermerModal();
    chargerDettes();
  } catch(e) {
    alert('Erreur — serveur non disponible');
  }
}

// ===== MARQUER PAYÉ =====
async function marquerPaye(id) {
  try {
    await fetch(`${API}/dettes/${id}/payer`, { method: 'PUT' });
    chargerDettes();
  } catch(e) {
    alert('Erreur — serveur non disponible');
  }
}

// Bouton enregistrer dans le modal
document.querySelector('.btn-save').addEventListener('click', enregistrerDette);

chargerDettes();