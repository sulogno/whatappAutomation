-- ReplyFast Initial Migration
-- 001_initial.sql — Fixed version (uses email auth, not phone)

-- BUSINESSES TABLE
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  owner_id uuid references auth.users(id) on delete cascade,
  owner_email text unique not null,
  owner_phone text default '',  -- owner's personal WhatsApp for receiving alerts
  name text not null,
  business_type text not null default 'other',
  whatsapp_number text default '',
  whatsapp_phone_id text default '',
  whatsapp_access_token text default '',
  ai_context text default '',
  language text default 'hinglish',
  timezone text default 'Asia/Kolkata',
  is_open boolean default true,
  opening_time text default '09:00',
  closing_time text default '21:00',
  closed_days text[] default '{}',
  plan text default 'free',
  plan_expires_at timestamptz,
  razorpay_subscription_id text,
  monthly_message_count integer default 0,
  monthly_message_limit integer default 50,
  is_active boolean default true
);

-- CUSTOMERS TABLE
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  business_id uuid references businesses(id) on delete cascade,
  phone text not null,
  name text,
  total_orders integer default 0,
  last_interaction timestamptz,
  notes text,
  unique(business_id, phone)
);

-- DELIVERY BOYS TABLE (before orders due to FK)
create table if not exists delivery_boys (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  business_id uuid references businesses(id) on delete cascade,
  name text not null,
  phone text not null,
  whatsapp_number text not null,
  is_available boolean default true,
  is_active boolean default true,
  current_order_id uuid,
  total_deliveries integer default 0,
  unique(business_id, whatsapp_number)
);

-- BOOKINGS TABLE (before queue due to FK)
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  business_id uuid references businesses(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  customer_name text,
  customer_phone text,
  service_type text,
  slot_date date not null,
  slot_time text not null,
  slot_duration integer default 60,
  status text default 'confirmed',
  reminder_sent boolean default false,
  notes text
);

-- ORDERS TABLE
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  business_id uuid references businesses(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  order_number serial,
  items jsonb not null default '[]',
  total_amount numeric(10,2) default 0,
  status text default 'pending',
  payment_method text default 'cod',
  delivery_address text,
  delivery_type text default 'pickup',
  delivery_boy_id uuid references delivery_boys(id) on delete set null,
  special_instructions text,
  estimated_time integer,
  notes text
);

-- QUEUE TABLE
create table if not exists queue (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  business_id uuid references businesses(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  customer_phone text,
  customer_name text,
  token_number integer not null,
  service_type text,
  entry_type text not null default 'walkin',
  status text default 'waiting',
  booking_id uuid references bookings(id) on delete set null,
  estimated_wait integer,
  actual_start timestamptz,
  actual_end timestamptz,
  notified_at timestamptz,
  date date default current_date
);

-- CONVERSATIONS TABLE
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  business_id uuid references businesses(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  message_text text not null,
  direction text not null,
  sender text not null default 'customer',
  wa_message_id text,
  intent text,
  is_ai_handled boolean default true
);

-- DELIVERY ASSIGNMENTS TABLE
create table if not exists delivery_assignments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  order_id uuid references orders(id) on delete cascade,
  delivery_boy_id uuid references delivery_boys(id) on delete set null,
  business_id uuid references businesses(id) on delete cascade,
  status text default 'pending',
  assigned_at timestamptz default now(),
  accepted_at timestamptz,
  picked_at timestamptz,
  delivered_at timestamptz,
  attempt_number integer default 1
);

-- INVENTORY TABLE
create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  business_id uuid references businesses(id) on delete cascade,
  item_name text not null,
  category text,
  price numeric(10,2),
  stock_quantity integer,
  unit text,
  low_stock_alert integer default 5,
  is_available boolean default true,
  description text,
  unique(business_id, item_name)
);

-- SLOT CONFIG TABLE
create table if not exists slot_config (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  day_of_week integer not null,
  start_time text not null,
  end_time text not null,
  slot_duration integer default 60,
  max_concurrent integer default 1,
  is_active boolean default true,
  unique(business_id, day_of_week)
);

-- Enable Row Level Security
alter table businesses enable row level security;
alter table customers enable row level security;
alter table conversations enable row level security;
alter table orders enable row level security;
alter table queue enable row level security;
alter table bookings enable row level security;
alter table delivery_boys enable row level security;
alter table delivery_assignments enable row level security;
alter table inventory enable row level security;
alter table slot_config enable row level security;

-- RLS POLICIES — use auth.uid() for owner_id (email based auth)
create policy "Owner can manage their business" on businesses
  for all using (auth.uid() = owner_id);

create policy "Service role full access to businesses" on businesses
  for all using (true)
  with check (true);

-- For all other tables: allow if business belongs to current user
-- OR allow service role (for server-side operations)

create policy "Owner access to customers" on customers
  for all using (
    business_id in (select id from businesses where owner_id = auth.uid())
  );

create policy "Owner access to orders" on orders
  for all using (
    business_id in (select id from businesses where owner_id = auth.uid())
  );

create policy "Owner access to queue" on queue
  for all using (
    business_id in (select id from businesses where owner_id = auth.uid())
  );

create policy "Owner access to bookings" on bookings
  for all using (
    business_id in (select id from businesses where owner_id = auth.uid())
  );

create policy "Owner access to inventory" on inventory
  for all using (
    business_id in (select id from businesses where owner_id = auth.uid())
  );

create policy "Owner access to delivery boys" on delivery_boys
  for all using (
    business_id in (select id from businesses where owner_id = auth.uid())
  );

create policy "Owner access to conversations" on conversations
  for all using (
    business_id in (select id from businesses where owner_id = auth.uid())
  );

create policy "Owner access to delivery assignments" on delivery_assignments
  for all using (
    business_id in (select id from businesses where owner_id = auth.uid())
  );

create policy "Owner access to slot config" on slot_config
  for all using (
    business_id in (select id from businesses where owner_id = auth.uid())
  );

-- Enable Realtime for live updates
alter publication supabase_realtime add table queue;
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table delivery_assignments;

-- FUNCTIONS

-- Atomic message count increment (no race conditions)
create or replace function increment_message_count(business_id uuid)
returns void language sql security definer as $$
  update businesses
  set monthly_message_count = monthly_message_count + 1
  where id = business_id;
$$;

-- Reset all message counts (run monthly via cron)
create or replace function reset_monthly_counts()
returns void language sql security definer as $$
  update businesses set monthly_message_count = 0;
$$;

-- Increment delivery count for a delivery boy
create or replace function increment_delivery_count(boy_id uuid)
returns void language sql security definer as $$
  update delivery_boys
  set total_deliveries = total_deliveries + 1
  where id = boy_id;
$$;