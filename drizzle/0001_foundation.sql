create table if not exists schema_migrations (
  id text primary key,
  applied_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key,
  person_key text not null unique,
  email text not null unique,
  name text not null,
  role text not null,
  password_hash text not null,
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  constraint users_role_check check (
    role in (
      'SUPER_ADMIN',
      'ADMIN',
      'CONTENT_MANAGER',
      'CONTENT_OPERATOR',
      'DESIGNER',
      'VIDEO_EDITOR',
      'AFFILIATE_MANAGER',
      'ANALYST'
    )
  )
);

create table if not exists sessions (
  id uuid primary key,
  user_id uuid not null references users (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists sessions_user_id_idx on sessions (user_id);

create table if not exists login_attempts (
  id bigserial primary key,
  email text not null,
  ip text not null,
  succeeded boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists login_attempts_email_idx on login_attempts (email, created_at);

create table if not exists content_items (
  content_id text primary key,
  source_id text not null,
  page_code text not null,
  assignee_id text not null,
  publication_status text not null,
  unresolved jsonb not null,
  record jsonb not null
);

create table if not exists task_states (
  content_id text primary key references content_items (content_id),
  state jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists training_progress (
  user_id uuid not null references users (id) on delete cascade,
  lesson_key text not null,
  completed boolean not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_key)
);

create table if not exists campaigns (
  id text primary key,
  status text not null,
  started_at timestamptz,
  time_zone text not null,
  plan_version text not null,
  updated_at timestamptz not null default now(),
  constraint campaigns_status_check check (status in ('BUILD', 'ACTIVE')),
  constraint campaigns_start_check check (
    (status = 'BUILD' and started_at is null) or (status = 'ACTIVE' and started_at is not null)
  )
);

create table if not exists audit_events (
  id bigserial primary key,
  at timestamptz not null default now(),
  actor_id uuid references users (id),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  detail jsonb not null default '{}'::jsonb
);

create table if not exists mandala_goals (
  id text primary key,
  title text not null,
  target_amount_cents integer not null,
  currency text not null,
  deadline date,
  notes text not null
);

create table if not exists mandala_pillars (
  id text primary key,
  goal_id text not null references mandala_goals (id),
  position integer not null,
  title text not null,
  unique (goal_id, position)
);

create table if not exists mandala_actions (
  id text primary key,
  pillar_id text not null references mandala_pillars (id),
  position integer not null,
  title text not null,
  description text not null,
  success_criterion text not null,
  owner_label text not null,
  priority text not null,
  status text not null,
  dependencies jsonb not null default '[]'::jsonb,
  due_on date,
  completed_on date,
  evidence jsonb not null default '[]'::jsonb,
  latest_measurement text,
  data_source text,
  confidence text,
  blocker text,
  last_reviewed_on date,
  unique (pillar_id, position),
  constraint mandala_actions_status_check check (
    status in (
      'NOT_STARTED',
      'PLANNED',
      'IN_PROGRESS',
      'BLOCKED',
      'AWAITING_EVIDENCE',
      'NEEDS_REVIEW',
      'COMPLETED',
      'PAUSED'
    )
  )
);
