import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// No ecossitema Angular o "Bootstrap" significa "inicializar" ou "dar partida"
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
