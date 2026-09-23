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

const priceNatEl = document.getElementById('priceNat');

if (priceNatEl) {
  const MONTHS_RU = [
    'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
    'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
  ];

  function formatUsd(value) {
    const rounded = Math.round(value);
    return `$${rounded.toLocaleString('ru-RU').replace(/\s/g, ' ')}`;
  }

  function formatMonthRu(month) {
    const match = /^(\d{4})-(\d{2})$/.exec(month);
    if (!match) return month;
    const [, year, monthNum] = match;
    const name = MONTHS_RU[Number(monthNum) - 1];
    return name ? `${name} ${year}` : month;
  }

  fetch('data/prices.json')
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      const priceLabEl = document.getElementById('priceLab');
      const priceRatioEl = document.getElementById('priceRatio');
      const priceMonthEl = document.getElementById('priceMonth');

      priceNatEl.textContent = formatUsd(data.natural_per_carat);
      if (priceLabEl) priceLabEl.textContent = formatUsd(data.lab_per_carat);
      if (priceRatioEl) priceRatioEl.textContent = data.ratio;
      if (priceMonthEl) priceMonthEl.textContent = formatMonthRu(data.month);
    })
    .catch(() => {
      // Leave the placeholder dashes in place.
    });
}
