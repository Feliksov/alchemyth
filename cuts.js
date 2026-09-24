// Шесть контуров огранок одним набором: вид сверху, латунная линия 1px, разметка граней.
// Cuts.svg('oval') возвращает разметку; элементы с [data-cut="oval"] заполняются сами.
(function () {
  'use strict';
  var C = 24;
  function P(x, y) { return [C + x, C + y]; }
  function pt(p) { return p[0].toFixed(2) + ' ' + p[1].toFixed(2); }
  function poly(pts, closed) { return 'M' + pts.map(pt).join(' L') + (closed ? ' Z' : ''); }
  function line(a, b) { return 'M' + pt(a) + ' L' + pt(b); }
  function toward(c, p, k) { return [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k]; }

  // Точка контура по параметру t (0 — верх, по часовой стрелке).
  var OUTLINE = {
    round: function (t) { return P(19 * Math.sin(t), -19 * Math.cos(t)); },
    oval: function (t) { return P(13.5 * Math.sin(t), -19.5 * Math.cos(t)); },
    cushion: function (t) {
      var s = Math.sin(t), c = Math.cos(t), n = 3.2;
      var r = 18.5 / Math.pow(Math.pow(Math.abs(s), n) + Math.pow(Math.abs(c), n), 1 / n);
      return P(r * s, -r * c);
    },
    pear: function (t) { return P(15.6 * Math.sin(t) * Math.sin(t / 2), -20 * Math.cos(t) + 1); }
  };
  var CENTER = { round: P(0, 0), oval: P(0, 0), cushion: P(0, 0), pear: P(0, 5) };

  // Бриллиантовая огранка: площадка-восьмиугольник, звёзды, клинья и верхние грани рундиста.
  function brilliant(shape) {
    var f = OUTLINE[shape], c = CENTER[shape], N = 8, outline = [], T = [], S = [], G = [], H = [];
    for (var i = 0; i < 96; i++) outline.push(f(i / 96 * Math.PI * 2));
    for (var k = 0; k < N; k++) {
      var tk = k / N * Math.PI * 2, mk = tk + Math.PI / N;
      T.push(toward(c, f(tk), 0.44)); S.push(toward(c, f(mk), 0.7));
      G.push(f(tk)); H.push(f(mk));
    }
    var facets = [poly(T, true)];
    for (k = 0; k < N; k++) {
      var k1 = (k + 1) % N;
      facets.push(poly([T[k], S[k], T[k1]]), line(T[k], G[k]), poly([G[k], S[k], G[k1]]), line(S[k], H[k]));
    }
    return '<path d="' + poly(outline, true) + '"/><path class="facet" d="' + facets.join(' ') + '"/>';
  }

  // Эмеральд: ступенчатая огранка — вложенные восьмиугольники и угловые рёбра.
  function emerald() {
    function oct(a, b, cc) {
      return [P(-a + cc, -b), P(a - cc, -b), P(a, -b + cc), P(a, b - cc), P(a - cc, b), P(-a + cc, b), P(-a, b - cc), P(-a, -b + cc)];
    }
    var o = oct(13.5, 19, 4.5), m = oct(10, 15.5, 3.4), t = oct(6.5, 12, 2.2);
    var facets = [poly(m, true), poly(t, true)];
    for (var i = 0; i < 8; i++) facets.push(line(o[i], t[i]));
    return '<path d="' + poly(o, true) + '"/><path class="facet" d="' + facets.join(' ') + '"/>';
  }

  // Принцесса: квадрат, площадка и рёбра к углам и серединам сторон.
  function princess() {
    function sq(h) { return [P(-h, -h), P(h, -h), P(h, h), P(-h, h)]; }
    var o = sq(17), t = sq(8.5), mid = [P(0, -17), P(17, 0), P(0, 17), P(-17, 0)];
    var facets = [poly(t, true)];
    for (var i = 0; i < 4; i++) facets.push(line(o[i], t[i]), line(mid[i], t[i]), line(mid[i], t[(i + 1) % 4]));
    facets.push(line(t[0], t[2]), line(t[1], t[3]));
    return '<path d="' + poly(o, true) + '"/><path class="facet" d="' + facets.join(' ') + '"/>';
  }

  var cache = {};
  function svg(shape) {
    if (!cache[shape]) cache[shape] = shape === 'emerald' ? emerald() : shape === 'princess' ? princess() : brilliant(shape);
    return '<svg class="cut" viewBox="0 0 48 48" aria-hidden="true">' + cache[shape] + '</svg>';
  }
  function fill(root) {
    (root || document).querySelectorAll('[data-cut]').forEach(function (el) {
      if (!el.querySelector('.cut')) el.insertAdjacentHTML('afterbegin', svg(el.getAttribute('data-cut')));
    });
  }

  window.Cuts = { svg: svg, fill: fill, SHAPES: ['round', 'oval', 'pear', 'emerald', 'princess', 'cushion'] };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { fill(); });
  else fill();
})();
