import { Component } from '@angular/core';
import { EXPERIENCE } from '../../data/experience';

/** Linha do tempo exibida na sala Mission log. */
@Component({
  selector: 'app-experience',
  templateUrl: './experience.html',
})
export class Experience {
  protected readonly experience = EXPERIENCE;
}
