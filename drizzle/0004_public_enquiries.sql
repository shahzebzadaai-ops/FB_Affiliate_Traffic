create table if not exists public_enquiries (
  id uuid primary key,
  kind text not null,
  name text not null,
  email text not null,
  topic text not null,
  message text not null,
  created_at timestamptz not null default now(),
  constraint public_enquiries_kind_check check (kind in ('contact', 'careers'))
);

create table if not exists public_enquiry_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists public_enquiry_attempts_ip_idx
  on public_enquiry_attempts (ip_hash, created_at);
