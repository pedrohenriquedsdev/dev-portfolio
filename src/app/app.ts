import { Component, signal } from '@angular/core';
import { Header } from './layout/header/header';
import { Home } from './features/home/home';

@Component({
  imports: [Header, Home], // = diz ao componente quais recursos do angular ele pode usar dentro do templateUrl
  selector: 'app-root', // = nome usado no HTML para chamar o componente
  styleUrl: './app.css', // = aponta para página de estilo
  templateUrl: './app.html', // = aponta para arquivo de estrutura
})
export class App {
  protected readonly title = signal('portfolio-2026');
  protected readonly links = ['Home', 'About me', 'Projects', 'Skills', 'Experience', 'Resume', 'Contact'];
}



