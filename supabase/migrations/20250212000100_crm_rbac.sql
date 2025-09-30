-- Schema for CRM contacts with RBAC/RLS aligned to Owner/Leader/Rep roles
create extension if not exists "pgcrypto" with schema public;

create type public.member_role as enum ('owner', 'leader', 'rep');
create type public.contact_stage as enum ('prospecting', 'discovery', 'negotiation', 'blocked', 'won', 'lost');

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null unique,
  role public.member_role not null,
  leader_id uuid references public.members(id) on delete set null,
  full_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  company text,
  email text,
  phone text,
  stage public.contact_stage not null default 'prospecting',
  owner_member_id uuid references public.members(id) on delete set null,
  assigned_member_id uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_activities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  actor_member_id uuid references public.members(id) on delete set null,
  type text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_members_updated_at
  before update on public.members
  for each row
  execute function public.touch_updated_at();

create trigger set_contacts_updated_at
  before update on public.contacts
  for each row
  execute function public.touch_updated_at();

create or replace function public.current_member()
returns public.members
language sql
stable
security definer
set search_path = public
as $$
  select m
  from public.members m
  where m.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.member_can_access_contact(target public.contacts)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  requester public.members;
  assignee public.members;
BEGIN
  requester := public.current_member();
  if requester is null then
    return false;
  end if;

  if requester.org_id <> target.org_id then
    return false;
  end if;

  if requester.role = 'owner' then
    return true;
  end if;

  if requester.id = target.owner_member_id or requester.id = target.assigned_member_id then
    return true;
  end if;

  if requester.role = 'leader' then
    if target.assigned_member_id is null then
      return true;
    end if;
    select * into assignee from public.members where id = target.assigned_member_id;
    if assignee.leader_id = requester.id then
      return true;
    end if;
  end if;

  return false;
END;
$$;

create or replace function public.member_can_manage_contact(target public.contacts)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  requester public.members;
  assignee public.members;
BEGIN
  requester := public.current_member();
  if requester is null then
    return false;
  end if;

  if requester.org_id <> target.org_id then
    return false;
  end if;

  if requester.role = 'owner' then
    return true;
  end if;

  if requester.role = 'leader' then
    if target.assigned_member_id is null then
      return true;
    end if;
    select * into assignee from public.members where id = target.assigned_member_id;
    if assignee.leader_id = requester.id or target.owner_member_id = requester.id then
      return true;
    end if;
  end if;

  if requester.role = 'rep' then
    if requester.id = target.assigned_member_id or requester.id = target.owner_member_id then
      return true;
    end if;
  end if;

  return false;
END;
$$;

alter table public.members enable row level security;
alter table public.contacts enable row level security;
alter table public.contact_activities enable row level security;

create policy "Members can view self" on public.members
  for select
  using (user_id = auth.uid());

create policy "Members manage self" on public.members
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Contacts are readable" on public.contacts
  for select
  using (public.member_can_access_contact(contacts));

create policy "Contacts are insertable" on public.contacts
  for insert
  with check (
    public.member_can_manage_contact(contacts)
    and contacts.org_id = (public.current_member()).org_id
  );

create policy "Contacts are updatable" on public.contacts
  for update
  using (public.member_can_manage_contact(contacts))
  with check (public.member_can_manage_contact(contacts));

create policy "Contacts are deletable by owner" on public.contacts
  for delete
  using (
    (public.current_member()).role = 'owner'
    and (public.current_member()).org_id = contacts.org_id
  );

create or replace function public.member_can_access_activity(target public.contact_activities)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.member_can_access_contact(c)
  from public.contacts c
  where c.id = target.contact_id;
$$;

create policy "Activities readable" on public.contact_activities
  for select
  using (public.member_can_access_activity(contact_activities));

create policy "Activities insertable" on public.contact_activities
  for insert
  with check (
    public.member_can_access_activity(contact_activities)
    and contact_activities.actor_member_id = (public.current_member()).id
  );

create policy "Activities deletable by owner" on public.contact_activities
  for delete
  using ((public.current_member()).role = 'owner');
