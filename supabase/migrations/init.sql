-- 1. EXTENSIONS I CONFIGURACIÓ
create extension if not exists vector;

-- 2. ENUMS (Safe creation)
do $$ 
begin
  if not exists (select 1 from pg_type where typname = 'node_type') then
    create type node_type as enum (
      'claim', 'evidence', 'decision', 'constraint', 'assumption', 
      'plan', 'task', 'artifact', 'note', 'source', 'idea', 'excerpt'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'relation_type') then
    create type relation_type as enum (
      'supports', 'refutes', 'depends_on', 'contradicts', 
      'refines', 'supersedes', 'relates_to', 'blocks', 'part_of'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'validation_status') then
    create type validation_status as enum (
      'pending', 'verified', 'refuted', 'outdated'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'node_origin') then
    create type node_origin as enum (
      'human', 'ai_generated', 'hybrid'
    );
  end if;
end $$;

-- 3. TAULES BASE
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  avatar_url text,
  preferences jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default now()
);

-- 3. EL CONTINGUT (PROJECTES)
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id), -- Nullable for local/unauthenticated dev
  name text not null,
  description text,
  is_public boolean default false,
  deleted_at timestamp with time zone, -- Roadmap Requirement: Soft Delete
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Ensure owner_id is nullable for existing tables
alter table projects alter column owner_id drop not null;

-- Register a default project for local dev / unauthenticated captures
insert into projects (id, name, description)
values ('00000000-0000-0000-0000-000000000000', 'Default Project', 'Knowledge capture landing project')
on conflict (id) do nothing;

-- 4. EL NUCLI DEL GRAF
create table if not exists work_nodes (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  type node_type not null default 'note',
  content jsonb not null default '{}'::jsonb,
  confidence float check (confidence >= 0 and confidence <= 1) default 1.0,
  is_pinned boolean default false,
  is_validated boolean default false,
  validation_status validation_status default 'pending',
  origin node_origin default 'human',
  metadata jsonb default '{}'::jsonb,
  current_version_hash text,
  deleted_at timestamp with time zone, -- Roadmap Requirement: Soft Delete
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists work_edges (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  source_node_id uuid references work_nodes(id) on delete cascade not null,
  target_node_id uuid references work_nodes(id) on delete cascade not null,
  relation relation_type not null default 'relates_to',
  metadata jsonb default '{}'::jsonb,
  deleted_at timestamp with time zone, -- Roadmap Requirement: Soft Delete
  created_at timestamp with time zone default now(),
  unique(source_node_id, target_node_id, relation)
);

-- Indexes for performance (Filtering out deleted records)
create index if not exists idx_nodes_not_deleted on work_nodes(project_id) where deleted_at is null;
create index if not exists idx_edges_not_deleted on work_edges(project_id) where deleted_at is null;

-- 5. MOTOR DE VERSIONAT
create table if not exists node_revisions (
  id uuid default gen_random_uuid() primary key,
  node_id uuid references work_nodes(id) on delete cascade not null,
  author_id uuid references auth.users(id),
  content_snapshot jsonb not null,
  content_hash text not null,
  previous_revision_hash text,
  created_at timestamp with time zone default now()
);

-- 6. RLM COMPILER MEMORY
create table if not exists node_embeddings (
  id uuid default gen_random_uuid() primary key,
  node_id uuid references work_nodes(id) on delete cascade,
  embedding vector(1536),
  content_text text,
  updated_at timestamp with time zone default now()
);

create table if not exists compilation_receipts (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id),
  input_context_hash text not null,
  prompt_snapshot jsonb,
  output_content text,
  assertion_map jsonb,
  verification_report jsonb,
  model_used text,
  cost_tokens int,
  created_at timestamp with time zone default now()
);

-- 7. SEGURETAT (RLS)
alter table profiles enable row level security;
alter table projects enable row level security;
alter table work_nodes enable row level security;
alter table work_edges enable row level security;

-- Policies (Allow access to default project or owned projects)
drop policy if exists "Users can see default or own projects" on projects;
create policy "Users can see default or own projects" on projects
  for all using (
    id = '00000000-0000-0000-0000-000000000000' or auth.uid() = owner_id
  );

drop policy if exists "Users can see nodes of default or own projects" on work_nodes;
create policy "Users can see nodes of default or own projects" on work_nodes
  for select using (
    project_id = '00000000-0000-0000-0000-000000000000' or 
    exists (select 1 from projects where id = work_nodes.project_id and owner_id = auth.uid())
  );

drop policy if exists "Users can modify nodes of default or own projects" on work_nodes;
create policy "Users can modify nodes of default or own projects" on work_nodes
  for all using (
    project_id = '00000000-0000-0000-0000-000000000000' or 
    exists (select 1 from projects where id = work_nodes.project_id and owner_id = auth.uid())
  );

drop policy if exists "Users can see edges of default or own projects" on work_edges;
create policy "Users can see edges of default or own projects" on work_edges
  for all using (
    project_id = '00000000-0000-0000-0000-000000000000' or 
    exists (select 1 from projects where id = work_edges.project_id and owner_id = auth.uid())
  );

-- 8. STORAGE BUCKETS (The Artifacts Vault)
-- Note: Buckets creation is usually done via Dashboard or API, but we can register it in the storage.buckets table safely.
insert into storage.buckets (id, name, public) 
values ('artifacts', 'artifacts', false)
on conflict (id) do nothing;

-- Storage RLS Policies
-- Allow authenticated users to upload and view their own files.
-- We use prefix logic or owner for multi-project isolation.
create policy "Authenticated users can upload artifacts"
  on storage.objects for insert
  with check (
    bucket_id = 'artifacts' AND
    auth.role() = 'authenticated'
  );

create policy "Users can view their own artifacts"
  on storage.objects for select
  using (
    bucket_id = 'artifacts' AND
    (auth.uid() = owner or owner is null)
  );
