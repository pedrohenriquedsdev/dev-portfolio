/** Um projeto do portfólio, exibido na sala Laboratory. */
export interface Project {
  name: string;
  description: string;
  stack: readonly string[];
  role: string;
  link: string;
  status: 'completed' | 'in-progress';
}

export const PROJECTS: readonly Project[] = [
  {
    name: 'Online Certificate Generator',
    description:
      'An online certificate generator that automates the creation of PDF certificates and ZIP files for fast and convenient downloads.',
    stack: ['C#', '.NET', 'RabbitMQ', 'MassTransit', 'Docker'],
    role: 'Pair programming',
    link: 'https://github.com/netos-do-velho-barrero/online-certificate-generator-adp',
    status: 'in-progress',
  },
  {
    name: 'Bar Management System',
    description:
      'A system built with C# and .NET applying object-oriented design, software architecture, business rules, data persistence and API development, with a multi-tenancy highlight.',
    stack: ['C#', '.NET'],
    role: 'Pair programming',
    link: 'https://github.com/netos-do-velho-barrero/bar-management-system',
    status: 'completed',
  },
  {
    name: 'Medication Control Web',
    description: 'A web application for medication control.',
    stack: [
      'ASP.NET MVC (.NET 8)',
      'C#',
      'Razor',
      'TagHelpers',
      'DataAnnotations',
      'AutoMapper',
      'Dependency Injection',
      'JSON',
      'Bootstrap',
    ],
    role: 'Pair programming',
    link: 'https://github.com/netos-do-velho-barrero/medication-control-web-adp',
    status: 'completed',
  },
  {
    name: 'E-Agenda Web',
    description: 'A web application for schedule and appointment management.',
    stack: [
      'ASP.NET MVC (.NET 8)',
      'C#',
      'Razor',
      'TagHelpers',
      'DataAnnotations',
      'AutoMapper',
      'Dependency Injection',
      'JSON',
      'Bootstrap',
    ],
    role: 'Pair programming',
    link: 'https://github.com/netos-do-velho-barrero/e-agenda-web-adp',
    status: 'completed',
  },
];
