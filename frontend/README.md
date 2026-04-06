# Frontend (React + Vite) - Dev Guide

React + TypeScript PWA for Ultimate Frisbee Stats. This doc is intentionally short and focused on local development.

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` and expects the backend at `http://localhost:8000`.

## Configuration

The API base URL is controlled by `VITE_API_BASE_URL`.

```bash
cp .env.example .env
# set VITE_API_BASE_URL if you want a non-default backend
```

For the authentication foundation, the frontend also expects:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Tests and Build

```bash
npm test
npm run test:coverage
npm run build
```

## Project Layout

- `src/components/` UI components organized by domain
- `src/pages/` route pages
- `src/services/` API clients per entity
- `src/types/` shared TypeScript types
- `src/test/` MSW and test utilities
- `src/locales/` i18n resources

## Conventions

- Material UI v7 with semantic theme values only (no hardcoded colors)
- Dialog form state: initialize from props and use `key={id}` to force remounts
- i18n via react-i18next; sport terms remain in English (see `GLOSSARY.md`)

## More Docs

- `requirements.md` for feature requirements
- `data-model-design.md` for the full data model
- `DEPLOYMENT.md` for deployment steps
