-- Ejecuta este script en el SQL Editor de Supabase si aún no tienes la tabla de capítulos.

-- Capítulos por curso
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

-- Opcional: quién creó el curso
alter table public.courses add column if not exists created_by uuid references auth.users(id);
