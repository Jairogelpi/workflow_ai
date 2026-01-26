-- [V4.1.0] Ensure node_embeddings has project_id and the correct vector dimension
-- Note: If you are upgrading from 1536 (OpenAI) to 768 (Local Nomic), you may need to drop/recreate the column.
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name='node_embeddings' and column_name='project_id') then
    alter table node_embeddings add column project_id uuid references projects(id) on delete cascade;
  end if;
end $$;

-- Update existing embeddings to link with their projects (if missing)
update node_embeddings ne
set project_id = wn.project_id
from work_nodes wn
where ne.node_id = wn.id and ne.project_id is null;

-- [V4.2.0] Eliminate Storage Bloat: Remove redundant content_text column
-- We will join with work_nodes to fetch content JIT
alter table node_embeddings drop column if exists content_text;

-- Optimization: Index project_id
create index if not exists idx_node_embeddings_project on node_embeddings(project_id);

/**
 * Optimized Retrieval Engine v2
 * Joins with work_nodes to fetch real-time content without redundancy.
 */
create or replace function match_nodes (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_project_id uuid
)
returns table (
  id uuid,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    ne.node_id as id,
    (wn.content->>'content')::text as content, -- Extract text from JSONB in work_nodes
    1 - (ne.embedding <=> query_embedding) as similarity
  from node_embeddings ne
  join work_nodes wn on ne.node_id = wn.id
  where ne.project_id = filter_project_id
    and 1 - (ne.embedding <=> query_embedding) > match_threshold
  order by ne.embedding <=> query_embedding
  limit match_count;
end;
$$;
