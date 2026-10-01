import { Component, DestroyRef, ElementRef, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { JourneyService } from '../../core/journey.service';

/**
 * O palco: um <canvas> em tela cheia, atrás de todo o conteúdo, onde o Three.js desenha a estação.
 * Também mostra a tela de loading enquanto o mundo 3D é carregado e construído.
 *
 * O Three.js é importado com import() dinâmico: vira um arquivo separado, baixado depois que a
 * página já apareceu. Assim o loading surge rápido em vez de uma tela em branco.
 */
@Component({
  selector: 'app-stage',
  templateUrl: './stage.html',
})
export class Stage {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly journey = inject(JourneyService);

  protected readonly progress = signal(0);
  protected readonly percent = computed(() => Math.round(this.progress() * 100));
  protected readonly ready = signal(false);
  /** Depois do fade-out o loader sai do DOM */
  protected readonly removed = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);

    // afterNextRender: só no navegador e depois que o <canvas> existe
    afterNextRender(() => {
      let destroyed = false;
      let dispose: (() => void) | undefined;

      // a viagem sempre começa do topo, e o scroll fica travado até o mundo estar pronto
      history.scrollRestoration = 'manual';
      window.scrollTo(0, 0);
      document.documentElement.style.overflow = 'hidden';
      const disconnect = this.journey.connect();

      const start = async () => {
        try {
          const { World } = await import('../../scene/world');
          const world = await World.create(this.canvas().nativeElement, () => this.journey.progress(), (p) =>
            this.progress.set(p),
          );
          if (destroyed) {
            world.dispose();
            return;
          }
          dispose = () => world.dispose();
        } catch (error) {
          console.error('Could not start the 3D scene', error);
        } finally {
          document.documentElement.style.overflow = '';
          this.ready.set(true);
          setTimeout(() => this.removed.set(true), 900);
        }
      };
      void start();

      destroyRef.onDestroy(() => {
        destroyed = true;
        disconnect();
        dispose?.();
        document.documentElement.style.overflow = '';
      });
    });
  }
}
