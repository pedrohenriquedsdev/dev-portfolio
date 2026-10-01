import { Component, computed, signal } from '@angular/core';

@Component({
  imports: [], // = diz ao componente quais recursos do angular ele pode usar dentro do templateUrl
  selector: 'app-root', // = nome usado no HTML para chamar o componente
  styleUrl: './app.css', // = aponta para página de estilo
  templateUrl: './app.html', // = aponta para arquivo de estrutura
})
export class App {
  changeTitle() {
    this.title.set('Meu Portfólio');
  }

  protected readonly titleDescription = computed(() => {
    return `Projeto: ${this.title()}`;
  });

  protected readonly title = signal('portfolio-2026');
}



