# Abo Agent

LINE AI agent SaaS MVP scaffold for merchants.

## Run

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Worker:

```bash
pnpm worker
```

Build check:

```bash
pnpm typecheck
pnpm build
```

## Current Scope

- Next.js App Router project scaffold
- Merchant / Platform dashboards
- API route skeletons
- Runtime / retrieval / LLM / LINE service stubs
- Supabase schema draft in `supabase/schema.sql`
- Product and implementation docs in `docs/`

## Important Notes

- Current pages and APIs use mock data
- Supabase auth/session uses SSR cookie architecture, but tenant data is still mostly mock-backed
- Environment variables follow Supabase's newer `publishable key / secret key` naming
- LINE webhook signature check is stubbed
- LLM provider is still a mock implementation
- Retrieval is still a mock implementation

## Next Build Steps

1. Wire real Supabase auth and tenant resolution
2. Apply `supabase/schema.sql` as migrations
3. Replace mock repositories with DB queries
4. Replace LINE client/signature stub with real implementation
5. Replace mock LLM/retrieval with actual provider and embeddings
