# 🎲 FunBet

A lighthearted, play-money prediction market for friend groups. Create a private
room, share an invite link, and bet fake coins on yes/no questions — parimutuel
style, so the odds shift as your friends pile in.

**No real money. No accounts. Just bragging rights.**

## How it works

1. Create a room and set the starting coin balance (e.g. 1000).
2. Share the invite link — friends join with just their name.
3. Anyone can create a yes/no bet; everyone stakes coins on a side.
4. Odds are parimutuel: a side "pays 1.8x" = total pool / that side's pool.
5. The bet's creator resolves it; winners split 100% of the pool
   proportionally to their stake. If only one side has stakes, everyone is
   refunded.

## Stack

- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS v4
- **Backend:** Supabase — Postgres, anonymous auth, Realtime, RLS
- All coin movement happens in atomic Postgres functions (`supabase/migrations/`);
  the client can never write balances directly.

## Development

```sh
cp .env.example .env.local   # fill in your Supabase URL + publishable key
npm install
npm run dev
```

Requires a Supabase project with **anonymous sign-ins enabled**
(Dashboard → Authentication → Sign In / Up) and the migration in
`supabase/migrations/` applied.

## Deployment

`npm run build` produces a static `dist/` folder (includes an `.htaccess` SPA
fallback for Apache hosts like Hostinger). Upload the contents of `dist/` to
your web root.
