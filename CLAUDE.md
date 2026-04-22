# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (web + worker together)
pnpm dev

# Run only the web server
pnpm dev:web

# Run only the background worker
pnpm dev:worker   # or: pnpm worker

# Type check
pnpm typecheck

# Build
pnpm build

# Run backend tests (Node test runner, no framework)
pnpm test:backend

# Run a single test file
node --import tsx --test tests/backend/channel/ingest-line-webhook.test.ts
```

## Architecture Overview

This is a LINE AI agent SaaS platform (Next.js 15 App Router + TypeScript). Merchants sign up, connect their LINE Official Account, and the system auto-replies to customer messages via an AI agent.

### Two-process runtime

| Process | Entry | Role |
|---------|-------|------|
| Next.js server | `src/app/` | Serves pages, API routes, and LINE webhook ingestion |
| Worker | `src/worker/index.ts` | Long-polling process that claims jobs from Supabase and dispatches LINE replies |

`pnpm dev` starts both concurrently.

### Message flow (end-to-end)

```
LINE user sends message
  → POST /api/webhooks/line
      → verifies HMAC signature against every tenant's stored channel secret
      → upserts contact / conversation / message into Supabase
      → inserts a row into message_jobs (status = queued)

Worker polls message_jobs
  → claims a queued job (optimistic lock: status = processing, lease)
  → processIncomingMessage():
      1. Skip if conversation.status == human_active
      2. Check agent handoff rules (keyword match) → auto-reply + mark human_active
      3. selectScenario() → retrieveContext() → llmProvider.generate()
      4. lineClient.replyText() with real LINE Messaging API
      5. Persist assistant message + update conversation timestamps
  → mark job completed (or retry / dead-letter on failure)
```

### Domain layer (`src/server/domain/`)

Each file exports a single use-case function. Every use-case receives a **repository interface** as a parameter, defaulting to a Supabase-backed implementation defined in the same file. This makes functions testable without mocking Supabase directly — tests pass a fake repository object.

### API routes (`src/app/api/`)

Routes follow a thin-controller pattern:
1. Call `runTenantScopedRoute()` (or `requirePlatformAdmin()` for platform routes)
2. Parse/validate request body
3. Call the relevant domain function
4. Return `ok(data)` or `fail(code, message, status)`

`runTenantScopedRoute` in `src/server/http/tenant-route.ts` handles auth errors automatically.

### Auth

- Supabase handles session/JWT via SSR cookies (`@supabase/ssr`).
- `middleware.ts` refreshes the session cookie on every request.
- `getSessionUser()` (`src/lib/auth/session.ts`) enriches the Supabase user with role + tenantId by querying `platform_admins` and `tenant_members`.
- Two roles: `platform_admin` (platform-level access) and `tenant_owner` (scoped to one tenant).
- Guard helpers: `requireTenantScopedUser()`, `requirePlatformAdmin()`, `requirePlatformAdminPage()`.

### Supabase clients

| Module | Client | When to use |
|--------|--------|-------------|
| `src/lib/supabase/server.ts` | User-scoped SSR client | Page server components, reads respecting RLS |
| `src/lib/supabase/admin.ts` | Service role client (bypasses RLS) | Domain functions, worker, webhook ingestion |
| `src/lib/supabase/browser.ts` | Browser client | Client components |

### LINE channel credentials

Channel secret and access token are **encrypted** (AES) with `LINE_CONFIG_ENCRYPTION_KEY` before being stored in `line_channel_configs`. Decryption happens in `src/lib/utils/crypto.ts` at runtime — inside the worker and the webhook verifier.

### What is still mock / incomplete

- `llmProvider` (`src/server/services/llm/llm-provider.ts`) — returns hardcoded strings.
- `retrieveContext` (`src/server/services/retrieval/retriever.ts`) — returns hardcoded documents.
- `selectScenario` — still uses keyword heuristics, not tenant DB rules.
- Knowledge document ingestion pipeline (chunking, embedding, vector search) — not built.
- Playground runs a demo runtime, not the tenant-scoped runtime.
- Platform reporting pages (`/platform/usage`, `/platform/logs`) — mostly mock data.

See `docs/implementation/business-flow-status.md` for a full per-feature completion table.

## Key env vars

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |
| `SUPABASE_SECRET_KEY` | Supabase service role key (server/worker only) |
| `LINE_CONFIG_ENCRYPTION_KEY` | AES key for encrypting LINE credentials at rest |
| `WORKER_IDLE_POLL_INTERVAL_MS` | How long the worker sleeps when no jobs are queued (default 2000) |
| `WORKER_ACTIVE_POLL_INTERVAL_MS` | Poll interval when a job was just processed (default 250) |
| `WORKER_ERROR_POLL_INTERVAL_MS` | Poll interval after a worker error (default 5000) |

## Project structure reference

- `src/app/(merchant)/` — merchant-facing pages (agent, conversations, knowledge, scenarios, etc.)
- `src/app/(platform)/platform/` — platform admin pages (tenants, usage, logs)
- `src/app/(auth)/` — login / signup pages + server actions
- `src/app/api/` — REST API route handlers
- `src/server/domain/` — use-case functions (one file per feature, repository-injected)
- `src/server/services/` — external service adapters (LINE client, LLM, retrieval, job queue)
- `src/lib/auth/` — session resolution, guards, role helpers
- `src/lib/supabase/` — Supabase client factories
- `src/worker/` — polling worker process
- `supabase/schema.sql` — full DB schema (source of truth for table/column names)
- `tests/backend/` — Node built-in test runner tests mirroring `src/server/` structure
- `docs/implementation/` — spec docs, ERD, API contracts, wireframes
