create table if not exists media_workers (
  id uuid primary key,
  name text not null,
  token_hash text not null unique,
  created_by uuid not null references users (id),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  last_heartbeat_at timestamptz,
  host_label text,
  max_concurrent integer not null default 1
);

create table if not exists production_jobs (
  id uuid primary key,
  content_id text not null references content_items (content_id),
  idempotency_key text not null unique,
  status text not null,
  spec jsonb not null,
  worker_id uuid references media_workers (id),
  lease_expires_at timestamptz,
  attempt integer not null default 0,
  result jsonb,
  error text,
  created_by uuid not null references users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint production_jobs_status_check check (
    status in (
      'QUEUED',
      'LEASED',
      'ASSEMBLING',
      'UPLOADING',
      'AWAITING_STORAGE',
      'READY_FOR_APPROVAL',
      'APPROVED',
      'FAILED',
      'CANCELLED'
    )
  )
);

create index if not exists production_jobs_status_idx on production_jobs (status, created_at);
