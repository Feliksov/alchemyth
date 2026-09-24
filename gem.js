// Faceted diamond as a technical-drawing / blueprint object: transparent
// faces, brass wireframe edges, no transmission/IOR/dispersion, no specular
// glints. The geometry is what carries the piece — many small facets, seen
// through each other. Reused by gem.html and index.html.

import * as THREE from 'three';

const PAPER = '#FAF7F0';
const BRASS = '#B08D57';
const INK = '#1C1712';

function isMobile() {
  return window.matchMedia('(max-width: 760px)').matches ||
    (navigator.maxTouchPoints > 1 && window.innerWidth < 900);
}

// --- Geometry: many-tier faceted diamond, checkerboard-offset rings (a
// real brilliant's kite/star pattern), not a lathe body of revolution.
// More tiers than a gemologically-accurate cut on purpose — the brief here
// is "dozens of facets read at once", not correctness.

function ringPoints(count, radius, y, phase) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const a = ((i + (phase ? 0.5 : 0)) / count) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius));
  }
  return pts;
}
function pushTri(pos, a, b, c) { pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z); }
function connectRings(pos, ringA, ringB) {
  const n = ringA.length;
  for (let i = 0; i < n; i++) {
    const a0 = ringA[i], a1 = ringA[(i + 1) % n];
    const b0 = ringB[i], b1 = ringB[(i + 1) % n];
    pushTri(pos, a0, b0, b1);
    pushTri(pos, a0, b1, a1);
  }
}
function capRing(pos, ring, center) {
  const n = ring.length;
  for (let i = 0; i < n; i++) pushTri(pos, center, ring[(i + 1) % n], ring[i]);
}

function buildDiamondGeometry(segments) {
  const S = segments;
  const levels = [
    { y: 0.36, r: 0.30, phase: false }, // table
    { y: 0.27, r: 0.52, phase: true },  // star facets
    { y: 0.14, r: 0.80, phase: false }, // bezel facets
    { y: 0.00, r: 1.00, phase: true },  // crown / girdle top
    { y: -0.02, r: 0.97, phase: true }, // girdle bottom (thin band)
    { y: -0.22, r: 0.74, phase: false },// upper pavilion tier
    { y: -0.48, r: 0.46, phase: true }, // mid pavilion tier
    { y: -0.72, r: 0.18, phase: false },// lower pavilion tier
  ];
  const rings = levels.map((l) => ringPoints(S, l.r, l.y, l.phase));
  const apex = new THREE.Vector3(0, -0.92, 0);

  const pos = [];
  capRing(pos, rings[0], new THREE.Vector3(0, levels[0].y, 0));
  for (let i = 0; i < rings.length - 1; i++) connectRings(pos, rings[i], rings[i + 1]);
  const last = rings[rings.length - 1];
  const n = last.length;
  for (let i = 0; i < n; i++) pushTri(pos, apex, last[(i + 1) % n], last[i]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

// --- Scene bootstrap for one canvas ---

function initGem(canvas) {
  const mobile = isMobile();
  const segments = mobile ? 14 : 20;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PAPER);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.15, 3.3);
  camera.lookAt(0, 0, 0);

  // Flat, even light — one soft fill from above and a touch of ambient so
  // facets read as tonally distinct planes, with no bright specular points.
  scene.add(new THREE.HemisphereLight(PAPER, INK, 0.7));
  const fill = new THREE.DirectionalLight(0xffffff, 0.35);
  fill.position.set(2, 3, 4);
  scene.add(fill);

  const geometry = buildDiamondGeometry(segments);

  // Nearly colourless, translucent faces — the point is to see straight
  // through to the facets (and edges) behind, like an X-ray of the cut.
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.2,
    roughness: 1,
    metalness: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const gem = new THREE.Mesh(geometry, material);
  gem.scale.setScalar(1.5);
  gem.rotation.z = 0.18;
  gem.rotation.x = 0.22;
  scene.add(gem);

  // The brass wireframe is the actual subject here, not a garnish — every
  // facet edge, drawn crisp, is what makes this read as a cut diagram.
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 0),
    new THREE.LineBasicMaterial({ color: BRASS, transparent: true, opacity: 0.85 })
  );
  edges.scale.copy(gem.scale);
  edges.rotation.copy(gem.rotation);
  scene.add(edges);

  function syncEdges() { edges.rotation.copy(gem.rotation); }

  let running = false;
  let raf = null;
  let lastTime = null, elapsed = 0;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function size() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    if (!w || !h) return false;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    return true;
  }
  function renderOnce() { if (size()) renderer.render(scene, camera); }

  function loop(now) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    if (lastTime === null) lastTime = now;
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    elapsed += dt;
    // Barely-perceptible handheld turn: one slow drift plus a gentle wobble,
    // not a spinning-toy loop.
    gem.rotation.y += dt * 0.035;
    gem.rotation.x = 0.22 + Math.sin(elapsed * 0.11) * 0.05;
    gem.rotation.z = 0.18 + Math.cos(elapsed * 0.08) * 0.04;
    syncEdges();
    if (size()) renderer.render(scene, camera);
  }
  function start() {
    if (running) return;
    running = true;
    lastTime = null;
    raf = requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  if (reduceMotion) {
    renderOnce();
  } else {
    // Start immediately rather than waiting on an observer's first async
    // callback — browsers already throttle rAF in backgrounded tabs on
    // their own, so there's no need to duplicate that with a fragile
    // visibilitychange listener. IntersectionObserver here only pauses the
    // loop once the gem has actually scrolled out of view, as an
    // optimization, and resumes it when it scrolls back in.
    start();
    const io = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) start(); else stop(); },
      { threshold: 0.01 }
    );
    io.observe(canvas);
  }

  const ro = new ResizeObserver(() => renderOnce());
  ro.observe(canvas);

  return {
    dispose() {
      stop();
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      edges.geometry.dispose();
      renderer.dispose();
    },
  };
}

function bootstrap() {
  document.querySelectorAll('canvas[data-gem]').forEach((canvas) => {
    if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
      initGem(canvas);
      return;
    }
    const ro = new ResizeObserver((entries) => {
      if (entries[0].contentRect.width > 0 && entries[0].contentRect.height > 0) {
        ro.disconnect();
        initGem(canvas);
      }
    });
    ro.observe(canvas);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
