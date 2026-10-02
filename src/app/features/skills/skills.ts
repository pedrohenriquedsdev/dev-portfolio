import { Component } from '@angular/core';
import { SKILL_CATEGORIES } from '../../data/skills';

/** Lista de tecnologias e práticas, agrupadas por categoria, exibida na sala Engine room. */
@Component({
  selector: 'app-skills',
  templateUrl: './skills.html',
})
export class Skills {
  protected readonly categories = SKILL_CATEGORIES;
}
