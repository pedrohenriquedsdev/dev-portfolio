import { Injectable, computed, signal } from '@angular/core';
import { ROOMS } from '../data/rooms';

/**
 * Estado da jornada: o scroll da página vira "progresso" (0 a 1) e o progresso decide
 * em qual sala a câmera está. Quem consome: o Stage (move a câmera) e o App (mostra o conteúdo).
 */
@Injectable({ providedIn: 'root' })
export class JourneyService {
  /** Altura do trecho rolável, em telas. Mais telas = viagem mais lenta. */
  readonly scrollScreens = 11;

  readonly rooms = ROOMS;
  readonly progress = signal(0);

  /** Índice da sala cujo trecho contém o progresso atual (-1 durante as viagens entre salas) */
  readonly activeIndex = computed(() => {
    const p = this.progress();
    return this.rooms.findIndex((r) => p >= r.from - 0.012 && p <= r.to + 0.012);
  });

  /** Sala mais próxima: usada para destacar o menu mesmo durante a viagem */
  readonly nearestIndex = computed(() => {
    const p = this.progress();
    let best = 0;
    let bestDist = Infinity;
    this.rooms.forEach((r, i) => {
      const dist = Math.abs(p - (r.from + r.to) / 2);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    return best;
  });

  private frame = 0;

  /** Começa a ouvir o scroll. Retorna a função que para de ouvir. */
  connect(): () => void {
    const update = () => {
      this.frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      this.progress.set(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    // Agrupa os eventos de scroll: no máximo 1 atualização por frame
    const onScroll = () => {
      if (!this.frame) this.frame = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();

    return () => {
      cancelAnimationFrame(this.frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }

  /** Rola a página até o meio do trecho da sala (a câmera viaja até lá) */
  goTo(index: number): void {
    const room = this.rooms[index];
    if (!room) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const target = ((room.from + room.to) / 2) * max;
    window.scrollTo({ top: target, behavior: 'smooth' });
  }
}
