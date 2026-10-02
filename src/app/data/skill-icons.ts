/**
 * Mapa tecnologia → slug do skillicons.dev (https://skillicons.dev).
 * Só entram aqui tecnologias com um ícone real confirmado no catálogo deles;
 * o resto (ex.: MassTransit, FluentValidation, SOLID) não tem logo reconhecido lá,
 * então fica sem ícone em vez de usar um errado.
 */
const SKILL_ICON_SLUGS: Readonly<Record<string, string>> = {
  'C#': 'cs',
  '.NET': 'net',
  TypeScript: 'ts',
  JavaScript: 'js',
  'C++': 'cpp',
  Rust: 'rust',
  Kotlin: 'kotlin',
  Python: 'py',
  HTML: 'html',
  CSS: 'css',
  Angular: 'angular',
  'Node.js': 'nodejs',
  FastAPI: 'fastapi',
  Flask: 'flask',
  Django: 'django',
  GraphQL: 'graphql',
  Sass: 'sass',
  Bootstrap: 'bootstrap',
  Tailwind: 'tailwind',
  React: 'react',
  Vue: 'vue',
  'Next.js': 'next',
  Redux: 'redux',
  'Android Studio': 'androidstudio',
  PostgreSQL: 'postgres',
  MySQL: 'mysql',
  SQLite: 'sqlite',
  MongoDB: 'mongo',
  Redis: 'redis',
  Elasticsearch: 'elasticsearch',
  Firebase: 'firebase',
  Supabase: 'supabase',
  Prisma: 'prisma',
  RabbitMQ: 'rabbitmq',
  Kafka: 'kafka',
  Jest: 'jest',
  Vitest: 'vitest',
  Cypress: 'cypress',
  Selenium: 'selenium',
  Postman: 'postman',
  Azure: 'azure',
  AWS: 'aws',
  Docker: 'docker',
  Kubernetes: 'k8s',
  'GitHub Actions': 'ghactions',
  Git: 'git',
  GitHub: 'github',
  GitLab: 'gitlab',
  Nginx: 'nginx',
  Linux: 'linux',
  Terraform: 'terraform',
  Grafana: 'grafana',
  Prometheus: 'prometheus',
  'Visual Studio': 'visualstudio',
  'VS Code': 'vscode',
  Rider: 'rider',
  'IntelliJ IDEA': 'idea',
  Figma: 'figma',
  Notion: 'notion',
  PowerShell: 'pwsh',
  Bash: 'bash',
};

/** URL do ícone no skillicons.dev, ou null quando a tecnologia não tem um ícone reconhecido lá. */
export function skillIconUrl(name: string): string | null {
  const slug = SKILL_ICON_SLUGS[name];
  return slug ? `https://skillicons.dev/icons?i=${slug}&theme=dark` : null;
}

/** Monograma usado como "ícone" de respaldo quando a tecnologia não tem logo no skillicons.dev. */
export function skillInitials(name: string): string {
  const words = name.replace(/[^A-Za-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (words[0] ?? '?').slice(0, 2).toUpperCase();
}
