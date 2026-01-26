-- ==============================================================================
-- GATE 18: SECURE EMAIL INVITATIONS (Token-Based Access)
-- ==============================================================================

-- 1. Create Invitations Table
create table if not exists project_invitations (
    id uuid default gen_random_uuid() primary key,
    project_id uuid references projects(id) on delete cascade not null,
    email text not null,
    role project_role not null default 'viewer',
    token text not null unique, -- Secure random token sent via email
    invited_by uuid references auth.users(id),
    expires_at timestamp with time zone default (now() + interval '7 days'),
    created_at timestamp with time zone default now(),
    accepted_at timestamp with time zone,
    
    -- Constraint: Avoid duplicate active invites per email/project
    unique(project_id, email)
);

-- 2. Indexes
create index if not exists idx_invitations_token on project_invitations(token);
create index if not exists idx_invitations_email on project_invitations(email);

-- 3. RLS Policies
alter table project_invitations enable row level security;

-- Only members (min editor) can see/create invites
create policy "Project members can view invites" on project_invitations
    for select using (
        exists (
            select 1 from project_members 
            where project_id = project_invitations.project_id 
            and user_id = auth.uid()
        )
    );

create policy "Editors+ can create invites" on project_invitations
    for insert with check (
        exists (
            select 1 from project_members 
            where project_id = project_invitations.project_id 
            and user_id = auth.uid()
            and role in ('editor', 'maintainer', 'owner')
        )
    );

-- 4. RPC: Atomically Accept Invitation
create or replace function accept_project_invitation(invite_token text)
returns json
language plpgsql
security definer -- Runs with superuser privileges to lookup invite and insert member
as $$
declare
    invite_record record;
    user_id uuid;
begin
    -- 1. Identify User
    user_id := auth.uid();
    if user_id is null then
        return json_build_object('success', false, 'error', 'AUTHORIZATION_REQUIRED');
    end if;

    -- 2. Fetch & Validate Invite
    select * into invite_record 
    from project_invitations 
    where token = invite_token 
    and accepted_at is null
    and expires_at > now();

    if not found then
         return json_build_object('success', false, 'error', 'INVALID_OR_EXPIRED_TOKEN');
    end if;

    -- 3. Check if already member
    if exists (select 1 from project_members where project_id = invite_record.project_id and user_id = auth.uid()) then
        return json_build_object('success', false, 'error', 'ALREADY_MEMBER');
    end if;

    -- 4. Add Member
    insert into project_members (project_id, user_id, role)
    values (invite_record.project_id, user_id, invite_record.role);

    -- 5. Mark Invited Accepted
    update project_invitations 
    set accepted_at = now() 
    where id = invite_record.id;

    return json_build_object('success', true, 'project_id', invite_record.project_id);
end;
$$;
