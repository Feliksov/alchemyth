// Страница украшения: галерея, выбор металла и размера, характеристики камня, похожие.
// Корзина и избранное — следующий этап; пока кнопки только сообщают об этом.
(function () {
  'use strict';
  var S = window.Shop;
  var $ = function (id) { return document.getElementById(id); };

  var q = new URLSearchParams(location.search);
  var p = S.product(q.get('id')) || S.PRODUCTS[0];
  var cat = S.byId(S.CATEGORIES, p.cat);
  var state = { metal: S.byId(S.METALS, q.get('metal')) ? q.get('metal') : p.metal, view: 0 };
  var VIEWS = [
    { id: 'diamond', name: 'украшение' },
    { id: 'angle', name: 'вид сверху' },
    { id: 'macro', name: 'крупный план камня' }
  ];
  var phone = window.matchMedia('(max-width: 640px)');

  // ─── Галерея: на компьютере миниатюры, на телефоне листается пальцем с точками ───
  function renderGallery() {
    var g = $('gallery');
    g.innerHTML = VIEWS.map(function (v, i) {
      return '<img data-shape="' + p.shape + '" src="' + S.img(p, state.metal, v.id) + '" alt="' + S.esc(S.caption(p, state.metal) + ' — ' + v.name) + '" width="880" height="1100"' + (i ? ' loading="lazy"' : '') + '>';
    }).join('');
    g.scrollLeft = state.view * g.clientWidth;
    $('thumbs').innerHTML = VIEWS.map(function (v, i) {
      return '<button type="button" class="thumb" data-view="' + i + '" aria-label="' + v.name + '" aria-current="' + (i === state.view) + '">' +
        '<img data-shape="' + p.shape + '" src="' + S.img(p, state.metal, v.id, true) + '" alt="" width="88" height="88"></button>';
    }).join('');
    $('dots').innerHTML = VIEWS.map(function (v, i) { return '<i' + (i === state.view ? ' class="on"' : '') + '></i>'; }).join('');
  }
  function setView(i, scroll) {
    state.view = i;
    document.querySelectorAll('.thumb').forEach(function (t, k) { t.setAttribute('aria-current', String(k === i)); });
    document.querySelectorAll('#dots i').forEach(function (d, k) { d.classList.toggle('on', k === i); });
    if (scroll) { var g = $('gallery'); g.scrollTo({ left: i * g.clientWidth, behavior: 'smooth' }); }
  }
  var scrollTimer;
  $('gallery').addEventListener('scroll', function () {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function () {
      var g = $('gallery'), i = Math.round(g.scrollLeft / g.clientWidth);
      if (i !== state.view) setView(i, false);
    }, 60);
  });

  function renderMetal() {
    $('metals').innerHTML = S.METALS.map(function (m) {
      return '<button type="button" role="radio" class="metal-opt" data-metal="' + m.id + '" aria-checked="' + (state.metal === m.id) + '" aria-label="' + m.name + '">' +
        '<i class="swatch ' + m.id + '"></i>' + m.short + '</button>';
    }).join('');
    $('pSpec').textContent = S.caption(p, state.metal);
    var row = $('specs').querySelector('[data-row="metal"]');
    if (row) row.textContent = S.metalName(state.metal);
  }

  function renderStone() {
    $('stoneFig').innerHTML = window.Cuts.svg(p.shape);
    var rows = [
      ['Огранка', S.shapeName(p.shape)],
      ['Вес', S.fmtCt(p.ct)],
      ['Размер камня', S.stoneMM(p)],
      ['Происхождение', 'Выращен в лаборатории'],
      ['Оправа', p.setting],
      ['Металл', S.metalName(state.metal), 'metal']
    ];
    $('specs').innerHTML = rows.map(function (r) {
      return '<div class="spec"><dt>' + r[0] + '</dt><dd' + (r[2] ? ' data-row="' + r[2] + '"' : '') + '>' + r[1] + '</dd></div>';
    }).join('');
  }

  function renderSimilar() {
    var others = S.PRODUCTS.filter(function (x) { return x.id !== p.id; });
    function score(x) { return (x.shape === p.shape ? 2 : 0) + (x.setting === p.setting ? 2 : 0) + (x.ct === p.ct ? 1 : 0); }
    others.sort(function (a, b) { return score(b) - score(a) || a.rank - b.rank; });
    $('similarGrid').innerHTML = others.slice(0, 4).map(function (x) { return S.card(x); }).join('');
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-view]');
    if (t) { setView(+t.getAttribute('data-view'), true); return; }
    var m = e.target.closest('[data-metal]');
    if (m) {
      state.metal = m.getAttribute('data-metal');
      renderMetal(); renderGallery();
      history.replaceState(null, '', '?id=' + p.id + (state.metal !== p.metal ? '&metal=' + state.metal : ''));
      return;
    }
    if (e.target.closest('#sizeHelpBtn')) {
      var open = $('sizeHelp').hidden;
      $('sizeHelp').hidden = !open;
      $('sizeHelpBtn').setAttribute('aria-expanded', String(open));
      return;
    }
    if (e.target.closest('[data-cart]') || e.target.closest('[data-fav]')) {
      $('buyNote').hidden = false;
      if (phone.matches) $('buyNote').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  // На телефоне характеристики камня свёрнуты, на компьютере всегда раскрыты.
  function syncStone() { $('stoneDetails').open = !phone.matches; }
  if (phone.addEventListener) phone.addEventListener('change', syncStone);
  $('stoneDetails').addEventListener('toggle', function () { if (!phone.matches && !this.open) this.open = true; });

  document.title = p.name + ' — ' + S.caption(p) + ' — Alchemyth';
  var desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', S.caption(p) + '. Выращенный бриллиант.');
  $('crumbCat').textContent = cat.name;
  $('crumbCat').href = 'catalog.html?cat=' + cat.id;
  $('pName').textContent = p.name;
  $('pPrice').textContent = S.fmtPrice(p.price);
  $('barPrice').textContent = S.fmtPrice(p.price);

  renderStone(); renderMetal(); renderGallery(); renderSimilar(); syncStone();
})();
