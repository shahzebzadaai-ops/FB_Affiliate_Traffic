create table if not exists creative_providers (
  id text primary key,
  name text not null,
  provider_type text not null check (provider_type in ('EXTERNAL_MANUAL', 'API')),
  website_url text,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists provider_capabilities (
  provider_id text not null references creative_providers (id),
  capability text not null,
  label text not null,
  status text not null check (status in ('UNTESTED', 'CONFIRMED', 'UNAVAILABLE')),
  primary key (provider_id, capability)
);

create table if not exists creative_packages (
  id uuid primary key,
  campaign_id text not null references campaigns (id),
  content_id text not null references content_items (content_id),
  provider_id text not null references creative_providers (id),
  preset text not null,
  stage text not null check (stage in (
    'IDEA', 'SCRIPT_READY', 'PROMPTS_READY', 'EXTERNAL_GENERATION', 'ASSETS_UPLOADED', 'REVIEW', 'APPROVED'
  )),
  prompt_version integer not null default 1,
  package jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creative_packages_content_idx on creative_packages (content_id);

create table if not exists creative_assets (
  id uuid primary key,
  package_id uuid not null references creative_packages (id),
  campaign_id text not null,
  content_id text not null,
  offer_id text,
  provider_id text not null,
  scene_number integer,
  prompt text not null,
  prompt_version integer not null,
  content_type text not null,
  aspect_ratio text,
  duration_seconds numeric,
  width integer,
  height integer,
  storage_path text not null,
  original_filename text not null,
  review_notes text not null default '',
  approval_status text not null check (approval_status in ('UPLOADED', 'REVIEW', 'APPROVED', 'REJECTED')),
  generated_on date,
  created_at timestamptz not null default now()
);

create table if not exists provider_balances (
  id uuid primary key,
  provider_id text not null references creative_providers (id),
  recorded_balance bigint not null,
  tokens_spent bigint,
  note text not null default '',
  recorded_at timestamptz not null default now(),
  recorded_by uuid references users (id)
);

create table if not exists provider_usage_events (
  id uuid primary key,
  provider_id text not null references creative_providers (id),
  kind text not null check (kind in ('FINISHED_VIDEO', 'FINISHED_IMAGE', 'REJECTED')),
  tokens_spent bigint,
  asset_id uuid references creative_assets (id),
  note text not null default '',
  recorded_at timestamptz not null default now(),
  recorded_by uuid references users (id)
);

insert into creative_providers (id, name, provider_type, website_url, notes)
values (
  'muse-web-studio',
  'Muse AI — Web Studio',
  'EXTERNAL_MANUAL',
  null,
  'Manual website only. No account credentials are stored. No API calls are made.'
)
on conflict (id) do nothing;

insert into provider_capabilities (provider_id, capability, label, status)
values
  ('muse-web-studio', 'text-to-video', 'Text-to-video', 'UNTESTED'),
  ('muse-web-studio', 'image-to-video', 'Image-to-video', 'UNTESTED'),
  ('muse-web-studio', 'text-to-image', 'Text-to-image', 'UNTESTED'),
  ('muse-web-studio', 'image-editing', 'Image editing', 'UNTESTED'),
  ('muse-web-studio', 'short-form-reels', 'Short-form reels', 'UNTESTED'),
  ('muse-web-studio', 'product-advertisement', 'Product advertisement creatives', 'UNTESTED'),
  ('muse-web-studio', 'comparison-video', 'Comparison-video visuals', 'UNTESTED'),
  ('muse-web-studio', 'long-form-planning', 'Long-form video planning', 'UNTESTED')
on conflict (provider_id, capability) do nothing;
