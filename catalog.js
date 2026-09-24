// Каталог: категории, фильтры с метками, сортировка, «Показать ещё».
// На телефоне фильтры и сортировка открываются нижней панелью.
(function () {
  'use strict';
  var S = window.Shop;
  var PAGE = 8;       // карточек за один показ
  var PROMO_EVERY = 12;

  var prices = S.PRODUCTS.map(function (p) { return p.price; });
  var PRICE = { min: Math.floor(Math.min.apply(null, prices) / 10000) * 10000, max: Math.ceil(Math.max.apply(null, prices) / 10000) * 10000, step: 5000 };
  var CT = { min: 0.5, max: 3, step: 0.1 };

  var GROUPS = [
    { id: 'shape', name: 'Форма камня' },
    { id: 'ct', name: 'Вес' },
    { id: 'metal', name: 'Металл' },
    { id: 'price', name: 'Цена' }
  ];
  var SORTS = [
    { id: 'new', name: 'По новизне' }, { id: 'asc', name: 'По цене вверх' },
    { id: 'desc', name: 'По цене вниз' }, { id: 'ct', name: 'По весу камня' }
  ];

  var params = new URLSearchParams(location.search);
  var state = {
    cat: S.byId(S.CATEGORIES, params.get('cat')) ? params.get('cat') : 'all',
    shape: [], ct: null, metal: null, price: null, sort: 'new', shown: PAGE
  };

  var $ = function (id) { return document.getElementById(id); };

  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
  }
  function fmtRub(n) { return S.fmtPrice(n); }
  function ctText(r) { return S.fmtNum(r[0]) + '–' + S.fmtNum(r[1]) + ' карата'; }
  function priceText(r) { return fmtRub(r[0]).replace(' ₽', '') + ' – ' + fmtRub(r[1]); }
  function activeIn(g) {
    if (g === 'shape') return state.shape.length;
    return state[g] ? 1 : 0;
  }
  function activeCount() { return GROUPS.reduce(function (n, g) { return n + activeIn(g.id); }, 0); }

  // ─── Разметка фильтров ───
  function shapesHTML() {
    return '<div class="opts shapes" role="group" aria-label="Форма камня">' + S.SHAPES.map(function (s) {
      return '<button type="button" class="opt" data-g="shape" data-v="' + s.id + '" aria-pressed="' + (state.shape.indexOf(s.id) !== -1) + '">' +
        window.Cuts.svg(s.id) + '<span>' + s.name + '</span></button>';
    }).join('') + '</div>';
  }
  function metalsHTML() {
    return '<div class="opts metals-f" role="group" aria-label="Металл">' + S.METALS.map(function (m) {
      return '<button type="button" class="metal-opt" data-g="metal" data-v="' + m.id + '" aria-pressed="' + (state.metal === m.id) + '">' +
        '<i class="swatch ' + m.id + '"></i>' + m.short + '</button>';
    }).join('') + '</div>';
  }
  function rangeHTML(g, R, fmt) {
    var v = state[g] || [R.min, R.max];
    return '<div class="range" data-range="' + g + '">' +
      '<div class="range-vals"><span data-lo>' + fmt(v[0]) + '</span><span data-hi>' + fmt(v[1]) + '</span></div>' +
      '<div class="range-track"><div class="range-fill"></div>' +
        '<input type="range" data-g="' + g + '" data-end="0" min="' + R.min + '" max="' + R.max + '" step="' + R.step + '" value="' + v[0] + '" aria-label="' + (g === 'ct' ? 'Вес от' : 'Цена от') + '">' +
        '<input type="range" data-g="' + g + '" data-end="1" min="' + R.min + '" max="' + R.max + '" step="' + R.step + '" value="' + v[1] + '" aria-label="' + (g === 'ct' ? 'Вес до' : 'Цена до') + '">' +
      '</div></div>';
  }
  var fmtCtVal = function (x) { return S.fmtCt(+x); };
  var fmtPriceVal = function (x) { return fmtRub(+x); };
  function groupHTML(g) {
    if (g === 'shape') return shapesHTML();
    if (g === 'metal') return metalsHTML();
    if (g === 'ct') return rangeHTML('ct', CT, fmtCtVal);
    return rangeHTML('price', PRICE, fmtPriceVal);
  }
  function sortHTML() {
    return '<div class="opts list" role="group" aria-label="Сортировка">' + SORTS.map(function (o) {
      return '<button type="button" class="opt" data-g="sort" data-v="' + o.id + '" aria-pressed="' + (state.sort === o.id) + '">' + o.name + '</button>';
    }).join('') + '</div>';
  }
  function syncFill(root) {
    root.querySelectorAll('[data-range]').forEach(function (r) {
      var ins = r.querySelectorAll('input'), lo = +ins[0].value, hi = +ins[1].value, min = +ins[0].min, max = +ins[0].max;
      var fill = r.querySelector('.range-fill');
      fill.style.left = (lo - min) / (max - min) * 100 + '%';
      fill.style.right = (max - hi) / (max - min) * 100 + '%';
    });
  }

  // ─── Выборка ───
  function results() {
    var list = S.PRODUCTS.filter(function (p) {
      if (state.cat !== 'all' && p.cat !== state.cat) return false;
      if (state.shape.length && state.shape.indexOf(p.shape) === -1) return false;
      if (state.ct && (p.ct < state.ct[0] - 1e-9 || p.ct > state.ct[1] + 1e-9)) return false;
      if (state.price && (p.price < state.price[0] || p.price > state.price[1])) return false;
      return true;
    });
    var by = {
      'new': function (a, b) { return a.rank - b.rank; },
      asc: function (a, b) { return a.price - b.price; },
      desc: function (a, b) { return b.price - a.price; },
      ct: function (a, b) { return b.ct - a.ct || a.price - b.price; }
    };
    return list.sort(by[state.sort]);
  }

  // ─── Отрисовка ───
  function renderHead() {
    var items = [{ id: 'all', name: 'Все' }].concat(S.CATEGORIES);
    $('cats').innerHTML = items.map(function (c) {
      return '<a href="catalog.html' + (c.id === 'all' ? '' : '?cat=' + c.id) + '" data-cat="' + c.id + '"' +
        (state.cat === c.id ? ' class="active" aria-current="page"' : '') + '>' + c.name + '</a>';
    }).join('');
    var cat = S.byId(S.CATEGORIES, state.cat);
    $('catTitle').textContent = cat ? cat.name : 'Украшения';
    $('crumbHere').textContent = cat ? cat.name : 'Каталог';
    document.title = (cat ? cat.name : 'Каталог') + ' — Alchemyth';
  }

  function renderBar() {
    var open = document.querySelector('.fdrop.open');
    var openId = open && open.getAttribute('data-g');
    $('fbarFilters').innerHTML = GROUPS.map(function (g) {
      var n = activeIn(g.id);
      return '<div class="fdrop' + (openId === g.id ? ' open' : '') + '" data-g="' + g.id + '">' +
        '<button type="button" aria-expanded="' + (openId === g.id) + '">' + g.name +
        (n ? '<span class="count">' + n + '</span>' : '') + '<i class="chev"></i></button>' +
        '<div class="fpop">' + groupHTML(g.id) + '</div></div>';
    }).join('');
    var sd = $('sortDrop');
    sd.innerHTML = '<button type="button" aria-expanded="' + (openId === 'sort') + '">' + S.byId(SORTS, state.sort).name + '<i class="chev"></i></button>' +
      '<div class="fpop">' + sortHTML() + '</div>';
    sd.classList.toggle('open', openId === 'sort');
    syncFill($('fbarFilters'));
    var n = activeCount();
    $('openFilters').textContent = n ? 'Фильтры · ' + n : 'Фильтры';
  }

  function renderChips() {
    var chips = [];
    state.shape.forEach(function (s) { chips.push({ g: 'shape', v: s, t: S.shapeName(s) }); });
    if (state.ct) chips.push({ g: 'ct', t: 'Вес: ' + ctText(state.ct) });
    if (state.metal) chips.push({ g: 'metal', t: S.metalName(state.metal) });
    if (state.price) chips.push({ g: 'price', t: 'Цена: ' + priceText(state.price) });
    $('chips').innerHTML = chips.length ? chips.map(function (c) {
      return '<button type="button" class="chip" data-chip="' + c.g + '"' + (c.v ? ' data-v="' + c.v + '"' : '') + ' aria-label="Убрать: ' + c.t + '">' + c.t + '<i></i></button>';
    }).join('') + '<button type="button" class="link-quiet" data-reset>Сбросить всё</button>' : '';
  }

  function promoHTML() {
    return '<aside class="promo">' +
      '<div class="promo-copy"><h2>Соберите своё кольцо</h2><p>Оправа, огранка, вес и металл — на ваш выбор.</p>' +
      '<a class="btn btn-primary shine" href="constructor.html">Открыть конструктор</a></div>' +
      '<div class="cuts-row" aria-hidden="true">' + window.Cuts.SHAPES.map(window.Cuts.svg).join('') + '</div>' +
    '</aside>';
  }

  function renderGrid() {
    var list = results();
    var cat = S.byId(S.CATEGORIES, state.cat);
    var inCat = S.PRODUCTS.some(function (p) { return state.cat === 'all' || p.cat === state.cat; });
    var html = '';
    list.slice(0, state.shown).forEach(function (p, i) {
      html += S.card(p, state.metal);
      if ((i + 1) % PROMO_EVERY === 0) html += promoHTML();
    });
    $('grid').innerHTML = html;
    $('grid').hidden = !list.length;
    $('moreRow').hidden = list.length <= state.shown;
    $('count').textContent = list.length + ' ' + plural(list.length, 'позиция', 'позиции', 'позиций');
    $('empty').hidden = !!list.length;
    if (!list.length) {
      $('empty').innerHTML = inCat
        ? '<h3>Ничего не нашлось</h3><p>Попробуйте убрать часть фильтров.</p><div class="empty-cta"><button type="button" class="btn btn-ghost shine" data-reset>Сбросить всё</button></div>'
        : '<h3>' + cat.name + ' пока не в каталоге</h3><p>Сейчас в каталоге только кольца.</p>' +
          '<div class="empty-cta"><a class="btn btn-ghost shine" href="catalog.html?cat=rings" data-cat="rings">Смотреть кольца</a>' +
          '<a class="btn btn-primary shine" href="constructor.html">Собрать кольцо</a></div>';
    }
    $('sheetApply').textContent = list.length ? 'Показать ' + list.length : 'Ничего не найдено';
  }

  function renderSheet() {
    var mode = $('sheet').getAttribute('data-mode');
    $('sheetTitle').textContent = mode === 'sort' ? 'Сортировка' : 'Фильтры';
    $('sheetBody').innerHTML = mode === 'sort' ? sortHTML()
      : GROUPS.map(function (g) { return '<div class="sgroup"><p class="label">' + g.name + '</p>' + groupHTML(g.id) + '</div>'; }).join('');
    syncFill($('sheetBody'));
  }

  function render() {
    renderHead(); renderBar(); renderChips(); renderGrid();
    if ($('sheet').classList.contains('open')) renderSheet();
  }
  // Во время перетаскивания ползунка не перерисовываем сам ползунок.
  function renderResults() {
    renderChips(); renderGrid();
    GROUPS.forEach(function (g) {
      var btn = document.querySelector('.fdrop[data-g="' + g.id + '"] > button');
      if (!btn) return;
      var n = activeIn(g.id), c = btn.querySelector('.count');
      if (!n) { if (c) c.remove(); return; }
      if (!c) { c = document.createElement('span'); c.className = 'count'; btn.insertBefore(c, btn.querySelector('.chev')); }
      c.textContent = n;
    });
    var total = activeCount();
    $('openFilters').textContent = total ? 'Фильтры · ' + total : 'Фильтры';
  }

  function reset() { state.shape = []; state.ct = null; state.metal = null; state.price = null; state.shown = PAGE; render(); }

  function toggle(g, v) {
    if (g === 'sort') state.sort = v;
    else if (g === 'shape') {
      var i = state.shape.indexOf(v);
      if (i === -1) state.shape.push(v); else state.shape.splice(i, 1);
    } else if (g === 'metal') state.metal = state.metal === v ? null : v;
    state.shown = PAGE;
    render();
  }

  function onRange(input) {
    var g = input.getAttribute('data-g'), box = input.closest('[data-range]');
    var ins = box.querySelectorAll('input'), R = g === 'ct' ? CT : PRICE;
    var lo = +ins[0].value, hi = +ins[1].value;
    if (lo > hi) { if (input === ins[0]) { ins[0].value = hi; lo = hi; } else { ins[1].value = lo; hi = lo; } }
    lo = Math.round(lo * 10) / 10; hi = Math.round(hi * 10) / 10;
    state[g] = lo <= R.min && hi >= R.max ? null : [lo, hi];
    var fmt = g === 'ct' ? fmtCtVal : fmtPriceVal;
    box.querySelector('[data-lo]').textContent = fmt(lo);
    box.querySelector('[data-hi]').textContent = fmt(hi);
    syncFill(box.parentElement);
    state.shown = PAGE;
    renderResults();
  }

  // ─── Панель снизу ───
  function openSheet(mode) {
    $('sheet').setAttribute('data-mode', mode);
    renderSheet();
    $('sheet').classList.add('open');
    $('sheetOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeSheet() {
    $('sheet').classList.remove('open');
    $('sheetOverlay').classList.remove('open');
    document.body.style.overflow = '';
  }
  function closeDrops() {
    document.querySelectorAll('.fdrop.open').forEach(function (d) { d.classList.remove('open'); d.firstElementChild.setAttribute('aria-expanded', 'false'); });
  }

  document.addEventListener('input', function (e) { if (e.target.matches('.range input')) onRange(e.target); });
  document.addEventListener('click', function (e) {
    var opt = e.target.closest('[data-g][data-v]');
    if (opt) {
      var g = opt.getAttribute('data-g');
      toggle(g, opt.getAttribute('data-v'));
      if (g === 'sort') { closeDrops(); if ($('sheet').getAttribute('data-mode') === 'sort') closeSheet(); }
      return;
    }
    var chip = e.target.closest('[data-chip]');
    if (chip) {
      var cg = chip.getAttribute('data-chip');
      if (cg === 'shape') state.shape.splice(state.shape.indexOf(chip.getAttribute('data-v')), 1);
      else state[cg] = null;
      state.shown = PAGE; render(); return;
    }
    if (e.target.closest('[data-reset]')) { reset(); return; }
    var catLink = e.target.closest('a[data-cat]');
    if (catLink && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      state.cat = catLink.getAttribute('data-cat'); state.shown = PAGE;
      history.pushState(null, '', catLink.getAttribute('href'));
      render(); return;
    }
    var dropBtn = e.target.closest('.fdrop > button');
    if (dropBtn) {
      var d = dropBtn.parentElement, wasOpen = d.classList.contains('open');
      closeDrops();
      if (!wasOpen) { d.classList.add('open'); dropBtn.setAttribute('aria-expanded', 'true'); }
      return;
    }
    if (!e.target.closest('.fpop')) closeDrops();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeDrops(); closeSheet(); } });
  window.addEventListener('popstate', function () {
    var c = new URLSearchParams(location.search).get('cat');
    state.cat = S.byId(S.CATEGORIES, c) ? c : 'all'; state.shown = PAGE; render();
  });

  $('more').addEventListener('click', function () { state.shown += PAGE; renderGrid(); });
  $('openFilters').addEventListener('click', function () { openSheet('filters'); });
  $('openSort').addEventListener('click', function () { openSheet('sort'); });
  $('sheetClose').addEventListener('click', closeSheet);
  $('sheetApply').addEventListener('click', closeSheet);
  $('sheetOverlay').addEventListener('click', closeSheet);

  // Полоса фильтров липнет под шапкой и ужимается до 48px.
  var sentinel = document.createElement('div');
  $('fbarWrap').before(sentinel);
  var headerH = function () { return document.querySelector('header').offsetHeight; };
  var io = new IntersectionObserver(function (entries) {
    $('fbarWrap').classList.toggle('stuck', !entries[0].isIntersecting && entries[0].boundingClientRect.top < headerH() + 1);
  }, { rootMargin: '-' + (headerH() + 1) + 'px 0px 0px 0px' });
  io.observe(sentinel);

  render();
})();
