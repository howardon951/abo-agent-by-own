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
- Tenant / platform auth guard baseline
- Agent / scenario APIs wired to Supabase-backed repositories
- Knowledge / conversation / playground / webhook APIs still partly mock-backed
- Runtime / retrieval / LLM / LINE service stubs
- Supabase schema draft in `supabase/schema.sql`
- Product and implementation docs in `docs/`

## Important Notes

- Route handlers now follow a thin-controller pattern: auth / validation / domain call / response mapping
- Merchant APIs now enforce tenant-scoped access, except initial setup flow
- Supabase auth/session uses SSR cookie architecture
- Agent and scenario domain modules already use repository injection with Supabase admin queries
- Conversations, knowledge documents, webhook ingestion, runtime orchestration, and resume-bot are still mostly mock/stub implementations
- Environment variables follow Supabase's newer `publishable key / secret key` naming
- LINE webhook signature check is stubbed
- LLM provider is still a mock implementation
- Retrieval is still a mock implementation

## Next Build Steps

1. Implement the core message workflow: webhook -> persisted event/message/job -> worker -> runtime
2. Implement conversation state and handoff logic: `bot_active` / `human_active` / resume bot
3. Replace conversation / knowledge / LINE connect mock flows with tenant-aware DB-backed repositories
4. Replace LINE signature / reply stubs with real implementation
5. Replace mock LLM / retrieval with real provider and embeddings
6. Add Supabase integration tests for auth, onboarding, and tenant isolation
