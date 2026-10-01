import { Component, DestroyRef, afterNextRender, inject } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {
  // Painéis que formam o anel da estação (só dados para o @for do template)
  protected readonly ringPanels = Array.from({ length: 36 }, (_, i) => i);
  protected readonly hubPanels = Array.from({ length: 12 }, (_, i) => i);
  protected readonly spokes = Array.from({ length: 6 }, (_, i) => i);

  constructor() {
    const destroyRef = inject(DestroyRef);

    // afterNextRender: só roda no navegador, depois do primeiro desenho (existe window/document)
    afterNextRender(() => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const root = document.documentElement;
      let targetX = 0; // para onde o mouse está (-1 a 1)
      let targetY = 0;
      let x = 0; // valor suavizado que a tela realmente usa
      let y = 0;
      let frame = 0;

      const onMove = (e: PointerEvent) => {
        targetX = (e.clientX / window.innerWidth) * 2 - 1;
        targetY = (e.clientY / window.innerHeight) * 2 - 1;
      };

      // Interpolação (lerp): anda 6% da distância por frame, o que dá a sensação de inércia
      const tick = () => {
        x += (targetX - x) * 0.06;
        y += (targetY - y) * 0.06;
        root.style.setProperty('--mx', x.toFixed(4));
        root.style.setProperty('--my', y.toFixed(4));
        frame = requestAnimationFrame(tick);
      };

      window.addEventListener('pointermove', onMove, { passive: true });
      frame = requestAnimationFrame(tick);

      destroyRef.onDestroy(() => {
        cancelAnimationFrame(frame);
        window.removeEventListener('pointermove', onMove);
        root.style.removeProperty('--mx');
        root.style.removeProperty('--my');
      });
    });
  }
}
