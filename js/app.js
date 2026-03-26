const API = window.location.origin + '/api';

// ===== PROTECTION =====
const token = localStorage.getItem('bankvi_token');
if (!token) window.location.href = 'login.html';

// ===== DATE =====
function afficherDate() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const el = document.getElementById('nav-date');
  if (el) el.textContent = new Date().toLocaleDateString('fr-FR', options);
}
afficherDate();

// ===== UTILISATEUR =====
const user = JSON.parse(localStorage.getItem('bankvi_user') || '{}');
const avatar = document.querySelector('.nav-avatar');
if (avatar && user.nom) {
  avatar.textContent = user.nom.substring(0, 2).toUpperCase();
  avatar.title = user.nom;
}

// ===== SIDEBAR =====
function creerSidebar() {
  if (window.innerWidth < 768) return;
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';
  const items = [
    { icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="10" y="2" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="10" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="10" y="10" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/></svg>', label: 'Accueil', href: 'index.html' },
    { icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M9 6v3l2 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>', label: 'Dettes', href: 'dettes.html' },
    { icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 12l3-3 3 3 3-4 3 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>', label: 'Ventes', href: 'ventes.html' },
    { icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="3" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M6 9h6M9 6v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>', label: 'Stocks', href: 'stocks.html' },
    { icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M3 15c0-3 2.7-5 6-5s6 2 6 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>', label: 'Profil', href: 'profil.html' },
  ];
  const pageCourante = window.location.pathname.split('/').pop() || 'index.html';
  items.forEach(item => {
    const a = document.createElement('a');
    a.href = item.href;
    a.className = 'sidebar-item' + (pageCourante === item.href ? ' active' : '');
    a.innerHTML = item.icon + `<span>${item.label}</span>`;
    sidebar.appendChild(a);
  });
  const navbar = document.querySelector('.navbar');
  if (navbar) navbar.insertAdjacentElement('afterend', sidebar);
}
creerSidebar();

// ===== UTILITAIRES =====
function formaterMontant(montant) {
  return Number(montant).toLocaleString('fr-FR') + ' F';
}

function joursDepuis(dateStr) {
  const diff = Math.floor((new Date() - new Date(dateStr)) / 86400000);
  if (diff === 0) return "aujourd'hui";
  if (diff === 1) return 'hier';
  return `il y a ${diff} jours`;
}

// ===== DASHBOARD =====
async function chargerDashboard() {
  const hero = document.querySelector('.hero-amount');
  if (!hero) return;

  try {
    const res  = await fetch(`${API}/dashboard`);
    const data = await res.json();

    document.querySelector('.hero-amount').textContent = formaterMontant(data.ventes_jour);
    document.querySelector('.hero-sub').textContent    = data.ventes_count + ' ventes enregistrées';

    const metriques = document.querySelectorAll('.metric-value');
    if (metriques[0]) metriques[0].textContent = formaterMontant(data.dettes_total);
    if (metriques[1]) metriques[1].textContent = data.stocks_critique;
    if (metriques[2]) metriques[2].textContent = formaterMontant(data.remboursé || 0);
    if (metriques[3]) metriques[3].textContent = '1';

    const resD   = await fetch(`${API}/dettes`);
    const dettes = await resD.json();
    afficherDettesRecentes(dettes.filter(d => d.statut === 'en_cours').slice(0, 3));

    // Onboarding si tout est vide
    const aucuneDonnee = 
      data.ventes_jour === 0 && 
      data.dettes_total === 0 && 
      data.stocks_critique === 0 &&
      data.ventes_count === 0;

    if (aucuneDonnee) {
      afficherOnboarding();
    } else {
      const ob = document.getElementById('onboarding');
      if (ob) ob.remove();
    }

  } catch(e) {
    console.log('Erreur dashboard');
  }
}

function afficherDettesRecentes(dettes) {
  const liste = document.querySelector('.cards-list');
  if (!liste) return;

  if (dettes.length === 0) {
    liste.innerHTML = `
      <div style="padding:1.5rem;text-align:center;">
        <p style="color:#a0a0a0;font-size:14px;">Aucune dette en cours</p>
        <a href="dettes.html" style="color:#185FA5;font-size:13px;margin-top:6px;display:block;">
          Ajouter une dette →
        </a>
      </div>`;
    return;
  }

  liste.innerHTML = dettes.map(d => `
    <div class="list-card">
      <div class="lc-left">
        <div class="lc-avatar red">${d.client.substring(0,2).toUpperCase()}</div>
        <div>
          <p class="lc-name">${d.client}</p>
          <p class="lc-sub">${d.produit}</p>
        </div>
      </div>
      <div class="lc-right">
        <p class="lc-amount red">${formaterMontant(d.montant)}</p>
        <p class="lc-days">${joursDepuis(d.date_creation)}</p>
      </div>
    </div>
  `).join('');
}

// ===== ONBOARDING =====
function afficherOnboarding() {
  const main = document.querySelector('.main-content');
  if (!main || document.getElementById('onboarding')) return;

  const onboarding = document.createElement('div');
  onboarding.id = 'onboarding';
  onboarding.innerHTML = `
    <div style="
      background: #E6F1FB;
      border: 1.5px dashed #378ADD;
      border-radius: 16px;
      padding: 1.25rem;
      margin-bottom: 1.25rem;
    ">
      <p style="font-size:14px;font-weight:600;color:#0C447C;margin-bottom:4px;">
        👋 Bienvenue ${user.nom ? user.nom.split(' ')[0] : ''} — Commence ici
      </p>
      <p style="font-size:12px;color:#185FA5;margin-bottom:1rem;">
        Enregistre ta première opération et ce message disparaîtra.
      </p>
      <div style="display:flex;gap:8px;">
        <a href="ventes.html" style="
          flex:1;padding:10px;background:#185FA5;
          color:#fff;border-radius:10px;font-size:12px;
          font-weight:500;text-decoration:none;text-align:center;
        ">+ Vente</a>
        <a href="dettes.html" style="
          flex:1;padding:10px;background:#185FA5;
          color:#fff;border-radius:10px;font-size:12px;
          font-weight:500;text-decoration:none;text-align:center;
        ">+ Dette</a>
        <a href="stocks.html" style="
          flex:1;padding:10px;background:#185FA5;
          color:#fff;border-radius:10px;font-size:12px;
          font-weight:500;text-decoration:none;text-align:center;
        ">+ Stock</a>
      </div>
    </div>

    <p style="
      font-size:11px;font-weight:500;color:#a0a0a0;
      letter-spacing:0.5px;text-transform:uppercase;
      margin-bottom:8px;
    ">Aperçu — exemple de dettes</p>

    <div style="
      border: 1.5px dashed #e8e8e8;
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 1.25rem;
      opacity: 0.5;
    ">
      <div class="list-card" style="pointer-events:none;">
        <div class="lc-left">
          <div class="lc-avatar red">AK</div>
          <div>
            <p class="lc-name">Exemple client</p>
            <p class="lc-sub">Produit acheté à crédit</p>
          </div>
        </div>
        <div class="lc-right">
          <p class="lc-amount red">-- F</p>
          <p class="lc-days">à compléter</p>
        </div>
      </div>
      <div class="list-card" style="pointer-events:none;">
        <div class="lc-left">
          <div class="lc-avatar blue">EX</div>
          <div>
            <p class="lc-name">Autre client</p>
            <p class="lc-sub">Autre produit</p>
          </div>
        </div>
        <div class="lc-right">
          <p class="lc-amount red">-- F</p>
          <p class="lc-days">à compléter</p>
        </div>
      </div>
    </div>
  `;

  const alertBar = main.querySelector('.alert-bar');
  if (alertBar) {
    alertBar.insertAdjacentElement('afterend', onboarding);
  } else {
    main.appendChild(onboarding);
  }
}
chargerDashboard();