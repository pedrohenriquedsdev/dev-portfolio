import { Component, inject, signal } from '@angular/core';
import { Header } from './layout/header/header';
import { Home } from './features/home/home';
import { RoomPanel } from './features/room-panel/room-panel';
import { Stage } from './features/stage/stage';
import { JourneyService } from './core/journey.service';

@Component({
  imports: [Header, Home, RoomPanel, Stage], // = diz ao componente quais recursos do angular ele pode usar dentro do templateUrl
  selector: 'app-root', // = nome usado no HTML para chamar o componente
  styleUrl: './app.css', // = aponta para página de estilo
  templateUrl: './app.html', // = aponta para arquivo de estrutura
})
export class App {
  protected readonly title = signal('portfolio-2026');
  protected readonly journey = inject(JourneyService);
  protected readonly links = this.journey.rooms.map((room) => room.label);
}
