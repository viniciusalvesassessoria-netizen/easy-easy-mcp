create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  license_key text not null unique,
  name text not null,
  email text not null,
  plan text not null default 'standard',
  expires_at timestamptz not null,
  enabled boolean not null default true,
  max_devices integer not null default 1 check (max_devices > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists licenses_user_expires_idx
  on public.licenses (user_id, expires_at desc);

create table if not exists public.activations (
  id uuid primary key default gen_random_uuid(),
  license_id uuid not null references public.licenses(id) on delete cascade,
  device_id text not null,
  device_name text,
  activated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (license_id, device_id)
);
create index if not exists activations_license_idx
  on public.activations (license_id);

create table if not exists public.user_preferences (
  user_id uuid primary key,
  chat_blocked boolean not null default false,
  mode text not null default '1' check (mode in ('1', '2')),
  enabled boolean not null default true,
  show_validity boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.metrics (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  ganhos_hoje numeric(12,2) not null default 0,
  corridas integer not null default 0,
  avaliacao numeric(3,2) not null default 0,
  online_minutes integer not null default 0,
  updated_at timestamptz not null default now()
);
create index if not exists metrics_user_updated_idx on public.metrics (user_id, updated_at desc);

create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);

alter table public.licenses enable row level security;
alter table public.activations enable row level security;
alter table public.user_preferences enable row level security;
alter table public.metrics enable row level security;
alter table public.notifications enable row level security;

-- O servidor usa service role, que ignora RLS. Nao crie politicas publicas sem
-- revisar o modelo de autenticacao do aplicativo.

-- Projetos Supabase novos podem nao expor tabelas automaticamente a Data API.
-- Conceda somente os privilegios usados por este backend privilegiado.
grant usage on schema public to service_role;
grant select on table public.licenses, public.activations to service_role;
grant select on table public.metrics, public.notifications to service_role;
grant select, insert, update on table public.user_preferences to service_role;

notify pgrst, 'reload schema';
