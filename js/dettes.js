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