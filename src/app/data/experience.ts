/** Uma experiência exibida na sala Mission log. */
export interface ExperienceEntry {
  organization: string;
  role: string;
  period: string;
  highlights: readonly string[];
}

export const EXPERIENCE: readonly ExperienceEntry[] = [
  {
    organization: 'Academia do Programador',
    role: 'Student / Fullstack Developer',
    period: 'March 2026 – December 2026',
    highlights: [
      'Fullstack development throughout the program',
      'Built projects using Microsoft ecosystem technologies',
      'Worked in pair programming',
      'Supported fellow students during the program',
    ],
  },
];
