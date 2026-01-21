-- 1. EXTENSIONS I CONFIGURACIÓ
create extension if not exists vector;

-- 2. ENUMS
create type node_type as enum (
  'claim', 'evidence', 'decision', 'constraint', 'assumption', 
  'plan', 'task', 'artifact', 'note', 'source', 'idea'
);

create type relation_type as enum (
  'supports', 'refutes', 'depends_on', 'contradicts', 
  'refines', 'supersedes', 'relates_to', 'blocks'
);

create type validation_status as enum (
  'pending', 'verified', 'refuted', 'outdated'
);

create type node_origin as enum (
  'human', 'ai_generated', 'hybrid'
);

-- 3. TAULES BASE
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  avatar_url text,
  preferences jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default now()
);

create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) not null,
  name text not null,
  description text,
  is_public boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

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
  created_at timestamp with time zone default now(),
  unique(source_node_id, target_node_id, relation)
);

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

-- Policies (Simplified for development)
create policy "Users can see their own projects" on projects
  for all using (auth.uid() = owner_id);

create policy "Users can see nodes of their projects" on work_nodes
  for all using (
    exists (select 1 from projects where id = work_nodes.project_id and owner_id = auth.uid())
  );

create policy "Users can see edges of their projects" on work_edges
  for all using (
    exists (select 1 from projects where id = work_edges.project_id and owner_id = auth.uid())
  );
