-- StageFlow AI — schema sugerido para Supabase (executar no SQL Editor)
-- Ajuste nomes e politicas conforme o seu projeto.

create extension if not exists "uuid-ossp";

create table if not exists public.sf_projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now(),
  owner_id uuid references auth.users (id)
);

create table if not exists public.sf_tasks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.sf_projects (id) on delete cascade,
  what text not null,
  who_role text not null,
  where_text text default '',
  when_text text default '',
  column_status text not null default 'backlog',
  priority text default 'media',
  photo_url text,
  created_at timestamptz default now()
);

create table if not exists public.sf_invites (
  token text primary key,
  project_id uuid not null references public.sf_projects (id) on delete cascade,
  role text not null,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.sf_transcriptions (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.sf_projects (id) on delete cascade,
  raw_text text,
  kind text,
  urgency text,
  summary text,
  created_at timestamptz default now()
);

alter table public.sf_projects enable row level security;
alter table public.sf_tasks enable row level security;
alter table public.sf_invites enable row level security;
alter table public.sf_transcriptions enable row level security;

-- Politicas minimas (ajuste): utilizador autenticado le/escreve nos seus projetos
-- Exemplo: substitua por logica real de membros de equipa

create policy "sf_projects_own" on public.sf_projects
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "sf_tasks_via_project" on public.sf_tasks
  for all using (
    exists (select 1 from public.sf_projects p where p.id = project_id and p.owner_id = auth.uid())
  );

create policy "sf_invites_via_project" on public.sf_invites
  for all using (
    exists (select 1 from public.sf_projects p where p.id = project_id and p.owner_id = auth.uid())
  );

create policy "sf_trans_via_project" on public.sf_transcriptions
  for all using (
    exists (select 1 from public.sf_projects p where p.id = project_id and p.owner_id = auth.uid())
  );
