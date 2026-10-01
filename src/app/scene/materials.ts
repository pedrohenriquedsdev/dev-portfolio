import * as THREE from 'three';

/** Cores do design system (mesmos valores do @theme em styles.css) */
export const COLORS = {
  space: 0x05070d,
  signal: 0x5ce1e6,
  ember: 0xffb86b,
  star: 0xe6ecff,
  steel: 0x8d98b5,
  panel: 0x1b2740,
} as const;

/** Cria uma textura desenhando num <canvas> 2D (evita arquivos de imagem externos) */
export function canvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  repeat?: [number, number],
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d')!, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  return tex;
}

/** Placas de casco: linhas de junção e parafusos */
export function hullTexture(repeat: [number, number] = [1, 1]): THREE.CanvasTexture {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#9aa5bf';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(20,28,48,0.75)';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, w - 4, h - 4);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(20,28,48,0.8)';
    for (const [x, y] of [[14, 14], [w - 14, 14], [14, h - 14], [w - 14, h - 14]]) {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, repeat);
}

/** Piso de grade metálica */
export function gratingTexture(repeat: [number, number]): THREE.CanvasTexture {
  return canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#1a2236';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#2c3a58';
    ctx.lineWidth = 4;
    for (let i = 0; i <= w; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }
  }, repeat);
}

/** Fileiras de janelas: usada como emissiveMap (só o que é claro brilha) */
export function windowsTexture(): THREE.CanvasTexture {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  return canvasTexture(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    for (let y = 14; y < h - 14; y += 24) {
      for (let x = 12; x < w - 12; x += 22) {
        if (rand() > 0.35) {
          ctx.fillStyle = rand() > 0.25 ? '#ffb86b' : '#8fe9ef';
          ctx.fillRect(x, y, 14, 9);
        }
      }
    }
  });
}

/** Células de painel solar */
export function solarTexture(): THREE.CanvasTexture {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#16295a');
    g.addColorStop(1, '#0a1433');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(230,236,255,0.35)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i <= w; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }
  });
}

/** Tela de painel com barras de dados (consoles e hologramas) */
export function screenTexture(color: string, seedStart = 3): THREE.CanvasTexture {
  let seed = seedStart;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  return canvasTexture(256, 160, (ctx, w, h) => {
    ctx.fillStyle = '#04101a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    for (let i = 0; i < 14; i++) {
      const bh = 12 + rand() * (h - 50);
      ctx.globalAlpha = 0.45 + rand() * 0.5;
      ctx.fillRect(14 + i * 16.5, h - 16 - bh, 10, bh);
    }
    ctx.globalAlpha = 0.8;
    ctx.fillRect(14, 14, 80, 5);
    ctx.fillRect(14, 26, 48, 3);
  });
}

/** Faixas de perigo (amarelo e preto) para a doca */
export function hazardTexture(repeat: [number, number]): THREE.CanvasTexture {
  return canvasTexture(128, 32, (ctx, w, h) => {
    ctx.fillStyle = '#161b28';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d9a441';
    for (let x = -h; x < w; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x + 16, h);
      ctx.lineTo(x + 16 + h, 0);
      ctx.lineTo(x + h, 0);
      ctx.fill();
    }
  }, repeat);
}

/** Material que emite luz (o bloom faz brilhar quando intensity > 1) */
export function glow(color: number, intensity = 2): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: color,
    emissiveIntensity: intensity,
    toneMapped: false,
  });
}

export function metal(color: number, roughness = 0.5, metalness = 0.6): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}
