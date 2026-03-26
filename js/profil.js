const API = window.location.origin + '/api';

// ===== TOGGLE =====
function basculerToggle(el) {
  el.classList.toggle('on');
}

// ===== CHARGER INFOS UTILISATEUR =====
const user = JSON.parse(localStorage.getItem('bankvi_user') || '{}');

function chargerProfil() {
  if (!user.nom) return;

  // Avatar et nom
  const avatar = document.querySelector('.profil-avatar');
  if (avatar) avatar.textContent = user.nom.substring(0, 2).toUpperCase();

  const nom = document.querySelector('.profil-name');
  if (nom) nom.textContent = user.nom;

  const shop = document.querySelector('.profil-shop');
  if (shop) shop.textContent = (user.boutique || 'Ma boutique') + ' — Lomé, Togo';

  // Avatar navbar
  const navAvatar = document.querySelector('.nav-avatar');
  if (navAvatar) navAvatar.textContent = user.nom.substring(0, 2).toUpperCase();

  chargerStats();
}

async function chargerStats() {
  try {
    const res  = await fetch(`${API}/dashboard`);
    const data = await res.json();

    const vals = document.querySelectorAll('.sc-val');
    if (vals[0]) vals[0].textContent = Number(data.ventes_jour).toLocaleString('fr-FR') + ' F';
    if (vals[1]) vals[1].textContent = data.ventes_count || 0;

    const resS = await fetch(`${API}/stocks`);
    const stk  = await resS.json();
    if (vals[2]) vals[2].textContent = stk.length;

  } catch(e) {
    console.log('Erreur stats profil');
  }
}

// ===== DÉCONNEXION =====
const btnLogout = document.querySelector('.btn-logout');
if (btnLogout) {
  btnLogout.addEventListener('click', () => {
    if (confirm('Tu veux vraiment te déconnecter ?')) {
      localStorage.removeItem('bankvi_token');
      localStorage.removeItem('bankvi_user');
      window.location.href = 'login.html';
    }
  });
}

chargerProfil();