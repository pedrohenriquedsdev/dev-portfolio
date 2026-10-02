import { Component } from '@angular/core';

/** Conteúdo da sala Crew quarters: biografia e áreas de foco/interesse. */
@Component({
  selector: 'app-about',
  templateUrl: './about.html',
})
export class About {
  protected readonly focus = ['C#', '.NET', 'TypeScript', 'ASP.NET Core', 'Angular'];
  protected readonly interests = [
    'Automated testing',
    'Messaging',
    'Software architecture',
    'Systems engineering',
  ];
  protected readonly exploring = ['Rust', 'C++', 'Kotlin', 'Python'];
}
