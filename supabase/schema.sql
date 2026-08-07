-- supabase/schema.sql
--
-- Run this once in the Supabase SQL editor (or via `supabase db push`)
-- for your project. Idempotent: safe to re-run.
--
-- SIMPLIFIED per explicit decision: this app no longer cares about
-- product info (title/price/currency/image_url) at all — only QC
-- photos matter. The code (services/database.js) now only ever
-- reads/writes: products(product_id, platform, original_url) and
-- quality_checks(product_id, image_url). No `agent`, no `last_seen_at`
-- — those were the source of repeated "column does not exist" errors;
-- removing the dependency from the code is the fix this time, not
-- another migration to chase.

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ---------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------
-- title/price/currency/image_url are NOT dropped here even though the
-- app no longer uses them — dropping columns on a live table you might
-- still have data in is a needlessly destructive move for zero benefit
-- (unused nullable columns are harmless). If you want them gone for
-- real, that's a manual `alter table products drop column ...` you run
-- yourself when you're sure; not included here.
create table if not exists products (
  id            uuid primary key default gen_random_uuid(),
  product_id    text unique not null,   -- source-platform id (1688/Taobao/Weidian offer id)
  platform      text,                   -- "1688" | "taobao" | "weidian"
  original_url  text,                   -- server-only, see RLS below — used only to generate the Kakobuy link
  title         text,                   -- UNUSED by the app — kept, not dropped (see note above)
  price         numeric,                -- UNUSED by the app — kept, not dropped
  currency      text default 'USD',     -- UNUSED by the app — kept, not dropped
  image_url     text,                   -- UNUSED by the app — kept, not dropped
  created_at    timestamptz default now()
);

-- ---------------------------------------------------------------------
-- quality_checks
-- ---------------------------------------------------------------------
-- Exactly the columns services/database.js actually queries. If your
-- live table already has extra columns (agent, last_seen_at) from an
-- earlier version of this project, leaving them there is harmless — the
-- app simply never selects or writes them anymore.
create table if not exists quality_checks (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid references products(id) on delete cascade,
  image_url     text not null,
  created_at    timestamptz default now(),
  unique (product_id, image_url)  -- the same QC image can never be inserted twice for a product
);

create index if not exists quality_checks_product_id_idx on quality_checks (product_id);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table products enable row level security;
alter table quality_checks enable row level security;

drop policy if exists "Public can read products" on products;
create policy "Public can read products"
  on products for select
  using (true);

drop policy if exists "Public can read quality checks" on quality_checks;
create policy "Public can read quality checks"
  on quality_checks for select
  using (true);

-- No insert/update/delete policies are created for the anon/public role
-- on purpose: with RLS enabled and no matching policy, those operations
-- are simply denied for anon/authenticated. Writes only happen via
-- SUPABASE_SERVICE_ROLE_KEY server-side (services/database.js), which
-- bypasses RLS entirely by design.

-- ---------------------------------------------------------------------
-- Column-level protection for original_url
-- ---------------------------------------------------------------------
-- original_url must never be readable via the public/anon role — used
-- only server-side (service role) to generate the Kakobuy affiliate
-- link, never shown to the user.
revoke select (original_url) on products from anon, authenticated;
