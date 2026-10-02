import { Component } from '@angular/core';
import { skillIconUrl, skillInitials } from '../../data/skill-icons';

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
  protected readonly icon = skillIconUrl;
  protected readonly initials = skillInitials;
}
