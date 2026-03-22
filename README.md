# YuNoWellness PH

Filipino-facing peptide wellness education website with a private, invite-only commerce storefront.

## Tech Stack

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **Database:** Supabase (PostgreSQL) with Row Level Security
- **Auth:** Supabase Auth (email/password + magic link, invite-code gated signup)
- **Hosting:** Vercel (recommended)
- **Payments:** TBD — PH-compliant gateway (PayMongo, GCash, Maya, Dragonpay)

## Features

### Public (Education)
- **Peptide Library** — 63 peptide guides with search, filtering by route and difficulty
- **Peptide Detail Pages (PDP)** — Dynamic `[slug]` routes with benefits, side effects, dosing, reconstitution, supplies
- **Reconstitution Calculator** — Interactive tool with syringe visual, quick-fill presets, copy-to-clipboard
- **Global Search** — Cmd+K / Ctrl+K instant search across all peptides

### Private (Commerce — Members Only)
- **Invite-only signup** — Users need a valid invite code (manual entry or URL param `?code=ABC123`)
- **Protected shop routes** — Middleware redirects unauthenticated users to login
- **Member dashboard** — Coming soon
- **Product catalog & cart** — Coming soon

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Fill in your Supabase URL and anon key

# Run the database schemas in Supabase SQL Editor:
# 1. supabase-schema.sql (peptide tables)
# 2. supabase-commerce-schema.sql (commerce tables)

# Seed peptide data (requires service role key in scripts/seed.mjs)
node scripts/seed.mjs

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
yunowellness-app/
  src/
    app/
      page.tsx                    # Homepage
      layout.tsx                  # Root layout with fonts
      globals.css                 # Brand design tokens (Tailwind v4 @theme)
      peptides/
        page.tsx                  # Library with search + filters
        [slug]/page.tsx           # Dynamic peptide detail page
      calculator/page.tsx         # Reconstitution calculator
      shop/page.tsx               # Members-only shop (protected)
      auth/
        login/                    # Login (password + magic link tabs)
        signup/                   # Signup with invite code
        callback/route.ts         # OAuth/magic link callback
    components/
      layout/Nav.tsx, Footer.tsx  # Shared layout
      peptide/
        PeptideLibrary.tsx        # Search + filter client component
        Calculator.tsx            # Interactive calculator
    lib/
      supabase.ts                 # Public Supabase client
      supabase-server.ts          # Server-side Supabase client (cookies)
      supabase-browser.ts         # Browser-side Supabase client
    types/database.ts             # TypeScript types
    middleware.ts                 # Route protection for /shop, /account
  supabase-schema.sql             # Peptide database schema
  supabase-commerce-schema.sql    # Commerce database schema
  scripts/seed.mjs                # Peptide data seeder
```

## Brand Design

- **Colors:** Pink (#FF6B8A), Sage (#7DB89A), Plum (#3D1F3A), Gold (#F0C274), Ivory (#FFF8F0)
- **Fonts:** Playfair Display (headings), DM Sans (body)
- **Style:** Premium wellness editorial — warm, soft, approachable

## Database

### Peptide Tables
- `peptides` — 63 peptides with JSONB fields for hero stats, dosing cards, reconstitution steps, supplies
- `peptide_benefits` — Benefits with strength ratings (1-5 dots)
- `peptide_side_effects` — Side effects with frequency badges

### Commerce Tables
- `invite_codes` — Single/multi-use codes with expiry
- `members` — Linked to Supabase Auth users
- `products` — Catalog linked to peptides
- `cart_items`, `orders`, `order_items` — Shopping flow
- `stripe_customers` — Payment gateway mapping (TBD)

## Data Sources

Peptide information sourced from [researchdosing.com](https://researchdosing.com) for educational purposes.

## Disclaimer

For educational purposes only. Not medical advice. Always consult a licensed healthcare professional before starting any peptide protocol. YuNoWellness PH does not sell, distribute, or endorse any specific peptide products publicly.
