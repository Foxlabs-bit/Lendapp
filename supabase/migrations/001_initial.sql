-- =============================================
-- LEND APP — Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/nunygjzicawqvskxnawf/sql
-- =============================================

-- ENUMS
create type loan_status as enum ('active', 'returned', 'overdue', 'lost');
create type item_category as enum ('Electronics', 'Tools', 'Books', 'Clothing', 'Sports', 'Kitchen', 'Office', 'Other');
create type plan_tier as enum ('free', 'pro');

-- PROFILES
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text not null unique,
  email text not null unique,
  avatar_url text,
  display_name text,
  plan plan_tier not null default 'free',
  square_customer_id text,
  square_subscription_id text,
  plan_activated_at timestamptz,
  item_limit int not null default 10,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ITEMS
create table items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  emoji text not null default '📦',
  category item_category not null default 'Other',
  total_quantity int not null default 1,
  description text,
  image_url text,
  serial_number text,
  purchase_date date,
  purchase_price numeric(10,2),
  notes text,
  is_archived boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- BORROWERS (saved contacts)
create table borrowers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  avatar_emoji text default '👤',
  notes text,
  total_loans int default 0,
  created_at timestamptz default now()
);

-- LOANS
create table loans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  borrower_id uuid references borrowers(id) on delete set null,
  borrower_name text not null,
  quantity int not null default 1,
  status loan_status not null default 'active',
  borrowed_at date not null default current_date,
  due_at date not null,
  returned_at date,
  location_note text,
  condition_out text,
  condition_in text,
  reminder_sent boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- LOAN EVENTS (activity log)
create table loan_events (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  owner_id uuid not null references profiles(id) on delete cascade,
  event_type text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- REMINDERS
create table reminders (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  owner_id uuid not null references profiles(id) on delete cascade,
  remind_at timestamptz not null,
  sent boolean default false,
  method text default 'in_app',
  created_at timestamptz default now()
);

-- NOTIFICATIONS
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  loan_id uuid references loans(id) on delete cascade,
  title text not null,
  body text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- UPDATED_AT TRIGGERS
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger items_updated_at before update on items for each row execute function update_updated_at();
create trigger loans_updated_at before update on loans for each row execute function update_updated_at();
create trigger profiles_updated_at before update on profiles for each row execute function update_updated_at();

-- FULL TEXT SEARCH INDEXES
create index items_search_idx on items using gin(to_tsvector('english', name || ' ' || coalesce(description,'')));
create index loans_search_idx on loans using gin(to_tsvector('english', borrower_name));

-- ROW LEVEL SECURITY
alter table profiles enable row level security;
alter table items enable row level security;
alter table borrowers enable row level security;
alter table loans enable row level security;
alter table loan_events enable row level security;
alter table reminders enable row level security;
alter table notifications enable row level security;

create policy "own_profile" on profiles for all using (auth.uid() = id);
create policy "own_items" on items for all using (auth.uid() = owner_id);
create policy "own_borrowers" on borrowers for all using (auth.uid() = owner_id);
create policy "own_loans" on loans for all using (auth.uid() = owner_id);
create policy "own_events" on loan_events for all using (auth.uid() = owner_id);
create policy "own_reminders" on reminders for all using (auth.uid() = owner_id);
create policy "own_notifications" on notifications for all using (auth.uid() = user_id);

-- REALTIME
alter publication supabase_realtime add table loans;
alter publication supabase_realtime add table loan_events;
alter publication supabase_realtime add table notifications;

-- STORAGE BUCKET
insert into storage.buckets (id, name, public) values ('item-images', 'item-images', true);

create policy "Public read item images" on storage.objects
  for select using (bucket_id = 'item-images');

create policy "Authenticated upload item images" on storage.objects
  for insert with check (bucket_id = 'item-images' and auth.role() = 'authenticated');

create policy "Owner delete item images" on storage.objects
  for delete using (bucket_id = 'item-images' and auth.uid()::text = (storage.foldername(name))[1]);
