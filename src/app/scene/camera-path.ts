import * as THREE from 'three';
import { ROOMS } from '../data/rooms';
import { ROOM_D, roomCenterZ } from './interior';

/** Um ponto de controle da viagem: em que progresso (t) a câmera está onde e olhando para onde */
interface Stop {
  t: number;
  pos: THREE.Vector3;
  look: THREE.Vector3;
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/**
 * Monta a jornada: aproximação da estação → entrada pela escotilha → túnel → cada sala.
 * Em cada sala há dois pontos (chegada e saída, de `from` a `to`) quase iguais: é o trecho do
 * scroll em que a câmera "descansa" e o conteúdo da seção aparece.
 */
function buildStops(): Stop[] {
  const [home, ...interiors] = ROOMS;
  const stops: Stop[] = [
    // Home: câmera longe e olhando bem para a esquerda da estação, que fica na metade direita da tela
    // (o texto ocupa a esquerda). Quanto mais perto, maior o desvio necessário para manter essa composição.
    { t: home.from, pos: v(0, 12, 230), look: v(-105, -2, 0) },
    { t: home.to, pos: v(0, 8, 190), look: v(-85, 0, 0) },
    // aproximação e entrada pela escotilha
    { t: 0.17, pos: v(7, 3, 52), look: v(0, 0, 0) },
    { t: 0.215, pos: v(0, 0, 24), look: v(0, 0, -20) },
    { t: 0.25, pos: v(0, 0, 2), look: v(0, 0, -40) },
    // corredor de entrada até a primeira sala
    { t: 0.3, pos: v(0, -0.3, -40), look: v(0, 0, -100) },
  ];

  interiors.forEach((room, k) => {
    const zc = roomCenterZ(k);
    // câmera à esquerda e atrás, olhando para o "objeto principal" à direita da sala
    stops.push({ t: room.from, pos: v(-2.6, -0.7, zc + 9), look: v(3.6, -0.4, zc - 6) });
    stops.push({ t: room.to, pos: v(-1.4, -0.5, zc + 8), look: v(4.4, -0.2, zc - 6) });

    // meio do corredor até a próxima sala (centralizado, olhando para frente)
    const next = interiors[k + 1];
    if (next) {
      stops.push({
        t: (room.to + next.from) / 2,
        pos: v(0, -0.3, zc - ROOM_D / 2 - 9),
        look: v(0, 0, zc - ROOM_D / 2 - 40),
      });
    }
  });
  return stops;
}

/** Suavização leve: começa e termina devagar, mas sem "freada" total nos pontos de passagem */
const ease = (f: number) => f + (f * f * (3 - 2 * f) - f) * 0.6;

export class CameraPath {
  private readonly stops = buildStops();
  private readonly posCurve = new THREE.CatmullRomCurve3(this.stops.map((s) => s.pos), false, 'centripetal');
  private readonly lookCurve = new THREE.CatmullRomCurve3(this.stops.map((s) => s.look), false, 'centripetal');

  /** Posição e alvo da câmera para um progresso entre 0 e 1 */
  at(progress: number, outPos: THREE.Vector3, outLook: THREE.Vector3): void {
    const { stops } = this;
    const last = stops.length - 1;
    const p = Math.min(Math.max(progress, stops[0].t), stops[last].t);

    let k = 0;
    while (k < last - 1 && p > stops[k + 1].t) k++;

    const span = stops[k + 1].t - stops[k].t;
    const f = span > 0 ? (p - stops[k].t) / span : 0;
    const u = (k + ease(f)) / last;

    this.posCurve.getPoint(u, outPos);
    this.lookCurve.getPoint(u, outLook);
  }
}
