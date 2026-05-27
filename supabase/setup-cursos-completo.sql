-- ============================================================
-- SUPABASE: setup completo para subir cursos y capítulos
-- Copia TODO este archivo y ejecútalo en:
-- Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1) Tabla de cursos (si no existe)
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  thumbnail text not null default '',
  category text not null default 'General',
  module text not null default 'Sin capítulos',
  progress numeric not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Si la tabla ya existía pero le faltan columnas:
alter table public.courses add column if not exists description text not null default '';
alter table public.courses add column if not exists thumbnail text not null default '';
alter table public.courses add column if not exists category text not null default 'General';
alter table public.courses add column if not exists module text not null default 'Sin capítulos';
alter table public.courses add column if not exists progress numeric not null default 0;
alter table public.courses add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.courses add column if not exists created_at timestamptz not null default now();

-- 2) Tabla de capítulos
create table if not exists public.course_chapters (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  video_url text,
  duration text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists course_chapters_course_id_idx on public.course_chapters(course_id);

-- 3) RLS (tu backend usa service_role y lo ignora, pero evita errores en el dashboard)
alter table public.courses enable row level security;
alter table public.course_chapters enable row level security;

drop policy if exists "courses_select_all" on public.courses;
create policy "courses_select_all" on public.courses for select using (true);

drop policy if exists "courses_insert_all" on public.courses;
create policy "courses_insert_all" on public.courses for insert with check (true);

drop policy if exists "courses_update_all" on public.courses;
create policy "courses_update_all" on public.courses for update using (true);

drop policy if exists "chapters_select_all" on public.course_chapters;
create policy "chapters_select_all" on public.course_chapters for select using (true);

drop policy if exists "chapters_insert_all" on public.course_chapters;
create policy "chapters_insert_all" on public.course_chapters for insert with check (true);

drop policy if exists "chapters_update_all" on public.course_chapters;
create policy "chapters_update_all" on public.course_chapters for update using (true);

-- 4) Storage: bucket para fotos (la app usa el bucket "Avatars")
insert into storage.buckets (id, name, public)
values ('Avatars', 'Avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'Avatars');

drop policy if exists "avatars_service_upload" on storage.objects;
create policy "avatars_service_upload"
  on storage.objects for insert
  with check (bucket_id = 'Avatars');

drop policy if exists "avatars_service_update" on storage.objects;
create policy "avatars_service_update"
  on storage.objects for update
  using (bucket_id = 'Avatars');
