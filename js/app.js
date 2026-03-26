// ===== DATE AUTOMATIQUE =====
function afficherDate() {
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  const date = new Date().toLocaleDateString('fr-FR', options);
  const el = document.getElementById('nav-date');
  if (el) el.textContent = date;
}

afficherDate();

// ===== AFFICHER NOM COMMERÇANT =====
const user = JSON.parse(localStorage.getItem('bankvi_user') || '{}');
const avatar = document.querySelector('.nav-avatar');
if (avatar && user.nom) {
  avatar.textContent = user.nom.substring(0, 2).toUpperCase();
}
// ===== SIDEBAR DESKTOP =====
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

// ===== CHARGER DASHBOARD =====
async function chargerDashboard() {
  const hero = document.querySelector('.hero-amount');
  if (!hero) return;

  try {
const res = await fetch(window.location.origin + '/api/dashboard');
    const data = await res.json();

    // Hero
    document.querySelector('.hero-amount').textContent = formaterMontant(data.ventes_jour);
    document.querySelector('.hero-sub').textContent = data.ventes_count + ' ventes enregistrées';

    // Métriques
    const metriques = document.querySelectorAll('.metric-value');
    if (metriques[0]) metriques[0].textContent = formaterMontant(data.dettes_total);
    if (metriques[1]) metriques[1].textContent = data.stocks_critique;
    if (metriques[2]) metriques[2].textContent = formaterMontant(0);
    if (metriques[3]) metriques[3].textContent = '1';

    // Dettes récentes
    const resD = await fetch('http://localhost:3000/api/dettes');
    const dettes = await resD.json();
    afficherDettesRecentes(dettes.slice(0, 3));

  } catch(e) {
    console.log('Serveur non disponible — mode aperçu');
  }
}

function afficherDettesRecentes(dettes) {
  const liste = document.querySelector('.cards-list');
  if (!liste || dettes.length === 0) return;

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
        <p class="lc-days">${new Date(d.date_creation).toLocaleDateString('fr-FR')}</p>
      </div>
    </div>
  `).join('');
}

chargerDashboard();