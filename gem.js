// Glass diamond, not a wireframe icon — reused by gem.html and index.html.
// Every <canvas data-gem> element on the page becomes its own rotating gem.

import * as THREE from 'three';

const PAPER = '#FAF7F0';
const BRASS = '#B08D57';
const BRASS_DEEP = '#8A6C3E';
const INK = '#1C1712';

function isMobile() {
  return window.matchMedia('(max-width: 760px)').matches ||
    (navigator.maxTouchPoints > 1 && window.innerWidth < 900);
}

// --- Geometry: multi-tier faceted diamond, checkerboard-offset rings ---
// (a real brilliant's kite/star pattern), not a lathe body of revolution.

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
  // table / star / crown-girdle / girdle-bottom / pavilion-upper / pavilion-lower,
  // each ring offset a half-step from its neighbour — sharp table, thin sharp
  // girdle break, single sharp culet point.
  const levels = [
    { y: 0.34, r: 0.42, phase: false },
    { y: 0.20, r: 0.70, phase: true },
    { y: 0.00, r: 1.00, phase: false },
    { y: -0.02, r: 0.97, phase: false },
    { y: -0.34, r: 0.62, phase: true },
    { y: -0.62, r: 0.24, phase: false },
  ];
  const rings = levels.map((l) => ringPoints(S, l.r, l.y, l.phase));
  const apex = new THREE.Vector3(0, -0.86, 0);

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

// --- Environment: several small, sharply bright panels at scattered angles
// in an otherwise dark box, baked through PMREMGenerator. A handful of
// distinct bright spots (not a smooth wash) is what makes facets flash
// one at a time as the gem turns, instead of glowing evenly all over. ---

function buildEnvironmentScene() {
  const scene = new THREE.Scene();

  const room = new THREE.Mesh(
    new THREE.BoxGeometry(30, 30, 30),
    new THREE.MeshStandardMaterial({ color: INK, side: THREE.BackSide, roughness: 1, metalness: 0 })
  );
  scene.add(room);
  scene.add(new THREE.AmbientLight(BRASS_DEEP, 0.08));

  const spots = [
    { pos: [-6, 4.5, -3], size: [0.9, 6], color: '#FFFFFF', intensity: 10 },
    { pos: [7, 3, -2], size: [0.7, 5], color: BRASS, intensity: 9 },
    { pos: [1, 8, 5], size: [5, 2.2], color: '#FFF6E4', intensity: 7 },
    { pos: [-4, -5, 6], size: [0.8, 4], color: BRASS_DEEP, intensity: 6 },
    { pos: [6, -3.5, -5], size: [0.6, 4.5], color: '#FFFFFF', intensity: 8 },
    { pos: [-2, 2, 8], size: [3, 1.4], color: PAPER, intensity: 5 },
    { pos: [0, -8, -2], size: [4, 1.5], color: BRASS, intensity: 4 },
  ];
  spots.forEach((d) => {
    const c = new THREE.Color(d.color).multiplyScalar(d.intensity);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(d.size[0], d.size[1]),
      new THREE.MeshBasicMaterial({ color: c, toneMapped: false, side: THREE.DoubleSide })
    );
    mesh.position.set(...d.pos);
    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
  });

  return scene;
}

// --- Scene bootstrap for one canvas ---

function initGem(canvas) {
  const mobile = isMobile();
  const segments = mobile ? 12 : 16;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  // Transmission refracts whatever is already in the framebuffer behind the
  // gem — on a truly transparent canvas there's nothing there, and the gem
  // renders as a washed-out translucent ghost instead of glass. Painting the
  // exact page parchment here fixes that and is visually identical to
  // transparency wherever the gem sits on the site's --paper background.
  scene.background = new THREE.Color(PAPER);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(buildEnvironmentScene(), 0.02, 0.1, 50);
  scene.environment = envRT.texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.15, 3.3);
  camera.lookAt(0, 0, 0);

  // A few point lights at scattered angles for crisp, localized specular
  // glints — one broad area light would just smear them into a soft glow.
  scene.add(new THREE.HemisphereLight(PAPER, INK, 0.15));
  const lights = [
    { pos: [3, 4, 3], color: 0xfff6e6, intensity: 18 },
    { pos: [-4, 1.5, 2.5], color: BRASS, intensity: 14 },
    { pos: [2, -3, 3.5], color: 0xffffff, intensity: 10 },
    { pos: [-2, -2.5, -3], color: BRASS_DEEP, intensity: 8 },
  ];
  lights.forEach((l) => {
    const pl = new THREE.PointLight(l.color, l.intensity, 20, 2);
    pl.position.set(...l.pos);
    scene.add(pl);
  });

  // A flat background colour alone gives transmission nothing to bend —
  // refraction through a uniform field just looks like more uniform field.
  // A few bars behind the gem give it real straight lines to warp and
  // double at the facet edges, which is what actually reads as "glass".
  // IMPORTANT: they must be fully opaque — three.js's transmission pass
  // only captures opaque scene content as the "what's behind it" backdrop;
  // transparent:true objects are silently skipped and never show through.
  // Sized/placed to stay inside the gem's own silhouette (accounting for
  // perspective falloff at this z) so nothing pokes out past its edges.
  const backdrop = new THREE.Group();
  const barGeo = new THREE.PlaneGeometry(0.09, 1.3);
  const barDefs = [
    { x: -0.62, color: INK },
    { x: -0.30, color: BRASS_DEEP },
    { x: 0.0, color: INK },
    { x: 0.30, color: BRASS_DEEP },
    { x: 0.62, color: INK },
  ];
  barDefs.forEach((b) => {
    const bar = new THREE.Mesh(barGeo, new THREE.MeshBasicMaterial({ color: b.color, side: THREE.DoubleSide }));
    bar.position.set(b.x, -0.25, -1.3);
    backdrop.add(bar);
  });
  const ringGeo = new THREE.RingGeometry(0.5, 0.58, 48);
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: BRASS, side: THREE.DoubleSide }));
  ring.position.set(0, -0.25, -1.15);
  backdrop.add(ring);
  scene.add(backdrop);

  const geometry = buildDiamondGeometry(segments);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.02,
    transmission: 1,
    ior: 2.42,
    thickness: 1.6,
    dispersion: 4,
    attenuationColor: 0xffffff,
    attenuationDistance: 1.6,
    clearcoat: 0.4,
    clearcoatRoughness: 0.05,
    specularIntensity: 1,
    envMapIntensity: 1.5,
    side: THREE.FrontSide,
  });
  const gem = new THREE.Mesh(geometry, material);
  gem.scale.setScalar(1.15);
  gem.rotation.z = 0.18;
  gem.rotation.x = 0.22;
  scene.add(gem);

  // A faint brass edge accent ties the glass back to the site palette
  // without turning it back into a wireframe icon.
  const rim = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 8),
    new THREE.LineBasicMaterial({ color: BRASS, transparent: true, opacity: 0.22 })
  );
  rim.scale.copy(gem.scale);
  rim.rotation.copy(gem.rotation);
  scene.add(rim);

  function syncRim() { rim.rotation.copy(gem.rotation); }

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
    syncRim();
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
    let visible = true;
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible && document.visibilityState === 'visible') start(); else stop();
      },
      { threshold: 0.01 }
    );
    io.observe(canvas);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && visible) start(); else stop();
    });
  }

  const ro = new ResizeObserver(() => renderOnce());
  ro.observe(canvas);

  return {
    dispose() {
      stop();
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      envRT.texture.dispose();
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
