import * as THREE from 'three';
import { COLORS, glow, hullTexture, metal, solarTexture, windowsTexture } from './materials';

export const HUB_RADIUS = 7;
export const HUB_HALF_LENGTH = 12;
export const HATCH_RADIUS = 5;
const RING_RADIUS = 44;

export interface Station {
  group: THREE.Group;
  update(time: number, delta: number): void;
}

/**
 * Parte externa da estação. Eixo no Z: o anel é uma roda voltada para a câmera, o eixo central (hub)
 * é um tubo oco e a escotilha fica na frente (z positivo), por onde a câmera entra.
 */
export function createStation(): Station {
  const group = new THREE.Group();

  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: hullTexture([4, 1]),
    metalness: 0.75,
    roughness: 0.42,
    side: THREE.DoubleSide,
  });
  const darkMat = metal(0x2a3552, 0.55, 0.7);

  // ── Hub: tubo oco com escotilha na frente e passagem nos fundos ──────────────
  const hub = new THREE.Group();
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(HUB_RADIUS, HUB_RADIUS, HUB_HALF_LENGTH * 2, 40, 1, true),
    hullMat,
  );
  tube.rotation.x = Math.PI / 2;
  hub.add(tube);

  // tampas anulares (o furo central é a escotilha / a saída para o corredor)
  for (const side of [1, -1]) {
    const cap = new THREE.Mesh(
      new THREE.RingGeometry(HATCH_RADIUS, HUB_RADIUS + 0.6, 40),
      hullMat,
    );
    cap.position.z = side * HUB_HALF_LENGTH;
    if (side < 0) cap.rotation.y = Math.PI;
    hub.add(cap);
  }

  // anel de luz da escotilha e faixas de reforço no casco
  const hatchLight = new THREE.Mesh(
    new THREE.TorusGeometry(HATCH_RADIUS + 0.25, 0.14, 12, 64),
    glow(COLORS.signal, 3),
  );
  hatchLight.position.z = HUB_HALF_LENGTH + 0.05;
  hub.add(hatchLight);

  for (const z of [-8, 8]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(HUB_RADIUS + 0.1, 0.35, 10, 48), darkMat);
    band.position.z = z;
    hub.add(band);
  }

  // luzes de guia dentro do tubo (o "túnel de entrada")
  const guideColors = [COLORS.signal, COLORS.ember, COLORS.signal, COLORS.ember];
  [8, 2.5, -3, -8.5].forEach((z, i) => {
    const guide = new THREE.Mesh(
      new THREE.TorusGeometry(HUB_RADIUS - 0.7, 0.09, 8, 48),
      glow(guideColors[i], 2.5),
    );
    guide.position.z = z;
    hub.add(guide);
  });
  const tunnelLight = new THREE.PointLight(0xbfe9ff, 90, 26, 2);
  hub.add(tunnelLight);
  group.add(hub);

  // ── Anel giratório com módulos, raios e janelas ─────────────────────────────
  const ring = new THREE.Group();
  const torus = new THREE.Mesh(new THREE.TorusGeometry(RING_RADIUS, 2.1, 14, 160), hullMat);
  ring.add(torus);

  const moduleMat = new THREE.MeshStandardMaterial({
    color: 0x3a4666,
    metalness: 0.6,
    roughness: 0.5,
    emissive: 0xffffff,
    emissiveMap: windowsTexture(),
    emissiveIntensity: 1.6,
    toneMapped: false,
  });
  const moduleCount = 24;
  for (let i = 0; i < moduleCount; i++) {
    const a = (i / moduleCount) * Math.PI * 2;
    const mod = new THREE.Mesh(new THREE.BoxGeometry(7.2, 5.4, 9.5), moduleMat);
    mod.position.set(Math.cos(a) * RING_RADIUS, Math.sin(a) * RING_RADIUS, 0);
    mod.rotation.z = a + Math.PI / 2;
    ring.add(mod);
  }

  const spokeLength = RING_RADIUS - HUB_RADIUS;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, spokeLength, 12), darkMat);
    const mid = HUB_RADIUS + spokeLength / 2;
    spoke.position.set(Math.cos(a) * mid, Math.sin(a) * mid, 0);
    spoke.rotation.z = a - Math.PI / 2;
    ring.add(spoke);
  }
  group.add(ring);

  // ── Painéis solares e antena (fixos, fora do anel) ───────────────────────────
  const solarMat = new THREE.MeshStandardMaterial({
    map: solarTexture(),
    metalness: 0.5,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });
  for (const side of [-1, 1]) {
    const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 20, 8), darkMat);
    boom.rotation.z = Math.PI / 2;
    boom.position.x = side * (RING_RADIUS + 12);
    group.add(boom);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 18, 40), solarMat);
    panel.position.x = side * (RING_RADIUS + 20);
    group.add(panel);
  }

  const dishBase = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 8, 8), darkMat);
  dishBase.position.set(0, HUB_RADIUS + 4, -2);
  group.add(dishBase);
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(3.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.4),
    new THREE.MeshStandardMaterial({ color: 0xcfd6ea, metalness: 0.6, roughness: 0.35, side: THREE.DoubleSide }),
  );
  dish.position.set(0, HUB_RADIUS + 8.4, -2);
  dish.rotation.x = -Math.PI / 3.2;
  group.add(dish);

  const beaconMat = glow(COLORS.ember, 4);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12), beaconMat);
  beacon.position.set(0, HUB_RADIUS + 12.5, -2);
  group.add(beacon);

  return {
    group,
    update(time, delta) {
      ring.rotation.z += delta * 0.06;
      // luz de sinalização piscando (1,2s acesa, 1,2s apagada)
      beaconMat.emissiveIntensity = time % 2.4 < 1.2 ? 4 : 0.3;
    },
  };
}
