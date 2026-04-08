-- ============================================================
-- Social Media Post Tracker — Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Portfolios (the 6 brands/accounts being tracked)
create table if not exists portfolios (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique not null,
  created_at timestamptz default now()
);

-- Platform handles per portfolio
create table if not exists platform_handles (
  id              uuid primary key default gen_random_uuid(),
  portfolio_id    uuid not null references portfolios(id) on delete cascade,
  platform        text not null check (platform in ('instagram','tiktok','x','linkedin','facebook')),
  handle          text not null,
  profile_url     text,
  last_scraped_at timestamptz,
  created_at      timestamptz default now(),
  unique (portfolio_id, platform)
);

-- Individual posts captured from each platform
create table if not exists posts (
  id                  uuid primary key default gen_random_uuid(),
  platform_handle_id  uuid not null references platform_handles(id) on delete cascade,
  platform_post_id    text,                 -- native ID from the platform
  posted_at           timestamptz,          -- null if platform didn't expose it
  content_snippet     text,
  post_url            text,
  scraped_at          timestamptz default now(),
  unique (platform_handle_id, platform_post_id)
);

-- Per-run scrape audit log
create table if not exists scrape_logs (
  id                  uuid primary key default gen_random_uuid(),
  platform_handle_id  uuid references platform_handles(id) on delete cascade,
  status              text not null check (status in ('success','partial','failed')),
  posts_found         int default 0,
  error_message       text,
  scraped_at          timestamptz default now()
);

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists posts_handle_id_idx       on posts (platform_handle_id);
create index if not exists posts_posted_at_idx       on posts (posted_at desc);
create index if not exists platform_handles_pid_idx  on platform_handles (portfolio_id);

-- ============================================================
-- Row Level Security — public read, service-role write
-- ============================================================
alter table portfolios       enable row level security;
alter table platform_handles enable row level security;
alter table posts             enable row level security;
alter table scrape_logs       enable row level security;

create policy "public read portfolios"       on portfolios       for select using (true);
create policy "public read platform_handles" on platform_handles for select using (true);
create policy "public read posts"            on posts            for select using (true);
create policy "public read scrape_logs"      on scrape_logs      for select using (true);

-- ============================================================
-- Seed: portfolios
-- ============================================================
insert into portfolios (name, slug) values
  ('DOTTEQ Communications',        'dotteq'),
  ('JEC (Jet Exclusive Concierge)', 'jec'),
  ('Unedited Plug',                 'unedited-plug'),
  ('WayGenie',                      'waygenie'),
  ('Unedited Daily',                'unedited-daily'),
  ('Quadri Aminu',                  'quadri-aminu')
on conflict (slug) do nothing;

-- ============================================================
-- Seed: platform handles
-- ============================================================

-- DOTTEQ Communications
insert into platform_handles (portfolio_id, platform, handle, profile_url)
select id, 'linkedin',  'dotteq-communications-ltd', 'https://www.linkedin.com/company/dotteq-communications-ltd/'
from portfolios where slug = 'dotteq' on conflict do nothing;

insert into platform_handles (portfolio_id, platform, handle, profile_url)
select id, 'instagram', 'dotteqcommunications', 'https://www.instagram.com/dotteqcommunications/'
from portfolios where slug = 'dotteq' on conflict do nothing;

insert into platform_handles (portfolio_id, platform, handle, profile_url)
select id, 'tiktok',    'dotteqcommunications', 'https://www.tiktok.com/@dotteqcommunications'
from portfolios where slug = 'dotteq' on conflict do nothing;

insert into platform_handles (portfolio_id, platform, handle, profile_url)
select id, 'x',         'dotteqcommunications', 'https://x.com/dotteqcommunications'
from portfolios where slug = 'dotteq' on conflict do nothing;

insert into platform_handles (portfolio_id, platform, handle, profile_url)
select id, 'facebook',  'dotteqcommunications', 'https://www.facebook.com/dotteqcommunications'
from portfolios where slug = 'dotteq' on conflict do nothing;

-- JEC (Jet Exclusive Concierge)
insert into platform_handles (portfolio_id, platform, handle, profile_url)
select id, 'linkedin',  'jetexclusiveltd', 'https://www.linkedin.com/company/jetexclusiveltd/'
from portfolios where slug = 'jec' on conflict do nothing;

insert into platform_handles (portfolio_id, platform, handle, profile_url)
select id, 'instagram', 'jetexclusiveconcierge', 'https://www.instagram.com/jetexclusiveconcierge/'
from portfolios where slug = 'jec' on conflict do nothing;

insert into platform_handles (portfolio_id, platform, handle, profile_url)
select id, 'tiktok',    'jetexclusiveconcierge', 'https://www.tiktok.com/@jetexclusiveconcierge'
from portfolios where slug = 'jec' on conflict do nothing;

insert into platform_handles (portfolio_id, platform, handle, profile_url)
select id, 'x',         'jetexclusiveltd', 'https://x.com/jetexclusiveltd'
from portfolios where slug = 'jec' on conflict do nothing;

insert into platform_handles (portfolio_id, platform, handle, profile_url)
select id, 'facebook',  'jetexclusiveltd', 'https://www.facebook.com/jetexclusiveltd'
from portfolios where slug = 'jec' on conflict do nothing;

-- Unedited Plug
insert into platform_handles (portfolio_id, platform, handle, profile_url)
select id, 'linkedin',  'UneditedPlug', 'https://www.linkedin.com/company/UneditedPlug/'
from portfolios where slug = 'unedited-plug' on conflict do nothing;

insert into platform_handles (portfolio_id, platform, handle, profile_url)
select id, 'instagram', 'uneditedplug', 'https://www.instagram.com/uneditedplug/'
from portfolios where slug = 'unedited-plug' on conflict do nothing;

insert into platform_handles (portfolio_id, platform, handle, profile_url)
select id, 'x',         'UneditedPlug', 'https://x.com/UneditedPlug'
from portfolios where slug = 'unedited-plug' on conflict do nothing;

insert into platform_handles (portfolio_id, platform, handle, profile_url)
select id, 'facebook',  'UneditedPlug', 'https://www.facebook.com/UneditedPlug'
from portfolios where slug = 'unedited-plug' on conflict do nothing;

-- WayGenie
insert into platform_handles (portfolio_id, platform, handle, profile_url)
select id, 'linkedin',  'waygenie-app', 'https://www.linkedin.com/company/waygenie-app/'
from portfolios where slug = 'waygenie' on conflict do nothing;

insert into platform_handles (portfolio_id, platform, handle, profile_url)
select id, 'instagram', 'Waygenie.app', 'https://www.instagram.com/Waygenie.app/'
from portfolios where slug = 'waygenie' on conflict do nothing;

insert into platform_handles (portfolio_id, platform, handle, profile_url)
select id, 'x',         'Waygenie.app', 'https://x.com/Waygenie.app'
from portfolios where slug = 'waygenie' on conflict do nothing;

insert into platform_handles (portfolio_id, platform, handle, profile_url)
select id, 'facebook',  'Waygenie.app', 'https://www.facebook.com/Waygenie.app'
from portfolios where slug = 'waygenie' on conflict do nothing;

-- Unedited Daily
insert into platform_handles (portfolio_id, platform, handle, profile_url)
select id, 'instagram', 'Unedited_daily', 'https://www.instagram.com/Unedited_daily/'
from portfolios where slug = 'unedited-daily' on conflict do nothing;

insert into platform_handles (portfolio_id, platform, handle, profile_url)
select id, 'x',         'Unedited_daily', 'https://x.com/Unedited_daily'
from portfolios where slug = 'unedited-daily' on conflict do nothing;

-- Quadri Aminu
insert into platform_handles (portfolio_id, platform, handle, profile_url)
select id, 'instagram', 'quadamin', 'https://www.instagram.com/quadamin/'
from portfolios where slug = 'quadri-aminu' on conflict do nothing;

insert into platform_handles (portfolio_id, platform, handle, profile_url)
select id, 'linkedin',  'aminu-quadri', 'https://www.linkedin.com/in/aminu-quadri/'
from portfolios where slug = 'quadri-aminu' on conflict do nothing;
