# MemoryGraph Frontend

This folder contains the Next.js frontend for the MemoryGraph application.

## Available Scripts

- `npm run dev` — starts the development server using Webpack
- `npm run dev:turbo` — starts the dev server using Turbopack
- `npm run build` — builds the production app
- `npm run start` — starts the production server after build
- `npm run lint` — runs ESLint
- `npm run lint:fix` — fixes lint issues automatically
- `npm run test:e2e` — runs Playwright end-to-end tests

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open the app in your browser:

```text
http://localhost:3000
```

4. Edit pages in `app/` and the browser will refresh automatically.

## Project Details

- Next.js `16.2.6`
- React `19.2.4`
- TypeScript support with `typescript` and `@types/*`
- Tailwind CSS v4 for styling
- Playwright for browser-based end-to-end testing
- `@tanstack/react-query` for client-side data fetching
- `d3` for visualization and charts

## Notes

- The main app entry is `app/page.tsx`.
- This repository uses `next dev --webpack` by default, with an optional `dev:turbo` mode.
- Use `npm run build` before deploying or running the production server.

> Note: Updated by GitHub contribution automation.
