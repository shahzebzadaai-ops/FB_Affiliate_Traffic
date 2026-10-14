create table if not exists operating_controls (
  id text primary key check (id in ('intelligence', 'creative', 'video_editing', 'publishing')),
  state text not null,
  updated_at timestamptz not null default now(),
  check (
    (id = 'publishing' and state = 'OFF')
    or (id <> 'publishing' and state in ('PAUSED', 'STARTED'))
  )
);

insert into operating_controls (id, state)
values
  ('intelligence', 'PAUSED'),
  ('creative', 'PAUSED'),
  ('video_editing', 'PAUSED'),
  ('publishing', 'OFF')
on conflict (id) do nothing;

create table if not exists intelligence_reports (
  id uuid primary key,
  kind text not null,
  status text not null check (status in ('COMPLETE', 'FAILED')),
  model text,
  live_research boolean not null,
  body jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists story_series (
  id uuid primary key,
  report_id uuid references intelligence_reports (id),
  title text not null,
  approval text not null default 'DRAFT' check (approval in ('DRAFT', 'REVIEW', 'APPROVED')),
  model text,
  live_research boolean not null,
  bible jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists story_episodes (
  id uuid primary key,
  series_id uuid not null references story_series (id),
  episode_number integer not null check (episode_number between 1 and 20),
  title text not null,
  body jsonb not null,
  muse_package jsonb not null,
  unique (series_id, episode_number)
);

create table if not exists story_clips (
  id uuid primary key,
  episode_id uuid not null references story_episodes (id),
  scene_number integer not null check (scene_number between 1 and 12),
  storage_path text not null,
  original_filename text not null,
  content_type text not null,
  bytes integer not null,
  assembled boolean not null default false,
  created_at timestamptz not null default now()
);
