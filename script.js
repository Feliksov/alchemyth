const burgerBtn = document.getElementById('burgerBtn');
const drawerClose = document.getElementById('drawerClose');
const drawer = document.getElementById('drawer');
const overlay = document.getElementById('overlay');

function openDrawer() {
  drawer.classList.add('open');
  overlay.classList.add('open');
}

function closeDrawer() {
  drawer.classList.remove('open');
  overlay.classList.remove('open');
}

burgerBtn.addEventListener('click', openDrawer);
drawerClose.addEventListener('click', closeDrawer);
overlay.addEventListener('click', closeDrawer);

document.querySelectorAll('.drawer-nav a').forEach((link) => {
  link.addEventListener('click', closeDrawer);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDrawer();
});
