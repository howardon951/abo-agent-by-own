create extension if not exists pgcrypto;
create extension if not exists vector;

create type public.tenant_member_role as enum ('owner', 'admin');
create type public.tenant_status as enum ('draft', 'active', 'suspended', 'archived');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled');
create type public.agent_status as enum ('draft', 'active', 'paused', 'archived');
create type public.scenario_type as enum ('general_faq', 'pre_sales', 'post_sales', 'store_info', 'custom');
create type public.channel_provider as enum ('line');
create type public.channel_status as enum ('disconnected', 'connected', 'error');
create type public.conversation_status as enum ('bot_active', 'handoff_requested', 'human_active', 'closed');
create type public.message_role as enum ('user', 'assistant', 'system');
create type public.message_source as enum ('line_webhook', 'playground', 'system', 'admin');
create type public.document_source_type as enum ('faq', 'pdf', 'url');
create type public.document_processing_status as enum ('queued', 'processing', 'ready', 'failed');
create type public.job_status as enum ('queued', 'processing', 'completed', 'failed', 'dead_letter');
create type public.prompt_version_status as enum ('draft', 'published', 'archived');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  price_monthly numeric(12,2) not null default 0,
  message_quota integer,
  document_quota integer,
  feature_flags jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status public.tenant_status not null default 'draft',
  plan_id uuid references public.plans(id),
  owner_user_id uuid references auth.users(id),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.tenant_member_role not null default 'owner',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, user_id)
);

create index tenant_members_user_tenant_idx on public.tenant_members (user_id, tenant_id);

create table public.tenant_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  status public.subscription_status not null default 'trialing',
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancel_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.agents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  status public.agent_status not null default 'draft',
  brand_name text not null,
  brand_tone text,
  forbidden_topics text[] not null default '{}',
  fallback_policy text,
  business_hours jsonb not null default '{}'::jsonb,
  config jsonb not null default '{}'::jsonb,
  published_prompt_version_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, id)
);

create index agents_tenant_status_idx on public.agents (tenant_id, status);
create unique index agents_one_active_per_tenant_idx
  on public.agents (tenant_id)
  where status = 'active';

create table public.agent_prompt_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  agent_id uuid not null,
  version_no integer not null,
  status public.prompt_version_status not null default 'draft',
  prompt_snapshot jsonb not null,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, id),
  unique (agent_id, version_no),
  foreign key (tenant_id, agent_id)
    references public.agents (tenant_id, id)
    on delete cascade
);

alter table public.agents
  add constraint agents_published_prompt_version_fkey
  foreign key (published_prompt_version_id)
  references public.agent_prompt_versions(id)
  on delete set null;

create table public.agent_scenarios (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  agent_id uuid not null,
  scenario_type public.scenario_type not null,
  name text not null,
  routing_keywords text[] not null default '{}',
  prompt_config jsonb not null default '{}'::jsonb,
  sort_order integer not null default 100,
  is_enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, id),
  unique (agent_id, scenario_type),
  foreign key (tenant_id, agent_id)
    references public.agents (tenant_id, id)
    on delete cascade
);

create index agent_scenarios_agent_enabled_sort_idx
  on public.agent_scenarios (agent_id, is_enabled, sort_order);

create table public.agent_handoff_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  agent_id uuid not null,
  rule_name text not null,
  keywords text[] not null default '{}',
  auto_reply_text text not null,
  is_enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, id),
  foreign key (tenant_id, agent_id)
    references public.agents (tenant_id, id)
    on delete cascade
);

create table public.channels (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider public.channel_provider not null,
  name text not null,
  status public.channel_status not null default 'disconnected',
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, id)
);

create index channels_tenant_provider_idx on public.channels (tenant_id, provider);
create unique index channels_one_primary_per_tenant_provider_idx
  on public.channels (tenant_id, provider)
  where is_primary = true;

create table public.line_channel_configs (
  channel_id uuid primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  channel_id_external text,
  channel_secret_ciphertext text not null,
  channel_access_token_ciphertext text not null,
  webhook_url text,
  webhook_verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  foreign key (tenant_id, channel_id)
    references public.channels (tenant_id, id)
    on delete cascade
);

create unique index line_channel_configs_external_id_idx
  on public.line_channel_configs (channel_id_external)
  where channel_id_external is not null;

create table public.knowledge_bases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, id)
);

create unique index knowledge_bases_one_default_per_tenant_idx
  on public.knowledge_bases (tenant_id)
  where is_default = true;

create table public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  knowledge_base_id uuid not null,
  source_type public.document_source_type not null,
  title text not null,
  source_url text,
  storage_path text,
  raw_text text,
  checksum text,
  processing_status public.document_processing_status not null default 'queued',
  last_processed_at timestamptz,
  processing_error text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, id),
  foreign key (tenant_id, knowledge_base_id)
    references public.knowledge_bases (tenant_id, id)
    on delete cascade
);

create index knowledge_documents_tenant_status_created_idx
  on public.knowledge_documents (tenant_id, processing_status, created_at desc);

create table public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  knowledge_base_id uuid not null,
  document_id uuid not null,
  chunk_index integer not null,
  content text not null,
  token_count integer,
  embedding_model text,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, id),
  unique (document_id, chunk_index),
  foreign key (tenant_id, knowledge_base_id)
    references public.knowledge_bases (tenant_id, id)
    on delete cascade,
  foreign key (tenant_id, document_id)
    references public.knowledge_documents (tenant_id, id)
    on delete cascade
);

create index knowledge_chunks_document_idx on public.knowledge_chunks (document_id, chunk_index);
create index knowledge_chunks_tenant_kb_idx on public.knowledge_chunks (tenant_id, knowledge_base_id);
create index knowledge_chunks_embedding_idx
  on public.knowledge_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  channel_id uuid not null,
  external_user_id text not null,
  display_name text,
  profile jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, id),
  unique (channel_id, external_user_id),
  foreign key (tenant_id, channel_id)
    references public.channels (tenant_id, id)
    on delete cascade
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  channel_id uuid not null,
  contact_id uuid not null,
  agent_id uuid not null,
  status public.conversation_status not null default 'bot_active',
  scenario_id uuid,
  opened_at timestamptz not null default timezone('utc', now()),
  last_message_at timestamptz,
  handoff_requested_at timestamptz,
  human_activated_at timestamptz,
  closed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, id),
  foreign key (tenant_id, channel_id)
    references public.channels (tenant_id, id)
    on delete cascade,
  foreign key (tenant_id, contact_id)
    references public.contacts (tenant_id, id)
    on delete cascade,
  foreign key (tenant_id, agent_id)
    references public.agents (tenant_id, id)
    on delete cascade,
  foreign key (tenant_id, scenario_id)
    references public.agent_scenarios (tenant_id, id)
    on delete set null
);

create index conversations_tenant_status_last_message_idx
  on public.conversations (tenant_id, status, last_message_at desc, id desc);
create unique index conversations_one_open_per_contact_idx
  on public.conversations (channel_id, contact_id)
  where status in ('bot_active', 'handoff_requested', 'human_active');

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid not null,
  external_message_id text,
  role public.message_role not null,
  source public.message_source not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, id),
  foreign key (tenant_id, conversation_id)
    references public.conversations (tenant_id, id)
    on delete cascade
);

create index messages_conversation_created_idx on public.messages (conversation_id, created_at, id);
create unique index messages_external_message_id_idx
  on public.messages (tenant_id, source, external_message_id)
  where external_message_id is not null;

create table public.message_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid not null,
  message_id uuid not null,
  job_type text not null default 'process_incoming_message',
  status public.job_status not null default 'queued',
  retry_count integer not null default 0,
  max_retries integer not null default 5,
  available_at timestamptz not null default timezone('utc', now()),
  locked_at timestamptz,
  lease_expires_at timestamptz,
  finished_at timestamptz,
  worker_id text,
  last_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (message_id),
  foreign key (tenant_id, conversation_id)
    references public.conversations (tenant_id, id)
    on delete cascade,
  foreign key (tenant_id, message_id)
    references public.messages (tenant_id, id)
    on delete cascade,
  check (retry_count >= 0),
  check (max_retries >= 0),
  check (lease_expires_at is null or locked_at is not null)
);

create index message_jobs_polling_idx
  on public.message_jobs (status, available_at, id);
create index message_jobs_queued_polling_idx
  on public.message_jobs (available_at, id)
  where status = 'queued';

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete set null,
  channel_id uuid references public.channels(id) on delete set null,
  provider public.channel_provider not null,
  provider_event_id text,
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  status public.job_status not null default 'queued',
  processing_error text,
  unique (provider, provider_event_id)
);

create table public.retrieval_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid not null,
  message_id uuid not null,
  knowledge_base_id uuid,
  query_text text not null,
  retrieved_chunks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, id),
  foreign key (tenant_id, conversation_id)
    references public.conversations (tenant_id, id)
    on delete cascade,
  foreign key (tenant_id, message_id)
    references public.messages (tenant_id, id)
    on delete cascade,
  foreign key (tenant_id, knowledge_base_id)
    references public.knowledge_bases (tenant_id, id)
    on delete set null
);

create table public.llm_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid not null,
  message_id uuid not null,
  retrieval_log_id uuid references public.retrieval_logs(id) on delete set null,
  model_provider text not null,
  model_name text not null,
  scenario_type public.scenario_type,
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  latency_ms integer,
  was_fallback boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, id),
  foreign key (tenant_id, conversation_id)
    references public.conversations (tenant_id, id)
    on delete cascade,
  foreign key (tenant_id, message_id)
    references public.messages (tenant_id, id)
    on delete cascade
);

create table public.usage_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  llm_log_id uuid references public.llm_logs(id) on delete set null,
  metric_date date not null default current_date,
  message_count integer not null default 0,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer not null default 0,
  estimated_cost numeric(12,6) not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index usage_records_tenant_metric_date_idx
  on public.usage_records (tenant_id, metric_date desc);

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins pa
    where pa.user_id = auth.uid()
  );
$$;

create or replace function public.has_tenant_access(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_members tm
    where tm.user_id = auth.uid()
      and tm.tenant_id = target_tenant_id
  );
$$;

create or replace function public.has_tenant_admin_access(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_members tm
    where tm.user_id = auth.uid()
      and tm.tenant_id = target_tenant_id
      and tm.role in ('owner', 'admin')
  );
$$;

alter table public.platform_admins enable row level security;
alter table public.plans enable row level security;
alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.tenant_subscriptions enable row level security;
alter table public.agents enable row level security;
alter table public.agent_prompt_versions enable row level security;
alter table public.agent_scenarios enable row level security;
alter table public.agent_handoff_rules enable row level security;
alter table public.channels enable row level security;
alter table public.line_channel_configs enable row level security;
alter table public.knowledge_bases enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.contacts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.message_jobs enable row level security;
alter table public.webhook_events enable row level security;
alter table public.retrieval_logs enable row level security;
alter table public.llm_logs enable row level security;
alter table public.usage_records enable row level security;

create policy platform_admins_self_read
  on public.platform_admins
  for select
  using (user_id = auth.uid() or public.is_platform_admin());

create policy plans_readable_by_authenticated_users
  on public.plans
  for select
  using (auth.uid() is not null);

create policy tenants_select
  on public.tenants
  for select
  using (public.is_platform_admin() or public.has_tenant_access(id));

create policy tenants_insert
  on public.tenants
  for insert
  with check (public.is_platform_admin() or owner_user_id = auth.uid());

create policy tenants_update
  on public.tenants
  for update
  using (public.is_platform_admin() or public.has_tenant_admin_access(id))
  with check (public.is_platform_admin() or public.has_tenant_admin_access(id));

create policy tenant_members_select
  on public.tenant_members
  for select
  using (public.is_platform_admin() or public.has_tenant_access(tenant_id));

create policy tenant_members_insert
  on public.tenant_members
  for insert
  with check (public.is_platform_admin() or public.has_tenant_admin_access(tenant_id));

create policy tenant_members_update
  on public.tenant_members
  for update
  using (public.is_platform_admin() or public.has_tenant_admin_access(tenant_id))
  with check (public.is_platform_admin() or public.has_tenant_admin_access(tenant_id));

create policy tenant_members_delete
  on public.tenant_members
  for delete
  using (public.is_platform_admin() or public.has_tenant_admin_access(tenant_id));

create policy tenant_subscriptions_select
  on public.tenant_subscriptions
  for select
  using (public.is_platform_admin() or public.has_tenant_access(tenant_id));

create policy tenant_subscriptions_mutate
  on public.tenant_subscriptions
  for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy agents_select
  on public.agents
  for select
  using (public.is_platform_admin() or public.has_tenant_access(tenant_id));

create policy agents_mutate
  on public.agents
  for all
  using (public.is_platform_admin() or public.has_tenant_admin_access(tenant_id))
  with check (public.is_platform_admin() or public.has_tenant_admin_access(tenant_id));

create policy agent_prompt_versions_select
  on public.agent_prompt_versions
  for select
  using (public.is_platform_admin() or public.has_tenant_access(tenant_id));

create policy agent_prompt_versions_mutate
  on public.agent_prompt_versions
  for all
  using (public.is_platform_admin() or public.has_tenant_admin_access(tenant_id))
  with check (public.is_platform_admin() or public.has_tenant_admin_access(tenant_id));

create policy agent_scenarios_select
  on public.agent_scenarios
  for select
  using (public.is_platform_admin() or public.has_tenant_access(tenant_id));

create policy agent_scenarios_mutate
  on public.agent_scenarios
  for all
  using (public.is_platform_admin() or public.has_tenant_admin_access(tenant_id))
  with check (public.is_platform_admin() or public.has_tenant_admin_access(tenant_id));

create policy agent_handoff_rules_select
  on public.agent_handoff_rules
  for select
  using (public.is_platform_admin() or public.has_tenant_access(tenant_id));

create policy agent_handoff_rules_mutate
  on public.agent_handoff_rules
  for all
  using (public.is_platform_admin() or public.has_tenant_admin_access(tenant_id))
  with check (public.is_platform_admin() or public.has_tenant_admin_access(tenant_id));

create policy channels_select
  on public.channels
  for select
  using (public.is_platform_admin() or public.has_tenant_access(tenant_id));

create policy channels_mutate
  on public.channels
  for all
  using (public.is_platform_admin() or public.has_tenant_admin_access(tenant_id))
  with check (public.is_platform_admin() or public.has_tenant_admin_access(tenant_id));

create policy knowledge_bases_select
  on public.knowledge_bases
  for select
  using (public.is_platform_admin() or public.has_tenant_access(tenant_id));

create policy knowledge_bases_mutate
  on public.knowledge_bases
  for all
  using (public.is_platform_admin() or public.has_tenant_admin_access(tenant_id))
  with check (public.is_platform_admin() or public.has_tenant_admin_access(tenant_id));

create policy knowledge_documents_select
  on public.knowledge_documents
  for select
  using (public.is_platform_admin() or public.has_tenant_access(tenant_id));

create policy knowledge_documents_mutate
  on public.knowledge_documents
  for all
  using (public.is_platform_admin() or public.has_tenant_admin_access(tenant_id))
  with check (public.is_platform_admin() or public.has_tenant_admin_access(tenant_id));

create policy contacts_select
  on public.contacts
  for select
  using (public.is_platform_admin() or public.has_tenant_access(tenant_id));

create policy contacts_mutate
  on public.contacts
  for all
  using (public.is_platform_admin() or public.has_tenant_admin_access(tenant_id))
  with check (public.is_platform_admin() or public.has_tenant_admin_access(tenant_id));

create policy conversations_select
  on public.conversations
  for select
  using (public.is_platform_admin() or public.has_tenant_access(tenant_id));

create policy conversations_update
  on public.conversations
  for update
  using (public.is_platform_admin() or public.has_tenant_admin_access(tenant_id))
  with check (public.is_platform_admin() or public.has_tenant_admin_access(tenant_id));

create policy messages_select
  on public.messages
  for select
  using (public.is_platform_admin() or public.has_tenant_access(tenant_id));

create policy webhook_events_select
  on public.webhook_events
  for select
  using (
    public.is_platform_admin()
    or (tenant_id is not null and public.has_tenant_access(tenant_id))
  );

create policy retrieval_logs_select
  on public.retrieval_logs
  for select
  using (public.is_platform_admin() or public.has_tenant_access(tenant_id));

create policy llm_logs_select
  on public.llm_logs
  for select
  using (public.is_platform_admin() or public.has_tenant_access(tenant_id));

create policy usage_records_select
  on public.usage_records
  for select
  using (public.is_platform_admin() or public.has_tenant_access(tenant_id));

create trigger set_updated_at_plans
before update on public.plans
for each row execute function public.set_updated_at();

create trigger set_updated_at_tenants
before update on public.tenants
for each row execute function public.set_updated_at();

create trigger set_updated_at_tenant_members
before update on public.tenant_members
for each row execute function public.set_updated_at();

create trigger set_updated_at_tenant_subscriptions
before update on public.tenant_subscriptions
for each row execute function public.set_updated_at();

create trigger set_updated_at_agents
before update on public.agents
for each row execute function public.set_updated_at();

create trigger set_updated_at_agent_scenarios
before update on public.agent_scenarios
for each row execute function public.set_updated_at();

create trigger set_updated_at_agent_handoff_rules
before update on public.agent_handoff_rules
for each row execute function public.set_updated_at();

create trigger set_updated_at_channels
before update on public.channels
for each row execute function public.set_updated_at();

create trigger set_updated_at_line_channel_configs
before update on public.line_channel_configs
for each row execute function public.set_updated_at();

create trigger set_updated_at_knowledge_bases
before update on public.knowledge_bases
for each row execute function public.set_updated_at();

create trigger set_updated_at_knowledge_documents
before update on public.knowledge_documents
for each row execute function public.set_updated_at();

create trigger set_updated_at_contacts
before update on public.contacts
for each row execute function public.set_updated_at();

create trigger set_updated_at_conversations
before update on public.conversations
for each row execute function public.set_updated_at();

create trigger set_updated_at_message_jobs
before update on public.message_jobs
for each row execute function public.set_updated_at();
