# Animathix Frontend

This app provides the public landing page, lightweight local login flow, and the create-video experience for Animathix.

## Run locally

```bash
npm install
npm run dev
```

The app runs on `http://localhost:3000` by default.

## Environment

Set `NEXT_PUBLIC_API_URL` if the backend is not running at `http://localhost:8000`.

## Useful commands

```bash
npm run lint
npm run build
```

## Key files

- `src/app/page.tsx` - landing page
- `src/app/login/page.tsx` - local sign-in screen
- `src/app/create/page.tsx` - video generation flow
- `src/lib/api.ts` - backend API helpers

See the repository root `README.md` for the full-stack setup and `docs/architecture.md` for the service flow.
