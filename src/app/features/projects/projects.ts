import { Component } from '@angular/core';
import { PROJECTS } from '../../data/projects';

/** Lista de projetos exibida na sala Laboratory. */
@Component({
  selector: 'app-projects',
  templateUrl: './projects.html',
})
export class Projects {
  protected readonly projects = PROJECTS;
}
