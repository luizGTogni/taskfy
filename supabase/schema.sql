-- Taskfy — schema Supabase
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase.

create table if not exists groups (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  emoji text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists tasks (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  title text not null,
  details text not null default '',
  schedule jsonb not null,
  checklist jsonb not null default '[]',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists completions (
  id text primary key, -- `${taskId}:${date}`
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  date date not null,
  done boolean not null default false,
  completed_at timestamptz,
  checked_items jsonb not null default '[]'
);

create index if not exists tasks_group_id_idx on tasks(group_id);
create index if not exists completions_task_id_idx on completions(task_id);
create index if not exists completions_date_idx on completions(date);

-- Row Level Security: cada usuário só enxerga e altera os próprios dados.
alter table groups enable row level security;
alter table tasks enable row level security;
alter table completions enable row level security;

create policy "groups: owner only" on groups
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tasks: owner only" on tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "completions: owner only" on completions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
