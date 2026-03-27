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