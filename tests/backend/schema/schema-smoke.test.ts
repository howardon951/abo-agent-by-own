import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const schemaPath = path.join(process.cwd(), "supabase", "schema.sql");
const schema = readFileSync(schemaPath, "utf8");

test("uses a tenant-specific member role enum instead of mixing platform roles", () => {
  assert.match(
    schema,
    /create type public\.tenant_member_role as enum \('owner', 'admin'\);/
  );
  assert.doesNotMatch(schema, /create type public\.app_role/);
  assert.match(
    schema,
    /role public\.tenant_member_role not null default 'owner'/
  );
});

test("pins tenant-scoped relations with composite foreign keys on core runtime tables", () => {
  assert.match(
    schema,
    /foreign key \(tenant_id, channel_id\)\s+references public\.channels \(tenant_id, id\)\s+on delete cascade/
  );
  assert.match(
    schema,
    /foreign key \(tenant_id, conversation_id\)\s+references public\.conversations \(tenant_id, id\)\s+on delete cascade/
  );
  assert.match(
    schema,
    /foreign key \(tenant_id, message_id\)\s+references public\.messages \(tenant_id, id\)\s+on delete cascade/
  );
});

test("protects webhook idempotency and worker recovery fields in messaging tables", () => {
  assert.match(
    schema,
    /create unique index messages_external_message_id_idx\s+on public\.messages \(tenant_id, source, external_message_id\)\s+where external_message_id is not null;/
  );
  assert.match(schema, /job_type text not null default 'process_incoming_message'/);
  assert.match(schema, /locked_at timestamptz,/);
  assert.match(schema, /lease_expires_at timestamptz,/);
  assert.match(schema, /unique \(message_id\),/);
});

test("keeps sensitive backend-only tables out of tenant-facing RLS policies", () => {
  assert.match(schema, /create policy channels_select/);
  assert.doesNotMatch(schema, /create policy .*line_channel_configs/i);
  assert.doesNotMatch(schema, /create policy .*knowledge_chunks/i);
  assert.doesNotMatch(schema, /create policy .*message_jobs/i);
});
