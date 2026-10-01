import { Component, signal } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-root', // = nome usado no HTML para chamar o componente
  styleUrl: './app.css', // = aponta para página de estilo
  templateUrl: './app.html', // = aponta para arquivo de estrutura
})
export class App {
  protected readonly title = signal('portfolio-2026');
}
