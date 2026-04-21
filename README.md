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

The worker loads `.env.local` through Node's `--env-file`, so it uses the same local credentials as the app.

Worker polling intervals:

```bash
WORKER_IDLE_POLL_INTERVAL_MS=2000
WORKER_ACTIVE_POLL_INTERVAL_MS=250
WORKER_ERROR_POLL_INTERVAL_MS=5000
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
- Merchant agent / scenario pages wired to Supabase-backed repositories
- LINE channel binding persists encrypted credentials in Supabase
- LINE webhook signature verification, ingestion, and `message_jobs` queue are DB-backed
- Worker runs as a long-lived polling process and can dispatch real LINE replies
- Knowledge / conversation / playground / platform reporting flows are still partly mock-backed
- Runtime scenario routing / retrieval / LLM are still mock-backed
- Supabase schema draft in `supabase/schema.sql`
- Product and implementation docs in `docs/`
- Business flow progress is tracked in `docs/implementation/business-flow-status.md`

## Important Notes

- Route handlers now follow a thin-controller pattern: auth / validation / domain call / response mapping
- Merchant APIs now enforce tenant-scoped access, except initial setup flow
- Supabase auth/session uses SSR cookie architecture
- Agent and scenario domain modules already use repository injection with Supabase admin queries
- LINE webhook ingestion now writes `webhook_events`, `contacts`, `conversations`, `messages`, and `message_jobs`
- Worker claims queued jobs from Supabase and retries / dead-letters failed jobs
- LINE Messaging API replies are live, but assistant content still comes from a mock LLM provider
- Conversations, knowledge documents, platform reporting, and resume-bot are still mostly mock / partial implementations
- Environment variables follow Supabase's newer `publishable key / secret key` naming
- LLM provider is still a mock implementation
- Retrieval is still a mock implementation

## Next Build Steps

1. Persist assistant replies into `messages` and replace mock conversation detail/list flows
2. Implement conversation state and handoff logic: `bot_active` / `human_active` / resume bot
3. Replace hard-coded scenario routing, mock retrieval, and mock LLM with tenant-aware runtime logic
4. Build the knowledge document ingestion pipeline: FAQ / URL / PDF -> chunking -> retrieval
5. Persist llm logs / retrieval logs / usage records and connect them to platform reporting pages
