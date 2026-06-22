create table if not exists public.portal_state (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.portal_state enable row level security;

revoke all on public.portal_state from anon;
revoke all on public.portal_state from authenticated;

comment on table public.portal_state is 'Estado persistente del Portal CEIC UCN. Solo el backend accede con secret key.';
