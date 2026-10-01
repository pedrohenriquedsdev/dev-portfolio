import * as THREE from 'three';

/**
 * Céu de estrelas: pontos distribuídos numa esfera enorme. O World mantém a esfera centrada
 * na câmera, então as estrelas ficam "no infinito" (sem paralaxe) enquanto a câmera viaja.
 */
export function createStarfield(count = 2600, radius = 900): THREE.Points {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const warm = new THREE.Color(0xffd9a8);
  const cool = new THREE.Color(0xaecbff);
  const white = new THREE.Color(0xffffff);

  for (let i = 0; i < count; i++) {
    // ponto uniforme na esfera
    const u = Math.random() * 2 - 1;
    const a = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    positions.set([radius * s * Math.cos(a), radius * u, radius * s * Math.sin(a)], i * 3);

    const roll = Math.random();
    const color = roll < 0.15 ? warm : roll < 0.4 ? cool : white;
    // brilho variado: a maioria fraca, poucas fortes
    const brightness = 0.25 + Math.pow(Math.random(), 3) * 0.9;
    colors.set([color.r * brightness, color.g * brightness, color.b * brightness], i * 3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 1.7,
    sizeAttenuation: false,
    vertexColors: true,
    depthWrite: false,
    fog: false,
  });

  const stars = new THREE.Points(geometry, material);
  stars.frustumCulled = false;
  return stars;
}
