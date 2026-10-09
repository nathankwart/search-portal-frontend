# Search portal

Buyer app for the China supplier sourcing platform. It runs at `http://localhost:5174` and talks only to the API in `backend/` (default `http://localhost:4000/api/v1`). Supabase JS is used for sign-in, sign-up, and session refresh. Catalog, cart, and inquiry data come from the API.

## Setup

1. Start the API (`backend/README.md`) and import the sample supplier file from the admin portal.
2. Copy `.env.example` to `.env` and set the API URL plus the Supabase URL and anon key.
3. From this folder:

```bash
pnpm install
pnpm dev
```

`pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` check the app. Sign-in is required unless an admin turns on public search. Buyer self-signup appears only when `allowBuyerSignup` is true.

Prices shown here are supplier prices in China. A header currency toggle, when exchange rates exist, labels converted amounts as approximate. There is no checkout, freight, or landed-cost calculation.
