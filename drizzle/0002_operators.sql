alter table users drop constraint if exists users_role_check;

alter table users add constraint users_role_check check (
  role in (
    'SUPER_ADMIN',
    'ADMIN',
    'CONTENT_MANAGER',
    'CONTENT_OPERATOR',
    'PUBLISHING_OPERATOR',
    'DESIGNER',
    'VIDEO_EDITOR',
    'AFFILIATE_MANAGER',
    'ANALYST'
  )
);

create table if not exists social_pages (
  code text primary key,
  name text not null,
  country_code text not null,
  slug text not null unique,
  status text not null,
  persona text not null,
  created_at timestamptz not null default now()
);

create table if not exists page_assignments (
  id uuid primary key,
  user_id uuid not null references users (id) on delete cascade,
  page_code text not null references social_pages (code),
  assigned_by uuid references users (id),
  assigned_at timestamptz not null default now(),
  unique (user_id, page_code)
);

create index if not exists page_assignments_user_idx on page_assignments (user_id);

create table if not exists invitations (
  id uuid primary key,
  email text not null,
  name text not null,
  token_hash text not null unique,
  page_codes jsonb not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_by uuid not null references users (id),
  created_at timestamptz not null default now()
);
