-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

-- 1. Affiliate applications (public submissions, no auth required to insert)
create table if not exists affiliate_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone text not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- 2. Approved affiliates (linked to Supabase Auth users)
create table if not exists affiliates (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table affiliate_applications enable row level security;
alter table affiliates enable row level security;

-- Applications: anyone can insert (apply), only admins can read/update
-- (Admin reads via service role key, so no RLS policy needed for reads via service role)
create policy "Public can submit applications"
  on affiliate_applications for insert
  to anon
  with check (true);

-- Affiliates: users can only read their own row
create policy "Affiliates can read own row"
  on affiliates for select
  to authenticated
  using (auth.uid() = id);

-- 3. Storage bucket for PDFs
-- Run this too:
insert into storage.buckets (id, name, public)
values ('affiliate-books', 'affiliate-books', false)
on conflict do nothing;

-- Allow authenticated users to read from the bucket
create policy "Authenticated affiliates can read books"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'affiliate-books');
