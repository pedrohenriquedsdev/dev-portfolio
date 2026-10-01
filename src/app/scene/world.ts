import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CameraPath } from './camera-path';
import { INTERIOR_START_Z, Interiors, ROOM_LIGHT_COLORS, ROOM_SPACING, createInteriors, roomCenterZ } from './interior';
import { COLORS } from './materials';
import { createStarfield } from './starfield';
import { Station, createStation } from './station';

/** Progresso em que o exterior some e o interior aparece (a câmera está dentro do hub, no escuro) */
const INTERIOR_ON = 0.2;
const EXTERIOR_OFF = 0.27;

/** Níveis de qualidade: a World desce de nível sozinha se o computador não acompanhar */
const QUALITY = [
  { pixelRatio: 1.5, bloom: true, smaa: true },
  { pixelRatio: 1, bloom: true, smaa: false },
  { pixelRatio: 0.85, bloom: false, smaa: false },
] as const;

const yieldToBrowser = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * O mundo 3D: cena, câmera, luzes, pós-processamento e o loop de desenho.
 * Não depende do Angular: o componente Stage só cria, alimenta com o progresso do scroll e destrói.
 */
export class World {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(55, 1, 0.1, 3000);
  private readonly composer: EffectComposer;
  private readonly bloom: UnrealBloomPass;
  private readonly smaa: SMAAPass;

  private readonly path = new CameraPath();
  private readonly sun = new THREE.DirectionalLight(0xffd9a8, 2.4);
  private readonly hemi = new THREE.HemisphereLight(0x8aa8ff, 0x101828, 0.18);

  // Poucas luzes que acompanham a câmera: o custo de cada luz é pago por pixel,
  // então em vez de uma luz por sala usamos 3 que se movem e mudam de cor com a sala atual.
  private readonly keyLight = new THREE.PointLight(0xffffff, 0, 45, 2);
  private readonly featureLight = new THREE.PointLight(0xffffff, 0, 36, 2);
  private readonly backLight = new THREE.PointLight(0xffffff, 0, 30, 2);
  private readonly tint = new THREE.Color(ROOM_LIGHT_COLORS[0]);
  private readonly tintTarget = new THREE.Color();

  private readonly clock = new THREE.Clock();
  private readonly pos = new THREE.Vector3();
  private readonly look = new THREE.Vector3();

  private progress = 0; // valor suavizado usado na câmera
  private pointerX = 0; // -1 a 1
  private pointerY = 0;
  private swayX = 0;
  private swayY = 0;
  private frame = 0;
  private frames = 0;
  private avgDelta = 1 / 60;
  private quality = 0;
  private readonly reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Cria o mundo em etapas, cedendo o controle ao navegador entre elas (a tela de loading
   * continua animando) e avisando o progresso de 0 a 1.
   */
  static async create(
    canvas: HTMLCanvasElement,
    getTarget: () => number,
    onProgress: (progress: number) => void,
  ): Promise<World> {
    onProgress(0.05);
    await yieldToBrowser();
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    onProgress(0.12);
    await yieldToBrowser();
    const station = createStation();
    onProgress(0.2);
    await yieldToBrowser();

    // salas: ocupam a maior parte da barra de progresso
    const interiors = await createInteriors((done, total) => onProgress(0.2 + (done / total) * 0.6));

    onProgress(0.82);
    await yieldToBrowser();
    const world = new World(renderer, station, interiors, getTarget);

    // compila os shaders antes de mostrar a cena, para não haver travada no meio da viagem
    onProgress(0.9);
    await world.prepare();
    onProgress(1);
    return world;
  }

  private constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly station: Station,
    private readonly interiors: Interiors,
    private readonly getTarget: () => number,
  ) {
    this.scene.background = new THREE.Color(COLORS.space);
    this.scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.3;

    // luzes do exterior: sol quente + preenchimento azul frio vindo do lado oposto
    this.sun.position.set(90, 70, 120);
    const fill = new THREE.DirectionalLight(0x6a8cff, 0.55);
    fill.position.set(-80, -30, -60);
    this.scene.add(this.sun, fill, this.hemi, this.keyLight, this.featureLight, this.backLight);

    // estrelas ficam centradas na câmera: parecem infinitamente distantes
    this.stars = createStarfield();
    this.scene.add(this.stars, station.group, interiors.group);

    // pós-processamento: o bloom faz brilhar tudo que emite luz forte (janelas, telas, reator)
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.6, 1.2);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.smaa = new SMAAPass();
    this.composer.addPass(this.smaa);

    this.applyQuality();
    window.addEventListener('resize', this.resize);
    window.addEventListener('pointermove', this.onPointer, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  private readonly stars: THREE.Points;

  /** Compila os shaders com tudo visível e desenha o primeiro quadro; depois liga o loop */
  private async prepare(): Promise<void> {
    this.interiors.group.visible = true;
    this.station.group.visible = true;
    this.interiors.cull(0); // mostra tudo para o compilador enxergar todos os materiais
    for (const part of this.interiors.group.children) part.visible = true;
    this.keyLight.intensity = this.featureLight.intensity = this.backLight.intensity = 1;
    await this.renderer.compileAsync(this.scene, this.camera);
    this.progress = this.getTarget();
    this.clock.start();
    this.frame = requestAnimationFrame(this.loop);
  }

  /** Aplica o nível de qualidade atual: resolução e efeitos */
  private applyQuality(): void {
    const q = QUALITY[this.quality];
    this.pixelRatio = Math.min(window.devicePixelRatio, q.pixelRatio);
    this.bloom.enabled = q.bloom;
    this.smaa.enabled = q.smaa;
    this.resize();
  }
  private pixelRatio = 1;

  private readonly resize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(this.pixelRatio);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    // em telas estreitas (celular) abre o campo de visão para a estação caber
    this.camera.fov = w / h < 0.8 ? 70 : 55;
    this.camera.updateProjectionMatrix();
  };

  private readonly onPointer = (e: PointerEvent): void => {
    this.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointerY = (e.clientY / window.innerHeight) * 2 - 1;
  };

  /** Pausa o loop com a aba escondida (economiza bateria) */
  private readonly onVisibility = (): void => {
    if (document.hidden) {
      cancelAnimationFrame(this.frame);
    } else {
      this.clock.getDelta();
      this.frame = requestAnimationFrame(this.loop);
    }
  };

  /** Se o computador não acompanha (média de quadros lenta), desce um nível de qualidade */
  private watchPerformance(delta: number): void {
    this.frames++;
    this.avgDelta += (delta - this.avgDelta) * 0.05;
    if (this.frames % 90 === 0 && this.frames > 120 && this.avgDelta > 0.026 && this.quality < QUALITY.length - 1) {
      this.quality++;
      this.applyQuality();
    }
  }

  private readonly loop = (): void => {
    this.frame = requestAnimationFrame(this.loop);
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.elapsedTime;
    this.watchPerformance(delta);

    // progresso suavizado (amortecimento exponencial: independente da taxa de quadros)
    this.progress += (this.getTarget() - this.progress) * (1 - Math.exp(-delta * 5));
    const p = this.progress;

    // o que precisa existir em cada fase da viagem
    const inside = p > INTERIOR_ON;
    const outside = p < EXTERIOR_OFF;
    this.interiors.group.visible = inside;
    this.station.group.visible = outside;
    const insideFactor = THREE.MathUtils.clamp((p - INTERIOR_ON) / 0.06, 0, 1);
    this.sun.intensity = 2.4 * THREE.MathUtils.clamp((EXTERIOR_OFF - p) / 0.06, 0, 1);
    this.hemi.intensity = 0.18 + 0.4 * insideFactor;

    if (outside) this.station.update(time, delta);

    // câmera: posição e alvo vêm da trilha
    this.path.at(p, this.pos, this.look);
    this.camera.position.copy(this.pos);
    this.camera.lookAt(this.look);

    if (inside) {
      this.interiors.update(time);
      this.interiors.cull(this.pos.z);
      this.updateRoomLights(delta, insideFactor);
    } else {
      this.keyLight.intensity = this.featureLight.intensity = this.backLight.intensity = 0;
    }

    // o mouse adiciona um balanço suave por cima da trilha
    if (!this.reduceMotion) {
      this.swayX += (this.pointerX - this.swayX) * (1 - Math.exp(-delta * 3));
      this.swayY += (this.pointerY - this.swayY) * (1 - Math.exp(-delta * 3));
      const scale = outside ? 1 : 0.35; // dentro das salas o balanço é mais contido
      this.camera.rotateY(-this.swayX * 0.05 * scale);
      this.camera.rotateX(-this.swayY * 0.035 * scale);
      this.camera.translateX(this.swayX * 1.2 * scale);
      this.camera.translateY(-this.swayY * 0.7 * scale);
    }

    this.stars.position.copy(this.camera.position);
    this.composer.render();
  };

  /** Move as 3 luzes para junto da sala atual e mistura a cor da sala anterior com a nova */
  private updateRoomLights(delta: number, insideFactor: number): void {
    const index = THREE.MathUtils.clamp(
      Math.round((INTERIOR_START_Z - this.pos.z) / ROOM_SPACING),
      0,
      ROOM_LIGHT_COLORS.length - 1,
    );
    this.tintTarget.set(ROOM_LIGHT_COLORS[index]);
    this.tint.lerp(this.tintTarget, 1 - Math.exp(-delta * 3));

    const zc = roomCenterZ(index);
    this.keyLight.color.copy(this.tint);
    this.featureLight.color.copy(this.tint);
    this.backLight.color.setHex(0xbfd4ff);

    this.keyLight.position.set(this.pos.x + 0.5, 3.4, this.pos.z - 3);
    this.featureLight.position.set(3.8, -0.4, zc - 6); // onde fica o objeto principal da sala
    this.backLight.position.set(this.pos.x, 2.5, this.pos.z + 5);

    this.keyLight.intensity = 140 * insideFactor;
    this.featureLight.intensity = 260 * insideFactor;
    this.backLight.intensity = 60 * insideFactor;
  }

  dispose(): void {
    cancelAnimationFrame(this.frame);
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('pointermove', this.onPointer);
    document.removeEventListener('visibilitychange', this.onVisibility);

    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
        obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          for (const value of Object.values(m)) if (value instanceof THREE.Texture) value.dispose();
          m.dispose();
        }
      }
    });
    this.composer.dispose();
    this.renderer.dispose();
  }
}
