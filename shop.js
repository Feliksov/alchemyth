// Общие данные магазина и карточка украшения.
// Подключается на главной, в каталоге и на странице украшения, после cuts.js.
(function () {
  'use strict';

  // Демонстрационные позиции. Фото — рендеры тех же оправ, что в конструкторе.
  // Порядок — от новых к старым; по нему работает сортировка «по новизне».
  var PRODUCTS = [
    { id: 'nova', name: 'Паве с грушей', cat: 'rings', setting: 'Паве', shape: 'pear', ct: 1, metal: 'white', price: 112000 },
    { id: 'lumen', name: 'Гало с овалом', cat: 'rings', setting: 'Гало', shape: 'oval', ct: 1, metal: 'yellow', price: 128000 },
    { id: 'aurora', name: 'Солитер с круглым камнем', cat: 'rings', setting: 'Солитер', shape: 'round', ct: 1, metal: 'rose', price: 94000 },
    { id: 'vela', name: 'Трилогия', cat: 'rings', setting: 'Трилогия', shape: 'round', ct: 1, metal: 'white', price: 146000 },
    { id: 'selene', name: 'Бизель с эмеральдом', cat: 'rings', setting: 'Бизель', shape: 'emerald', ct: 1, metal: 'yellow', price: 98000 },
    { id: 'iris', name: 'Катедрал с кушоном', cat: 'rings', setting: 'Катедрал', shape: 'cushion', ct: 1, metal: 'white', price: 104000 },
    { id: 'mira', name: 'Винтаж с овалом', cat: 'rings', setting: 'Винтаж', shape: 'oval', ct: 0.5, metal: 'rose', price: 72000 },
    { id: 'solis', name: 'Солитер с принцессой', cat: 'rings', setting: 'Солитер', shape: 'princess', ct: 2, metal: 'white', price: 184000 },
    { id: 'faro', name: 'Двойное гало с кушоном', cat: 'rings', setting: 'Двойное гало', shape: 'cushion', ct: 2, metal: 'white', price: 236000 },
    { id: 'orin', name: 'Тенсион', cat: 'rings', setting: 'Тенсион', shape: 'round', ct: 0.5, metal: 'yellow', price: 68000 },
    { id: 'echo', name: 'Кластер с грушей', cat: 'rings', setting: 'Кластер', shape: 'pear', ct: 0.5, metal: 'rose', price: 76000 },
    { id: 'lyra', name: 'Солитер с овалом', cat: 'rings', setting: 'Солитер', shape: 'oval', ct: 3, metal: 'white', price: 289000 }
  ];
  PRODUCTS.forEach(function (p, i) { p.rank = i; });

  var CATEGORIES = [
    { id: 'rings', name: 'Кольца', one: 'Кольцо' },
    { id: 'earrings', name: 'Серьги', one: 'Серьги' },
    { id: 'pendants', name: 'Подвески', one: 'Подвеска' },
    { id: 'bracelets', name: 'Браслеты', one: 'Браслет' }
  ];

  var METALS = [
    { id: 'white', name: 'Белое золото', short: 'белое' },
    { id: 'yellow', name: 'Жёлтое золото', short: 'жёлтое' },
    { id: 'rose', name: 'Розовое золото', short: 'розовое' }
  ];

  var SHAPES = [
    { id: 'round', name: 'Круг', with: 'с круглым камнем' },
    { id: 'oval', name: 'Овал', with: 'с овалом' },
    { id: 'pear', name: 'Груша', with: 'с грушей' },
    { id: 'emerald', name: 'Эмеральд', with: 'с эмеральдом' },
    { id: 'princess', name: 'Принцесса', with: 'с принцессой' },
    { id: 'cushion', name: 'Кушон', with: 'с кушоном' }
  ];

  // Размер камня в миллиметрах для одного карата; растёт как кубический корень веса.
  var MM_1CT = { round: [6.5, 6.5], oval: [7.7, 5.7], pear: [8.5, 5.5], emerald: [7.0, 5.0], princess: [5.5, 5.5], cushion: [6.0, 6.0] };

  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function product(id) { return byId(PRODUCTS, id); }
  function shapeName(id) { return byId(SHAPES, id).name; }
  function metalName(id) { return byId(METALS, id).name; }

  function fmtPrice(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'; }
  function fmtNum(n) { return String(n).replace('.', ','); }
  function fmtCt(ct) { return fmtNum(ct) + ' ' + (ct === 1 ? 'карат' : 'карата'); }
  // «Груша · 1 кт · белое золото» — в карточке одной строкой, поэтому карат сокращён
  function spec(p, metal) { return shapeName(p.shape) + ' · ' + fmtNum(p.ct) + '\u00a0кт · ' + metalName(metal || p.metal).toLowerCase(); }
  // «Кольцо с грушей, 1 карат, белое золото»
  function caption(p, metal) {
    return byId(CATEGORIES, p.cat).one + ' ' + byId(SHAPES, p.shape).with + ', ' + fmtCt(p.ct) + ', ' + metalName(metal || p.metal).toLowerCase();
  }
  function stoneMM(p) {
    var k = Math.cbrt(p.ct), d = MM_1CT[p.shape];
    var a = (d[0] * k).toFixed(1).replace('.', ','), b = (d[1] * k).toFixed(1).replace('.', ',');
    return p.shape === 'round' ? '≈ ' + a + ' мм' : '≈ ' + a + ' × ' + b + ' мм';
  }
  // Кадры: diamond — основной, angle — сверху, macro — крупный план камня.
  function img(p, metal, view, small) { return 'img/products/' + p.id + '_' + (metal || p.metal) + '_' + (view || 'diamond') + (small ? '-s' : '') + '.webp'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ─── Карточка украшения ───
  // Второй кадр при наведении — то же кольцо сверху.
  var SIZES = '(max-width: 640px) 72vw, (max-width: 1024px) 33vw, 300px';
  function picture(p, metal, view, cls, alt) {
    return '<img class="' + cls + '" data-shape="' + p.shape + '" src="' + img(p, metal, view, true) + '" srcset="' + img(p, metal, view, true) + ' 440w, ' + img(p, metal, view) + ' 880w" sizes="' + SIZES + '" alt="' + esc(alt) + '" loading="lazy" width="440" height="550">';
  }
  function card(p, metal) {
    metal = metal || p.metal;
    return '<a class="pcard shine" href="product.html?id=' + p.id + (metal !== p.metal ? '&metal=' + metal : '') + '">' +
      '<div class="pcard-media">' + picture(p, metal, 'diamond', 'main', caption(p, metal)) + picture(p, metal, 'angle', 'alt', '') + '</div>' +
      '<div class="pcard-body">' +
        '<h3 class="pcard-name">' + esc(p.name) + '</h3>' +
        '<p class="pcard-spec">' + esc(spec(p, metal)) + '</p>' +
        '<span class="pcard-price">' + fmtPrice(p.price) + '</span>' +
        '<span class="metal-dots" aria-label="' + metalName(metal) + '">' +
          METALS.map(function (m) { return '<i class="metal-dot ' + m.id + (m.id === metal ? ' on' : '') + '"></i>'; }).join('') +
        '</span>' +
      '</div>' +
    '</a>';
  }

  window.Shop = {
    PRODUCTS: PRODUCTS, CATEGORIES: CATEGORIES, METALS: METALS, SHAPES: SHAPES,
    product: product, byId: byId, shapeName: shapeName, metalName: metalName,
    fmtPrice: fmtPrice, fmtNum: fmtNum, fmtCt: fmtCt, spec: spec, caption: caption, stoneMM: stoneMM,
    img: img, esc: esc, card: card
  };

  // Если фото ещё нет, на его месте встаёт контур огранки этого камня.
  document.addEventListener('error', function (e) {
    var im = e.target;
    if (im.tagName !== 'IMG' || !im.hasAttribute('data-shape') || !window.Cuts) return;
    var ph = document.createElement('span');
    ph.className = 'ph ' + im.className;
    if (im.alt) { ph.setAttribute('role', 'img'); ph.setAttribute('aria-label', im.alt); }
    ph.innerHTML = window.Cuts.svg(im.getAttribute('data-shape'));
    im.replaceWith(ph);
  }, true);

  // <div data-products="nova,lumen"> заполняется карточками.
  function fillProducts() {
    document.querySelectorAll('[data-products]').forEach(function (el) {
      el.innerHTML = el.getAttribute('data-products').split(',').map(function (id) {
        var p = product(id.trim()); return p ? card(p) : '';
      }).join('');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fillProducts);
  else fillProducts();
})();
