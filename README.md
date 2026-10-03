# Portfolio 2026

Personal portfolio of Pedro Henrique dos Santos, built as an immersive space station: scroll drives the camera through the station, into the corridors and into each room, where the content lives.

## Stack

- Angular 22 (standalone components, signals)
- TypeScript
- Tailwind CSS 4
- Three.js (3D scene, lazy loaded)

## Getting started

```bash
npm install
npm start
```

Open `http://localhost:4200/`.

## Build

```bash
npm run build
```

The production output is in `dist/portfolio-2026/browser`.

## Structure

- `src/app/data/`: content (projects, skills, experience) and icon mapping
- `src/app/features/`: one component per room (Home, About, Projects, Skills, Experience, Resume, Contact)
- `src/app/scene/`: the Three.js scene (station, rooms, camera path, lights)
- `src/app/core/`: scroll-to-progress state
- `public/`: static assets served as-is (site icon)
