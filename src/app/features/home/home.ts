import { Component, DestroyRef, ElementRef, afterNextRender, inject } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {
  // Painéis que formam a estação (só dados para o @for do template)
  protected readonly ringPanels = Array.from({ length: 36 }, (_, i) => i);
  protected readonly hubPanels = Array.from({ length: 12 }, (_, i) => i);
  protected readonly spokes = Array.from({ length: 6 }, (_, i) => i);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    const destroyRef = inject(DestroyRef);

    // afterNextRender: só roda no navegador, depois do primeiro desenho (existe window/document)
    afterNextRender(() => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      // Elementos que reagem ao mouse. data-depth = distância em px do deslocamento;
      // data-camera = a estação, que inclina em vez de deslocar.
      const layers = Array.from(document.querySelectorAll<HTMLElement>('[data-depth]'));
      const camera = this.host.nativeElement.querySelector<HTMLElement>('[data-camera]');

      let targetX = 0; // posição do mouse (-1 a 1)
      let targetY = 0;
      let x = 0; // valor suavizado que a tela realmente usa
      let y = 0;
      let frame = 0;
      let running = false;

      // Escrevemos transform direto nos elementos (sem variáveis CSS globais): mudar uma variável
      // no <html> invalida o estilo da página inteira a cada frame, e isso causava travadas.
      const render = () => {
        for (const el of layers) {
          const depth = Number(el.dataset['depth']);
          el.style.transform = `translate3d(${(-x * depth).toFixed(2)}px, ${(-y * depth).toFixed(2)}px, 0)`;
        }
        if (camera) {
          camera.style.transform = `rotateX(${(-18 - y * 12).toFixed(2)}deg) rotateY(${(x * 22).toFixed(2)}deg)`;
        }
      };

      // Interpolação (lerp): anda 8% da distância por frame, dando inércia ao movimento.
      // O loop só roda enquanto há movimento a fazer: parado, não gasta nada.
      const tick = () => {
        x += (targetX - x) * 0.08;
        y += (targetY - y) * 0.08;
        render();
        if (Math.abs(targetX - x) > 0.0005 || Math.abs(targetY - y) > 0.0005) {
          frame = requestAnimationFrame(tick);
        } else {
          running = false;
        }
      };

      const onMove = (e: PointerEvent) => {
        targetX = (e.clientX / window.innerWidth) * 2 - 1;
        targetY = (e.clientY / window.innerHeight) * 2 - 1;
        if (!running) {
          running = true;
          frame = requestAnimationFrame(tick);
        }
      };

      window.addEventListener('pointermove', onMove, { passive: true });

      destroyRef.onDestroy(() => {
        cancelAnimationFrame(frame);
        window.removeEventListener('pointermove', onMove);
      });
    });
  }
}
