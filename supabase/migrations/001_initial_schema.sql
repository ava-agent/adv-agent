-- ADV Moto Hub - Supabase Schema
-- Run this in the Supabase SQL editor to set up the database

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  nickname text not null default '骑士',
  avatar_url text not null default '',
  bio text not null default '',
  bikes jsonb not null default '[]',
  favorites text[] not null default '{}',
  is_premium boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row Level Security for users
alter table public.users enable row level security;

create policy "Users can read all profiles"
  on public.users for select using (true);

create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert with check (auth.uid() = id);

-- ============================================================
-- ROUTES TABLE
-- ============================================================
create table if not exists public.routes (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null default '',
  difficulty_level integer not null default 1 check (difficulty_level between 1 and 5),
  terrain_tags text[] not null default '{}',
  distance_km numeric(10, 2) not null default 0,
  elevation_gain_m integer not null default 0,
  estimated_time_min integer not null default 0,
  geometry jsonb not null default '{"type":"LineString","coordinates":[]}',
  start_point jsonb not null default '{"lat":0,"lon":0}',
  end_point jsonb,
  elevation_data integer[] default '{}',
  gpx_data text,
  uploader_id uuid references public.users(id) on delete set null,
  uploader jsonb default '{"id":"","nickname":"骑士","avatarUrl":""}',
  photos text[] not null default '{}',
  download_count integer not null default 0,
  is_official boolean not null default false,
  status text not null default 'active' check (status in ('active', 'archived', 'pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for common queries
create index if not exists idx_routes_difficulty on public.routes(difficulty_level);
create index if not exists idx_routes_status on public.routes(status);
create index if not exists idx_routes_uploader on public.routes(uploader_id);
create index if not exists idx_routes_created_at on public.routes(created_at desc);

-- Row Level Security for routes
alter table public.routes enable row level security;

create policy "Anyone can read active routes"
  on public.routes for select using (status = 'active');

create policy "Authenticated users can create routes"
  on public.routes for insert with check (auth.uid() is not null);

create policy "Users can update own routes"
  on public.routes for update using (auth.uid() = uploader_id);

-- ============================================================
-- REVIEWS TABLE
-- ============================================================
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  route_id uuid not null references public.routes(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  user_name text not null default '骑士',
  user_avatar text not null default '',
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  photos text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_reviews_route on public.reviews(route_id);
create index if not exists idx_reviews_user on public.reviews(user_id);

-- Row Level Security for reviews
alter table public.reviews enable row level security;

create policy "Anyone can read reviews"
  on public.reviews for select using (true);

create policy "Authenticated users can create reviews"
  on public.reviews for insert with check (auth.uid() is not null);

create policy "Users can update own reviews"
  on public.reviews for update using (auth.uid() = user_id);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Increment download count (avoids race conditions)
create or replace function increment_download_count(route_id uuid)
returns void
language sql
security definer
as $$
  update public.routes
  set download_count = download_count + 1
  where id = route_id;
$$;

-- Auto-update updated_at timestamp
create or replace function handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_users_updated
  before update on public.users
  for each row execute procedure handle_updated_at();

create trigger on_routes_updated
  before update on public.routes
  for each row execute procedure handle_updated_at();

-- ============================================================
-- SEED DATA (Optional - 6 example routes for testing)
-- ============================================================
insert into public.routes (title, description, difficulty_level, terrain_tags, distance_km, elevation_gain_m, estimated_time_min, geometry, start_point, end_point, elevation_data, download_count, is_official)
values
  (
    '北京延庆穿越线',
    '经典ADV穿越路线，途经多个风景优美的山谷和河流。沿途有碎石路、涉水路段和少量泥泞路面，适合有一定越野经验的骑士。',
    3, ARRAY['碎石','涉水','泥泞'], 120, 800, 180,
    '{"type":"LineString","coordinates":[[116.2,40.5],[116.22,40.52],[116.25,40.55],[116.28,40.58],[116.3,40.6],[116.32,40.58],[116.35,40.56],[116.38,40.54],[116.4,40.52]]}',
    '{"lat":40.5,"lon":116.2}', '{"lat":40.52,"lon":116.4}',
    ARRAY[500,550,600,680,720,650,580,520,500], 256, true
  ),
  (
    '川藏南线精华段',
    '最美景观大道，高原骑行终极体验。沿途经过雪山、草原、湖泊，海拔变化大，需要适应高海拔环境。',
    4, ARRAY['高海拔','碎石','泥泞'], 380, 2500, 480,
    '{"type":"LineString","coordinates":[[102.5,30.5],[102.8,30.6],[103.2,30.8],[103.5,31.0],[103.8,31.2],[104.0,31.4]]}',
    '{"lat":30.5,"lon":102.5}', '{"lat":31.4,"lon":104.0}',
    ARRAY[3000,3200,3500,3800,4200,4500,4300,4000,3800], 1024, true
  ),
  (
    '乌兰布统草原线',
    '草原与沙漠的完美结合，轻度越野首选。夏季绿草如茵，秋季金黄一片，是摄影爱好者的天堂。',
    2, ARRAY['沙地'], 85, 200, 120,
    '{"type":"LineString","coordinates":[[117.0,42.5],[117.1,42.52],[117.15,42.55],[117.2,42.58],[117.25,42.6]]}',
    '{"lat":42.5,"lon":117.0}', '{"lat":42.6,"lon":117.25}',
    ARRAY[1200,1220,1250,1280,1300,1280,1260,1240,1220], 512, true
  ),
  (
    '门头沟山路',
    '蜿蜒山路体验，适合周末骑行。沿途风景优美，路况良好，是新手进阶的理想选择。',
    2, ARRAY['碎石'], 60, 400, 90,
    '{"type":"LineString","coordinates":[[115.9,39.9],[116.0,39.92],[116.05,39.95],[116.1,39.98],[116.12,40.0]]}',
    '{"lat":39.9,"lon":115.9}', '{"lat":40.0,"lon":116.12}',
    ARRAY[100,120,150,180,200,180,150,130,110], 384, false
  ),
  (
    '海南环岛东线',
    '热带海岛骑行体验，椰林树影、碧海蓝天。全程沿海公路，风景绝美，适合冬季骑行。',
    1, ARRAY['沙地'], 280, 300, 300,
    '{"type":"LineString","coordinates":[[110.2,20.0],[110.5,19.8],[110.8,19.6],[111.0,19.5],[111.2,19.4]]}',
    '{"lat":20.0,"lon":110.2}', '{"lat":19.4,"lon":111.2}',
    ARRAY[10,15,20,25,30,25,20,15,12], 768, true
  ),
  (
    '云南丙察察线',
    '极致越野体验，原始森林穿越。路线偏僻，需要携带足够补给，建议结伴同行。',
    5, ARRAY['碎石','泥泞','涉水'], 200, 1800, 360,
    '{"type":"LineString","coordinates":[[98.5,28.0],[98.6,28.1],[98.7,28.15],[98.8,28.2],[98.85,28.25]]}',
    '{"lat":28.0,"lon":98.5}', '{"lat":28.25,"lon":98.85}',
    ARRAY[1500,1800,2200,2600,3000,2800,2400,2000,1700], 128, true
  )
on conflict do nothing;
