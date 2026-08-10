# SCC 2 — Frontend

Next.js (App Router) frontend for the SCC venue booking app. Ports the SCC 2
wireframe into a fully functional UI wired to the [SCC backend](../backend).

Stack: **Next.js 16 + React 19 + TypeScript + Tailwind v4**. Auth via JWT held
in `localStorage`; all data comes from the backend REST API (CORS-enabled), so
pages are client components that fetch on mount.

## Run it

The backend must be running first (default `http://localhost:4000`).

```bash
# 1) backend (in ../backend)
cd ../backend
# .env has PORT=4000
npm run seed        # once — creates admin@scc.example.com / admin12345 + sample data
npm run start:dev   # or: node dist/main.js

# 2) frontend (here)
npm install
npm run dev         # http://localhost:3001
```

Configure the backend origin in `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Pages

| Route | Who | What |
| --- | --- | --- |
| `/` | public | Marketing home |
| `/venue` | public | Rooms + technical specs |
| `/booking` | public | Submit an inquiry (guest or logged-in) |
| `/login`, `/register` | public | Auth |
| `/profile` | customer | Account info + My Bookings (pay / upload proof / cancel) |
| `/pay/[token]` | public | Tokenized payment page — transfer info + proof upload |
| `/admin` | admin | Dashboard (stats, chart, recent inquiries) |
| `/admin/inquiries` | admin | Filter + full state-machine actions (price, link, approve/reject, cancel) |
| `/admin/rooms` | admin | Room CRUD (facilities, specs) |
| `/admin/addons` | admin | Add-on CRUD |
| `/admin/settings` | admin | Venue / payment (bank + QR upload) / notifications |

## Browser tests (Playwright)

```bash
npm run test:e2e     # starts the frontend automatically; backend must be up on :4000
```
