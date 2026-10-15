create table if not exists research_packages (
  id uuid primary key,
  content_id text not null unique,
  page_code text not null,
  status text not null,
  evidence jsonb not null,
  evaluation jsonb,
  approved_candidate_id text,
  script jsonb,
  muse_package jsonb,
  model text,
  usage jsonb,
  publishing text not null default 'disabled',
  created_by uuid references users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint research_packages_page_check check (page_code = 'BGUK'),
  constraint research_packages_status_check check (status in ('EVIDENCE', 'CANDIDATES', 'APPROVED', 'PACKAGE_READY')),
  constraint research_packages_publishing_check check (publishing = 'disabled'),
  constraint research_packages_content_id_check check (content_id ~ '^RI-BGUK-[0-9]{3}$')
);

create index if not exists research_packages_created_idx on research_packages (created_at desc);
