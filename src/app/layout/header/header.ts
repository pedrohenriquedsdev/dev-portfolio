import { Component, ElementRef, effect, input, output, viewChildren } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  readonly nome = input.required<string>();
  readonly links = input<string[]>([]);
  /** Índice do link da sala atual (destacado no menu) */
  readonly active = input(0);
  /** Avisa o pai qual link foi clicado: quem decide o que fazer (viajar de sala) é o pai */
  readonly selected = output<number>();

  /** Um por link do menu, na mesma ordem (usados para rolar o ativo até a vista) */
  private readonly linkEls = viewChildren<ElementRef<HTMLAnchorElement>>('link');

  constructor() {
    // em telas estreitas o menu rola na horizontal: mantém o link da sala atual visível
    effect(() => {
      this.linkEls()[this.active()]?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    });
  }

  protected select(event: Event, index: number): void {
    event.preventDefault();
    this.selected.emit(index);
  }
}
