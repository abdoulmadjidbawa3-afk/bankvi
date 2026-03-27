const API = window.location.origin + '/api';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': localStorage.getItem('bankvi_token') || ''
  };
}

function afficherDate() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const el = document.getElementById('nav-date');
  if (el) el.textContent = new Date().toLocaleDateString('fr-FR', options);
}
afficherDate();

const user = JSON.parse(localStorage.getItem('bankvi_user') || '{}');
const avatar = document.querySelector('.nav-avatar');
if (avatar && user.nom) {
  avatar.textContent = user.nom.substring(0, 2).toUpperCase();
}

function formaterMontant(montant) {
  return Number(montant).toLocaleString('fr-FR') + ' F';
}

function joursDepuis(dateStr) {
  const diff = Math.floor((new Date() - new Date(dateStr)) / 86400000);
  if (diff === 0) return "aujourd'hui";
  if (diff === 1) return 'hier';
  return `il y a ${diff} jours`;
}

async function chargerDashboard() {
  try {
    const res  = await fetch(`${API}/dashboard`, { headers: getHeaders() });
    const data = await res.json();

    // Hero card
    document.querySelector('.hero-amount').textContent = formaterMontant(data.ventes_jour);
    document.querySelector('.hero-sub').textContent    = data.ventes_count + ' ventes enregistrées';

    // Métriques
    const metriques = document.querySelectorAll('.metric-value');
    if (metriques[0]) metriques[0].textContent = formaterMontant(data.dettes_total);
    if (metriques[1]) metriques[1].textContent = data.stocks_critique;
    if (metriques[2]) metriques[2].textContent = formaterMontant(data.dettes_total - data.dettes_count * 1000); // exemple calcul bénéfice
    if (metriques[3]) metriques[3].textContent = '1'; // points de vente (à adapter)

    // Condition onboarding
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

    // Dettes récentes
    const resD   = await fetch(`${API}/dettes`, { headers: getHeaders() });
    const dettes = await resD.json();
    afficherDettesRecentes(dettes.filter(d => d.statut === 'en_cours').slice(0, 3));

  } catch(e) {
    console.log('Erreur dashboard', e);
  }
}

function afficherDettesRecentes(dettes) {
  const liste = document.querySelector('.cards-list');
  if (!liste) return;
  if (dettes.length === 0) {
    liste.innerHTML = `<div style="padding:1.5rem;text-align:center;">
      <p style="color:#a0a0a0;font-size:14px;">Aucune dette en cours</p>
      <a href="dettes.html" style="color:#185FA5;font-size:13px;margin-top:6px;display:block;">Ajouter une dette →</a>
    </div>`;
    return;
  }
  liste.innerHTML = dettes.map(d => `
    <div class="list-card">
      <div class="lc-left">
        <div class="lc-avatar red">${d.client.substring(0,2).toUpperCase()}</div>
        <div><p class="lc-name">${d.client}</p><p class="lc-sub">${d.produit}</p></div>
      </div>
      <div class="lc-right">
        <p class="lc-amount red">${formaterMontant(d.montant)}</p>
        <p class="lc-days">${joursDepuis(d.date_creation)}</p>
      </div>
    </div>`).join('');
}

chargerDashboard();