import { Component, input, output } from '@angular/core';

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

  protected select(event: Event, index: number): void {
    event.preventDefault();
    this.selected.emit(index);
  }
}
