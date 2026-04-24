create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  preferred_locale text not null default 'pt-BR' check (preferred_locale in ('pt-BR', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation' check (char_length(title) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 8000),
  created_at timestamptz not null default now()
);

create table public.chat_rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ip_hash text not null,
  window_start timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, ip_hash, window_start)
);

create index conversations_user_updated_idx on public.conversations(user_id, updated_at desc);
create index messages_conversation_created_idx on public.messages(conversation_id, created_at asc);
create index messages_user_created_idx on public.messages(user_id, created_at desc);
create index chat_rate_limits_user_window_idx on public.chat_rate_limits(user_id, window_start desc);

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.chat_rate_limits enable row level security;

create policy "Users can read their profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "Users can update their profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Users can read their conversations"
on public.conversations for select
to authenticated
using (user_id = auth.uid());

create policy "Users can create their conversations"
on public.conversations for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their conversations"
on public.conversations for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their conversations"
on public.conversations for delete
to authenticated
using (user_id = auth.uid());

create policy "Users can read their messages"
on public.messages for select
to authenticated
using (user_id = auth.uid());

create policy "Users can create messages in their conversations"
on public.messages for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
    and conversations.user_id = auth.uid()
  )
);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_conversations_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

create trigger set_chat_rate_limits_updated_at
before update on public.chat_rate_limits
for each row execute function public.set_updated_at();

create function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger create_profile_after_user_insert
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

create function public.consume_chat_rate_limit(
  p_user_id uuid,
  p_ip_hash text,
  p_limit integer default 10
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count integer;
  current_window timestamptz := date_trunc('minute', now());
begin
  if p_user_id is null or p_ip_hash is null or char_length(p_ip_hash) < 16 then
    return false;
  end if;

  if p_limit < 1 or p_limit > 60 then
    return false;
  end if;

  insert into public.chat_rate_limits (user_id, ip_hash, window_start, request_count)
  values (p_user_id, p_ip_hash, current_window, 1)
  on conflict (user_id, ip_hash, window_start)
  do update set request_count = public.chat_rate_limits.request_count + 1
  returning request_count into next_count;

  return next_count <= p_limit;
end;
$$;

revoke all on function public.consume_chat_rate_limit(uuid, text, integer) from public;
grant execute on function public.consume_chat_rate_limit(uuid, text, integer) to authenticated;
