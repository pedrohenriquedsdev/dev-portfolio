import * as THREE from 'three';
import {
  COLORS,
  canvasTexture,
  glow,
  gratingTexture,
  hazardTexture,
  hullTexture,
  metal,
  screenTexture,
} from './materials';

/** Dimensões comuns de todas as salas */
export const ROOM_W = 20;
export const ROOM_H = 9;
export const ROOM_D = 30;
const DOOR_W = 6;
const DOOR_H = 6.5;

/** Posição Z do centro de cada sala interior (a primeira fica atrás do hub da estação) */
export const INTERIOR_START_Z = -80;
export const ROOM_SPACING = 48;
export const roomCenterZ = (interiorIndex: number): number => INTERIOR_START_Z - interiorIndex * ROOM_SPACING;

export interface RoomScene {
  group: THREE.Group;
  update(time: number): void;
}

type Updater = (time: number) => void;

// ── helpers ────────────────────────────────────────────────────────────────

function box(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function cyl(
  parent: THREE.Object3D,
  rTop: number,
  rBottom: number,
  h: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  segments = 20,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments), mat);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}
/** Casca da sala: piso, teto, paredes com portas na frente e nos fundos, luzes de teto */
function shell(tint: number, lightColor: number, windowOnRight = false): THREE.Group {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({
    color: tint,
    map: hullTexture([6, 2]),
    metalness: 0.35,
    roughness: 0.65,
    envMapIntensity: 0.3,
  });
  const floorMat = new THREE.MeshStandardMaterial({
    map: gratingTexture([10, 15]),
    metalness: 0.6,
    roughness: 0.5,
  });
  const trim = glow(lightColor, 2.2);
  const hw = ROOM_W / 2;
  const hh = ROOM_H / 2;
  const hd = ROOM_D / 2;
  const T = 0.4;

  box(g, ROOM_W, T, ROOM_D, floorMat, 0, -hh, 0);
  box(g, ROOM_W, T, ROOM_D, wallMat, 0, hh, 0);
  box(g, T, ROOM_H, ROOM_D, wallMat, -hw, 0, 0);

  // parede direita: inteira ou com uma grande janela para o espaço
  if (windowOnRight) {
    const y0 = -1.4;
    const y1 = 3.2;
    box(g, T, y0 - -hh, ROOM_D, wallMat, hw, (y0 + -hh) / 2, 0);
    box(g, T, hh - y1, ROOM_D, wallMat, hw, (hh + y1) / 2, 0);
    for (const s of [1, -1]) {
      const zEdge = s * 9.5;
      const w = hd - 9.5;
      box(g, T, y1 - y0, w, wallMat, hw, (y0 + y1) / 2, s * (9.5 + w / 2));
      box(g, 0.25, y1 - y0, 0.25, trim, hw - 0.1, (y0 + y1) / 2, zEdge);
    }
    box(g, 0.25, 0.25, 19, trim, hw - 0.1, y1, 0);
    box(g, 0.25, 0.25, 19, trim, hw - 0.1, y0, 0);
  } else {
    box(g, T, ROOM_H, ROOM_D, wallMat, hw, 0, 0);
  }

  // paredes da frente (+z) e dos fundos (-z), com porta no centro
  const sideW = (ROOM_W - DOOR_W) / 2;
  for (const s of [1, -1]) {
    const z = s * hd;
    box(g, sideW, ROOM_H, T, wallMat, -(DOOR_W / 2 + sideW / 2), 0, z);
    box(g, sideW, ROOM_H, T, wallMat, DOOR_W / 2 + sideW / 2, 0, z);
    box(g, DOOR_W, ROOM_H - DOOR_H, T, wallMat, 0, -hh + DOOR_H + (ROOM_H - DOOR_H) / 2, z);
    // moldura luminosa da porta
    box(g, 0.2, DOOR_H, 0.2, trim, -DOOR_W / 2, -hh + DOOR_H / 2, z - s * 0.25);
    box(g, 0.2, DOOR_H, 0.2, trim, DOOR_W / 2, -hh + DOOR_H / 2, z - s * 0.25);
    box(g, DOOR_W, 0.2, 0.2, trim, 0, -hh + DOOR_H, z - s * 0.25);
  }

  // faixas de luz no teto
  for (const x of [-6, 0, 6]) box(g, 0.5, 0.15, ROOM_D - 8, glow(0xe8ecf5, 0.9), x, hh - 0.25, 0);
  return g;
}

/** Textura de céu estrelado (vigias) */
function skyTexture(): THREE.CanvasTexture {
  return canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#050a1c';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 40; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 1.6, 1.6);
  });
}

// ── conectores entre salas ────────────────────────────────────────────────

/** Corredor entre dois pontos do eixo Z (usado na entrada e entre as salas) */
export function createCorridor(zFrom: number, zTo: number): THREE.Group {
  const g = new THREE.Group();
  const len = Math.abs(zTo - zFrom);
  const cz = (zFrom + zTo) / 2;
  const mat = new THREE.MeshStandardMaterial({
    color: 0x2a3552,
    map: hullTexture([2, Math.max(1, len / 8)]),
    metalness: 0.4,
    roughness: 0.6,
  });
  const W = 7.5;
  box(g, W, 0.3, len, new THREE.MeshStandardMaterial({ map: gratingTexture([3, len / 3]), metalness: 0.6, roughness: 0.5 }), 0, -3.6, cz);
  box(g, W, 0.3, len, mat, 0, 3.9, cz);
  box(g, 0.3, 7.8, len, mat, -W / 2, 0.15, cz);
  box(g, 0.3, 7.8, len, mat, W / 2, 0.15, cz);

  // anéis de luz ao longo do corredor (dão a sensação de velocidade ao passar)
  const step = 6;
  for (let z = Math.min(zFrom, zTo) + step / 2; z < Math.max(zFrom, zTo); z += step) {
    const colorA = Math.round((z - zFrom) / step) % 2 === 0 ? COLORS.signal : COLORS.ember;
    box(g, W - 0.5, 0.15, 0.25, glow(colorA, 2.4), 0, 3.7, z);
    box(g, 0.15, 6.5, 0.25, glow(colorA, 1.6), -W / 2 + 0.2, 0.1, z);
    box(g, 0.15, 6.5, 0.25, glow(colorA, 1.6), W / 2 - 0.2, 0.1, z);
  }
  return g;
}

// ── salas ──────────────────────────────────────────────────────────────────

/** Alojamento da tripulação: beliches, armários, escrivaninha com luminária e vigia */
function crewQuarters(): RoomScene {
  const g = shell(0x3a3330, COLORS.ember);
  const frame = metal(0x39425c, 0.5, 0.7);
  const mattress = new THREE.MeshStandardMaterial({ color: 0x2c3a62, roughness: 0.9 });
  const blanket = new THREE.MeshStandardMaterial({ color: 0x9a5a2e, roughness: 0.95 });

  for (const z of [-2, -10]) {
    for (const y of [-3.2, -0.6]) {
      box(g, 3.2, 0.25, 6.4, frame, 7.9, y - 0.4, z);
      box(g, 3, 0.5, 6.2, mattress, 7.9, y, z);
      box(g, 3.05, 0.55, 3.2, blanket, 7.9, y + 0.03, z - 1.4);
    }
    for (const dz of [-3.1, 3.1]) for (const dx of [-1.5, 1.5]) box(g, 0.2, 5.2, 0.2, frame, 7.9 + dx, -1.8, z + dz);
  }

  const lockerMat = metal(0x4a5578, 0.6, 0.5);
  for (let i = 0; i < 4; i++) {
    box(g, 1.2, 5.4, 2.2, lockerMat, -9.2, -1.8, -11 + i * 3.6);
    box(g, 0.1, 1, 0.12, glow(COLORS.signal, 2), -8.55, -1.5, -11.7 + i * 3.6);
  }

  // escrivaninha + luminária quente
  box(g, 5, 0.25, 2.2, metal(0x4a5578), 0, -2.4, -13.6);
  box(g, 0.25, 2.2, 2, frame, -2.3, -3.5, -13.6);
  box(g, 0.25, 2.2, 2, frame, 2.3, -3.5, -13.6);
  cyl(g, 0.05, 0.05, 1.8, frame, -1.4, -1.4, -13.6, 8);
  const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.7, 16, 1, true), glow(COLORS.ember, 3));
  lamp.position.set(-1.4, -0.4, -13.6);
  lamp.rotation.x = Math.PI;
  g.add(lamp);
  box(g, 1.6, 1.0, 0.1, glow(COLORS.signal, 1.6), 1.2, -1.6, -14.7); // tela na parede

  // vigia na parede direita
  const frameRing = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.18, 10, 32), frame);
  frameRing.position.set(9.7, 1.8, -6);
  frameRing.rotation.y = Math.PI / 2;
  g.add(frameRing);
  const porthole = new THREE.Mesh(
    new THREE.CircleGeometry(1.45, 32),
    new THREE.MeshBasicMaterial({ map: skyTexture(), toneMapped: false }),
  );
  porthole.position.set(9.68, 1.8, -6);
  porthole.rotation.y = -Math.PI / 2;
  g.add(porthole);

  return { group: g, update: () => undefined };
}

/** Laboratório: bancadas com hologramas, tubos de ensaio e projeção central flutuante */
function laboratory(): RoomScene {
  const g = shell(0x24334a, COLORS.signal);
  const benchMat = metal(0x3a4766, 0.5, 0.6);
  const updaters: Updater[] = [];

  const holoMat = new THREE.MeshBasicMaterial({ color: COLORS.signal, wireframe: true, toneMapped: false });
  for (let i = 0; i < 3; i++) {
    const z = -1 - i * 5.2;
    box(g, 2.6, 1.7, 4.4, benchMat, 8.4, -3.5, z);
    box(g, 2.8, 0.15, 4.6, glow(COLORS.signal, 1.4), 8.4, -2.6, z);
    const holo = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 1), holoMat);
    holo.position.set(8.4, -1.4, z);
    g.add(holo);
    const ringH = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.03, 6, 40), glow(COLORS.signal, 3));
    ringH.position.copy(holo.position);
    g.add(ringH);
    updaters.push((t) => {
      holo.rotation.set(t * 0.5 + i, t * 0.7, 0);
      ringH.rotation.set(Math.PI / 2 + Math.sin(t + i) * 0.4, t * 0.6, 0);
    });
  }

  // tubos de ensaio com líquido luminoso
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xaadfff,
    transparent: true,
    opacity: 0.18,
    roughness: 0.1,
    metalness: 0,
  });
  [COLORS.signal, COLORS.ember, COLORS.signal, 0x7aa8ff, COLORS.ember].forEach((c, i) => {
    const x = -7 + i * 2.6;
    cyl(g, 0.55, 0.55, 5, glass, x, -1.9, -13.2, 16);
    const liquid = cyl(g, 0.38, 0.38, 3.4 - (i % 2) * 1, glow(c, 1.8), x, -3.0 + (i % 2) * 0.45, -13.2, 16);
    liquid.userData['bubble'] = i;
    cyl(g, 0.62, 0.62, 0.3, benchMat, x, -4.2, -13.2, 16);
    cyl(g, 0.62, 0.62, 0.3, benchMat, x, 0.65, -13.2, 16);
  });

  // projeção central
  const center = new THREE.Group();
  center.position.set(3.2, -0.6, -6);
  const octa = new THREE.Mesh(new THREE.OctahedronGeometry(1.5, 0), holoMat);
  center.add(octa);
  const orbits: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const cube = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), glow(i % 2 ? COLORS.ember : COLORS.signal, 3));
    center.add(cube);
    orbits.push(cube);
  }
  g.add(center);
  cyl(g, 1.6, 1.9, 0.35, benchMat, 3.2, -4.2, -6, 28);
  const baseRing = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.05, 6, 48), glow(COLORS.signal, 3));
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.set(3.2, -4.0, -6);
  g.add(baseRing);
  updaters.push((t) => {
    octa.rotation.y = t * 0.6;
    octa.rotation.x = t * 0.3;
    orbits.forEach((cube, i) => {
      const a = t * 0.8 + (i / orbits.length) * Math.PI * 2;
      cube.position.set(Math.cos(a) * 2.4, Math.sin(a * 1.3) * 0.9, Math.sin(a) * 2.4);
      cube.rotation.set(a, a * 0.5, 0);
    });
    center.position.y = -0.6 + Math.sin(t * 1.2) * 0.2;
  });

  return { group: g, update: (t) => updaters.forEach((u) => u(t)) };
}

/** Sala de máquinas: reator com anéis girando, tubulações e piso quente */
function engineRoom(): RoomScene {
  const g = shell(0x33303a, COLORS.ember);
  const pipe = metal(0x7a6b5a, 0.45, 0.8);
  const steel = metal(0x39425c, 0.5, 0.7);
  const updaters: Updater[] = [];

  // reator
  const reactor = new THREE.Group();
  reactor.position.set(3.6, 0, -6);
  g.add(reactor);
  const core = cyl(reactor, 1.0, 1.0, 7, glow(COLORS.ember, 3.2), 0, -0.5, 0, 28);
  cyl(reactor, 2.6, 2.9, 0.9, steel, 0, -4.1, 0, 32);
  cyl(reactor, 2.2, 2.6, 0.7, steel, 0, 3.4, 0, 32);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffd9a8, transparent: true, opacity: 0.14, roughness: 0.1 });
  cyl(reactor, 1.9, 1.9, 6.4, glass, 0, -0.5, 0, 32);
  const rings: THREE.Mesh[] = [];
  [2.4, 2.9, 3.4].forEach((r, i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.09, 8, 64), glow(i === 1 ? COLORS.signal : COLORS.ember, 2.6));
    ring.position.y = -2 + i * 1.8;
    reactor.add(ring);
    rings.push(ring);
  });

  // tubulações nas paredes
  for (const [y, r] of [[2.6, 0.45], [1.4, 0.3], [-3.4, 0.35]] as const) {
    const p = cyl(g, r, r, ROOM_D - 2, pipe, -9.4, y, 0, 12);
    p.rotation.x = Math.PI / 2;
    for (let z = -12; z <= 12; z += 6) cyl(g, r + 0.15, r + 0.15, 0.35, steel, -9.4, y, z, 12).rotation.x = Math.PI / 2;
  }
  // válvulas com indicador luminoso
  for (let i = 0; i < 4; i++) {
    cyl(g, 0.5, 0.5, 0.25, steel, -9.5, -0.6, -10 + i * 6, 16).rotation.z = Math.PI / 2;
    box(g, 0.15, 0.15, 0.15, glow(i % 2 ? COLORS.signal : COLORS.ember, 3), -9.35, -0.1, -10 + i * 6);
  }
  // linhas de calor no piso
  for (const dx of [-1.6, 1.6]) box(g, 0.12, 0.05, ROOM_D - 6, glow(COLORS.ember, 1.5), 3.6 + dx * 1.6, -4.27, 0);

  updaters.push((t) => {
    rings.forEach((r, i) => {
      r.rotation.x = Math.PI / 2 + Math.sin(t * 0.5 + i) * 0.35;
      r.rotation.y = t * (0.6 + i * 0.25) * (i % 2 ? -1 : 1);
    });
    (core.material as THREE.MeshStandardMaterial).emissiveIntensity = 3 + Math.sin(t * 3) * 0.5;
  });
  return { group: g, update: (t) => updaters.forEach((u) => u(t)) };
}

/** Registro de missão: torres de dados e uma linha do tempo luminosa na parede */
function missionLog(): RoomScene {
  const g = shell(0x232b45, COLORS.signal);
  const steel = metal(0x39425c, 0.5, 0.7);
  const updaters: Updater[] = [];

  // torres de dados
  for (let i = 0; i < 5; i++) {
    const z = -12 + i * 4;
    box(g, 1.6, 7.4, 2.2, steel, 9, -0.3, z);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 5.2),
      new THREE.MeshBasicMaterial({ map: screenTexture('#5ce1e6', 3 + i), toneMapped: false }),
    );
    screen.position.set(8.18, 0.2, z);
    screen.rotation.y = -Math.PI / 2;
    g.add(screen);
  }

  // linha do tempo: trilho + 6 marcos pulsando
  box(g, 0.08, 0.08, 20, glow(COLORS.signal, 2.2), 7.9, 0.2, 0);
  const nodes: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), glow(i === 5 ? COLORS.ember : COLORS.signal, 3));
    node.position.set(7.9, 0.2, -9 + i * 3.6);
    g.add(node);
    nodes.push(node);
    box(g, 0.05, 1.4 + (i % 2) * 0.8, 0.05, glow(COLORS.signal, 1.6), 7.9, 0.9 + (i % 2) * 0.4, node.position.z);
  }

  // mesa holográfica com mapa
  cyl(g, 2.2, 2.2, 0.3, steel, 2.4, -3.3, -6, 32);
  cyl(g, 0.5, 0.8, 1.2, steel, 2.4, -3.9, -6, 16);
  const map = new THREE.Mesh(
    new THREE.CircleGeometry(2, 40),
    new THREE.MeshBasicMaterial({ map: screenTexture('#ffb86b', 11), transparent: true, opacity: 0.85, toneMapped: false }),
  );
  map.rotation.x = -Math.PI / 2;
  map.position.set(2.4, -1.5, -6);
  g.add(map);

  updaters.push((t) => {
    nodes.forEach((n, i) => n.scale.setScalar(1 + Math.sin(t * 2 + i * 0.9) * 0.28));
    map.rotation.z = t * 0.15;
    map.position.y = -1.5 + Math.sin(t) * 0.08;
  });
  return { group: g, update: (t) => updaters.forEach((u) => u(t)) };
}

/** Doca: janela panorâmica para o espaço, cápsula de carga no berço e piso sinalizado */
function dockingBay(): RoomScene {
  const g = shell(0x2d3140, COLORS.ember, true);
  const steel = metal(0x39425c, 0.5, 0.7);
  const white = new THREE.MeshStandardMaterial({ color: 0xdfe5f5, metalness: 0.5, roughness: 0.35 });
  const updaters: Updater[] = [];

  // faixas de perigo no chão
  const hazard = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 22),
    new THREE.MeshStandardMaterial({ map: hazardTexture([1, 5]), roughness: 0.7, metalness: 0.3 }),
  );
  hazard.rotation.x = -Math.PI / 2;
  hazard.position.set(4.6, -4.27, -5);
  g.add(hazard);

  // cápsula
  const capsule = new THREE.Group();
  capsule.position.set(4.6, -1.8, -6);
  g.add(capsule);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(1.7, 4.8, 8, 24), white);
  body.rotation.x = Math.PI / 2;
  capsule.add(body);
  for (const z of [-1.8, 1.8]) {
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.07, 8, 40), glow(COLORS.ember, 2.8));
    stripe.position.z = z;
    capsule.add(stripe);
  }
  const hatch = new THREE.Mesh(new THREE.CircleGeometry(0.7, 24), glow(COLORS.signal, 2.4));
  hatch.position.set(-1.66, 0.3, 0);
  hatch.rotation.y = -Math.PI / 2;
  capsule.add(hatch);
  box(g, 4.2, 0.4, 8.6, steel, 4.6, -4.0, -6);
  box(g, 0.4, 1.6, 7, steel, 2.7, -3.3, -6);
  box(g, 0.4, 1.6, 7, steel, 6.5, -3.3, -6);

  // caixas de carga
  [[-6, -3.6, -2], [-6.2, -3.6, -5.4], [-5.8, -2.3, -2.2]].forEach(([x, y, z], i) => {
    box(g, 2.6, i === 2 ? 1.6 : 2, 2.6, metal(0x4b5578, 0.6, 0.5), x, y, z + 3);
    box(g, 2.65, 0.12, 2.65, glow(COLORS.ember, 1.6), x, y + (i === 2 ? 0.7 : 0.9), z + 3);
  });
  // luz de sinalização giratória
  const beacon = box(g, 0.5, 0.5, 0.5, glow(COLORS.ember, 4), -9.3, 3.4, -13);

  updaters.push((t) => {
    capsule.position.y = -1.8 + Math.sin(t * 0.9) * 0.06;
    (beacon.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5 + Math.abs(Math.sin(t * 2.5)) * 4;
  });
  return { group: g, update: (t) => updaters.forEach((u) => u(t)) };
}

/** Cockpit: janela panorâmica, painel de controle curvo, poltronas e hologramas de comunicação */
function cockpit(): RoomScene {
  const g = shell(0x232940, COLORS.signal, true);
  const steel = metal(0x39425c, 0.5, 0.7);
  const seat = new THREE.MeshStandardMaterial({ color: 0x20293f, roughness: 0.8 });
  const updaters: Updater[] = [];

  // painel de controle em arco, com telas
  const colors = ['#5ce1e6', '#ffb86b', '#5ce1e6', '#8aa8ff', '#5ce1e6'];
  for (let k = 0; k < 5; k++) {
    const angle = (k - 2) * 0.42;
    const pivot = new THREE.Group();
    pivot.position.set(1.5, 0, -6);
    pivot.rotation.y = angle;
    g.add(pivot);
    box(pivot, 3.1, 1.5, 1.6, steel, 5.6, -3.4, 0);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(2.7, 1.2),
      new THREE.MeshBasicMaterial({ map: screenTexture(colors[k], 20 + k), toneMapped: false }),
    );
    screen.position.set(5.6 - 0.45, -2.35, 0);
    screen.rotation.set(-0.9, Math.PI / 2, 0);
    screen.rotation.order = 'YXZ';
    pivot.add(screen);
  }

  // poltronas voltadas para a janela
  for (const z of [-3.4, -8.6]) {
    cyl(g, 0.5, 0.7, 1.5, steel, 0.6, -3.7, z, 12);
    box(g, 1.7, 0.4, 1.7, seat, 0.6, -2.8, z);
    box(g, 0.4, 1.9, 1.6, seat, -0.1, -1.7, z);
  }

  // hologramas: mini estação + ondas de sinal expandindo
  const holo = new THREE.Group();
  holo.position.set(3.2, -0.2, -6);
  g.add(holo);
  const wire = new THREE.MeshBasicMaterial({ color: COLORS.signal, wireframe: true, toneMapped: false });
  holo.add(new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.2, 6, 24), wire));
  const miniHub = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.8, 10), wire);
  miniHub.rotation.x = Math.PI / 2;
  holo.add(miniHub);

  const waves: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const wave = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.025, 6, 48),
      new THREE.MeshBasicMaterial({ color: COLORS.signal, transparent: true, toneMapped: false }),
    );
    wave.position.set(3.2, -0.2, -6);
    wave.rotation.x = Math.PI / 2;
    g.add(wave);
    waves.push(wave);
  }

  updaters.push((t) => {
    holo.rotation.y = t * 0.5;
    holo.rotation.x = Math.sin(t * 0.7) * 0.25;
    waves.forEach((w, i) => {
      const phase = (t * 0.45 + i / waves.length) % 1;
      w.scale.setScalar(0.6 + phase * 4);
      (w.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * 0.7;
    });
  });
  return { group: g, update: (t) => updaters.forEach((u) => u(t)) };
}

/** Cor da luz de cada sala interior (a World a usa nas poucas luzes que acompanham a câmera) */
export const ROOM_LIGHT_COLORS = [0xffb86b, 0x5ce1e6, 0xff9a4d, 0x5ce1e6, 0xffd9a8, 0x5ce1e6] as const;

/** Cede o controle ao navegador por um instante: mantém a tela responsiva (e o loading animado) */
const yieldToBrowser = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

export interface Interiors {
  group: THREE.Group;
  update(time: number): void;
  /** Mostra só o que está perto da câmera: menos objetos para desenhar a cada frame */
  cull(cameraZ: number): void;
}

/**
 * Constrói todas as salas interiores, na mesma ordem de ROOMS (sem a Home).
 * É assíncrono: cede o controle ao navegador entre as salas para a tela de loading não congelar.
 */
export async function createInteriors(onStep?: (done: number, total: number) => void): Promise<Interiors> {
  const group = new THREE.Group();
  const builders = [crewQuarters, laboratory, engineRoom, missionLog, dockingBay, cockpit];
  const rooms: RoomScene[] = [];
  const parts: { object: THREE.Object3D; zMin: number; zMax: number }[] = [];
  const total = builders.length;

  for (let i = 0; i < total; i++) {
    const room = builders[i]();
    const z = roomCenterZ(i);
    room.group.position.z = z;
    group.add(room.group);
    rooms.push(room);
    parts.push({ object: room.group, zMin: z - ROOM_D / 2, zMax: z + ROOM_D / 2 });
    onStep?.(i + 1, total);
    await yieldToBrowser();
  }

  // corredor de entrada (saída do hub até a primeira sala) e corredores entre salas
  const corridors: [number, number][] = [[-12, roomCenterZ(0) + ROOM_D / 2]];
  for (let i = 0; i < total - 1; i++) corridors.push([roomCenterZ(i) - ROOM_D / 2, roomCenterZ(i + 1) + ROOM_D / 2]);
  for (const [from, to] of corridors) {
    const corridor = createCorridor(from, to);
    group.add(corridor);
    parts.push({ object: corridor, zMin: Math.min(from, to), zMax: Math.max(from, to) });
  }

  return {
    group,
    update: (time) => rooms.forEach((r) => r.update(time)),
    cull: (cameraZ) => {
      for (const p of parts) p.object.visible = cameraZ > p.zMin - 22 && cameraZ < p.zMax + 22;
    },
  };
}
