-- Recetario Familiar: esquema de Supabase.
-- Ejecutar una vez en Supabase → SQL Editor → New query → Run.
-- Se puede volver a ejecutar sin perder datos.

-- Familias y sus miembros -----------------------------------------------------
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Familia',
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- Recetas de la familia.
--   data = receta completa (JSON). Para las 25 recetas incluidas en la app:
--   data null = versión original; deleted = oculta.
create table if not exists public.recipes (
  household_id uuid not null references public.households on delete cascade,
  id text not null,
  data jsonb,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid(),
  primary key (household_id, id)
);

-- Estado compartido: favoritos, menú semanal y lista de la compra.
create table if not exists public.household_state (
  household_id uuid not null references public.households on delete cascade,
  key text not null check (key in ('favoritos', 'menu', 'compra')),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid(),
  primary key (household_id, key)
);

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

drop trigger if exists recipes_touch on public.recipes;
create trigger recipes_touch before insert or update on public.recipes
  for each row execute function public.touch_updated_at();
drop trigger if exists household_state_touch on public.household_state;
create trigger household_state_touch before insert or update on public.household_state
  for each row execute function public.touch_updated_at();

-- ¿El usuario actual pertenece a la familia?
create or replace function public.is_member(h uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = h and m.user_id = auth.uid()
  )
$$;

-- Seguridad: cada familia solo ve y modifica sus datos ------------------------
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.recipes enable row level security;
alter table public.household_state enable row level security;

drop policy if exists "miembros ven su familia" on public.households;
create policy "miembros ven su familia" on public.households
  for select to authenticated using (public.is_member(id));

drop policy if exists "miembros ven a su familia" on public.household_members;
create policy "miembros ven a su familia" on public.household_members
  for select to authenticated using (user_id = auth.uid() or public.is_member(household_id));

drop policy if exists "recetas de la familia" on public.recipes;
create policy "recetas de la familia" on public.recipes
  for all to authenticated
  using (public.is_member(household_id))
  with check (public.is_member(household_id));

drop policy if exists "estado de la familia" on public.household_state;
create policy "estado de la familia" on public.household_state
  for all to authenticated
  using (public.is_member(household_id))
  with check (public.is_member(household_id));

grant usage on schema public to authenticated;
grant select on public.households, public.household_members to authenticated;
grant select, insert, update, delete on public.recipes, public.household_state to authenticated;

-- Cada usuario nuevo (los crea el administrador desde Authentication → Users)
-- entra en la familia. Si aún no hay ninguna, se crea.
create or replace function public.join_family() returns trigger
language plpgsql security definer set search_path = '' as $$
declare h uuid;
begin
  select id into h from public.households order by created_at limit 1;
  if h is null then
    insert into public.households default values returning id into h;
  end if;
  insert into public.household_members (household_id, user_id)
    values (h, new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.join_family();

-- Usuarios creados antes de ejecutar este script.
do $$
declare h uuid;
begin
  if exists (select 1 from auth.users) then
    select id into h from public.households order by created_at limit 1;
    if h is null then
      insert into public.households default values returning id into h;
    end if;
    insert into public.household_members (household_id, user_id)
      select h, u.id from auth.users u on conflict do nothing;
  end if;
end $$;

-- Cambios en tiempo real entre los móviles ------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.recipes;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.household_state;
exception when duplicate_object then null;
end $$;

-- Fotos de las recetas ---------------------------------------------------------
-- Lectura pública (las rutas llevan un identificador aleatorio); solo los
-- miembros de la familia pueden subir o borrar en la carpeta de su familia.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 3145728, array['image/jpeg', 'image/webp', 'image/png'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "familia sube fotos" on storage.objects;
create policy "familia sube fotos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos' and public.is_member(((storage.foldername(name))[1])::uuid));

drop policy if exists "familia borra fotos" on storage.objects;
create policy "familia borra fotos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos' and public.is_member(((storage.foldername(name))[1])::uuid));
