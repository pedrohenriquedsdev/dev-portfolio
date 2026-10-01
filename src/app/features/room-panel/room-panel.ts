import { Component, input } from '@angular/core';

/** Painel de conteúdo de uma sala (por enquanto só título; o conteúdo real entra por seção) */
@Component({
  selector: 'app-room-panel',
  templateUrl: './room-panel.html',
})
export class RoomPanel {
  readonly compartment = input.required<string>();
  readonly title = input.required<string>();
  readonly index = input.required<number>();
}
