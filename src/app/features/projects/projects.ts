import { Component } from '@angular/core';
import { PROJECTS } from '../../data/projects';
import { skillIconUrl, skillInitials } from '../../data/skill-icons';

/** Lista de projetos exibida na sala Laboratory. */
@Component({
  selector: 'app-projects',
  templateUrl: './projects.html',
})
export class Projects {
  protected readonly projects = PROJECTS;
  protected readonly icon = skillIconUrl;
  protected readonly initials = skillInitials;
}
