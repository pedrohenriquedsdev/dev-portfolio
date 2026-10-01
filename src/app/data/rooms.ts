/** Uma "parada" da jornada: o trecho do scroll (from..to, de 0 a 1) em que a câmera fica parada nesta sala. */
export interface Room {
  id: string;
  /** Texto do menu */
  label: string;
  /** Nome do compartimento da estação */
  compartment: string;
  from: number;
  to: number;
}

export const ROOMS: readonly Room[] = [
  { id: 'home', label: 'Home', compartment: 'Exterior', from: 0, to: 0.1 },
  { id: 'about', label: 'About me', compartment: 'Crew quarters', from: 0.34, to: 0.41 },
  { id: 'projects', label: 'Projects', compartment: 'Laboratory', from: 0.45, to: 0.52 },
  { id: 'skills', label: 'Skills', compartment: 'Engine room', from: 0.56, to: 0.63 },
  { id: 'experience', label: 'Experience', compartment: 'Mission log', from: 0.67, to: 0.74 },
  { id: 'resume', label: 'Resume', compartment: 'Docking bay', from: 0.78, to: 0.85 },
  { id: 'contact', label: 'Contact', compartment: 'Cockpit', from: 0.89, to: 0.96 },
];
