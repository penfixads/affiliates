-- BrillianLabs Affiliate Management System — Schema v2
-- Run this in Supabase SQL Editor AFTER the original schema-v1 was run.

-- ─── 1. PROGRAMS ────────────────────────────────────────────────────────────
create table if not exists programs (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  commission_rate  numeric not null default 20,
  type             text not null check (type in ('bibliotech', 'solutions')),
  product_url      text default '#',
  active           boolean default true,
  created_at       timestamptz default now()
);

insert into programs (name, slug, commission_rate, type, product_url) values
  ('Still Broke While Earning',       'still-broke',     20, 'bibliotech', 'https://bibliotech.brilliantlabsph.com/still-broke-while-earning'),
  ('AppSheet Job Ordering System',    'appsheet-system', 20, 'solutions',  'https://solutions.brilliantlabsph.com/appsheet')
on conflict (slug) do nothing;

-- ─── 2. UPDATE affiliate_applications ───────────────────────────────────────
alter table affiliate_applications
  add column if not exists program_ids uuid[] default '{}';

-- ─── 3. APPLICATION_PROGRAMS — per-program approval tracking ────────────────
create table if not exists application_programs (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid references affiliate_applications(id) on delete cascade,
  program_id      uuid references programs(id) on delete cascade,
  status          text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at      timestamptz default now(),
  unique(application_id, program_id)
);

-- ─── 4. UPDATE affiliates — add referral_code ───────────────────────────────
alter table affiliates
  add column if not exists referral_code text unique;

-- ─── 5. AFFILIATE_PROGRAMS — approved access + per-program referral code ────
create table if not exists affiliate_programs (
  id             uuid primary key default gen_random_uuid(),
  affiliate_id   uuid references affiliates(id) on delete cascade,
  program_id     uuid references programs(id) on delete cascade,
  referral_code  text not null unique,
  created_at     timestamptz default now(),
  unique(affiliate_id, program_id)
);

-- ─── 6. REFERRAL_CLICKS ─────────────────────────────────────────────────────
create table if not exists referral_clicks (
  id             uuid primary key default gen_random_uuid(),
  referral_code  text not null,
  program_id     uuid references programs(id),
  affiliate_id   uuid references affiliates(id),
  ip_hash        text,
  user_agent     text,
  created_at     timestamptz default now()
);

-- ─── 7. SALES ───────────────────────────────────────────────────────────────
create table if not exists sales (
  id             uuid primary key default gen_random_uuid(),
  affiliate_id   uuid references affiliates(id),
  program_id     uuid references programs(id),
  referral_code  text,
  amount         numeric not null default 0,
  commission     numeric not null default 0,
  status         text not null default 'pending' check (status in ('pending','paid')),
  created_at     timestamptz default now(),
  paid_at        timestamptz
);

-- ─── GRANTS ─────────────────────────────────────────────────────────────────
grant all on programs              to service_role, anon, authenticated;
grant all on application_programs  to service_role, authenticated;
grant all on affiliate_programs    to service_role, authenticated;
grant all on referral_clicks       to service_role, anon, authenticated;
grant all on sales                 to service_role, authenticated;

-- ─── RLS ────────────────────────────────────────────────────────────────────
alter table programs             enable row level security;
alter table application_programs enable row level security;
alter table affiliate_programs   enable row level security;
alter table referral_clicks      enable row level security;
alter table sales                enable row level security;

-- Programs: public read
create policy "Public read programs"
  on programs for select to anon, authenticated using (true);

-- Service role bypasses RLS automatically for admin ops.

-- Affiliate programs: own rows only
create policy "Affiliates read own programs"
  on affiliate_programs for select to authenticated
  using (affiliate_id = auth.uid());

-- Sales: own rows only
create policy "Affiliates read own sales"
  on sales for select to authenticated
  using (affiliate_id = auth.uid());

-- Clicks: anyone can insert, affiliates read own
create policy "Anyone can track clicks"
  on referral_clicks for insert to anon, authenticated
  with check (true);

create policy "Affiliates read own clicks"
  on referral_clicks for select to authenticated
  using (affiliate_id = auth.uid());
