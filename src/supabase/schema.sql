-- ============================================================
-- SCHOLR — Supabase Schema
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- ──────────────────────────────────────────────
-- EXTENSIONS
-- ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- enables fast text search

-- ──────────────────────────────────────────────
-- PROFILES
-- Extends Supabase auth.users 1-to-1
-- ──────────────────────────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  full_name    text,
  bio          text,
  avatar_url   text,           -- storage URL or preset key
  reputation   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Auto-create profile on new user sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    ),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', null)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ──────────────────────────────────────────────
-- COMMUNITIES
-- ──────────────────────────────────────────────
create table public.communities (
  id           uuid primary key default uuid_generate_v4(),
  name         text unique not null,
  slug         text unique not null,
  description  text,
  icon_url     text,
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  is_private   boolean not null default false,
  member_count integer not null default 0,
  created_at   timestamptz not null default now()
);

-- index for slug lookups (route /c/:slug)
create index idx_communities_slug on public.communities(slug);

-- ──────────────────────────────────────────────
-- COMMUNITY MEMBERS
-- ──────────────────────────────────────────────
create table public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  role         text not null default 'member', -- 'owner' | 'moderator' | 'member'
  joined_at    timestamptz not null default now(),
  primary key (community_id, user_id)
);

-- Keep member_count in sync
create or replace function public.update_member_count()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    update public.communities
    set member_count = member_count + 1
    where id = NEW.community_id;
  elsif TG_OP = 'DELETE' then
    update public.communities
    set member_count = greatest(member_count - 1, 0)
    where id = OLD.community_id;
  end if;
  return null;
end;
$$;

create trigger trg_member_count
  after insert or delete on public.community_members
  for each row execute function public.update_member_count();

-- ──────────────────────────────────────────────
-- POSTS
-- ──────────────────────────────────────────────
create table public.posts (
  id           uuid primary key default uuid_generate_v4(),
  community_id uuid not null references public.communities(id) on delete cascade,
  author_id    uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  body         text,
  upvotes      integer not null default 0,
  reply_count  integer not null default 0,
  is_deleted   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Full-text search index on title + body
create index idx_posts_fts on public.posts
  using gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, '')));

create index idx_posts_community on public.posts(community_id, created_at desc);

-- ──────────────────────────────────────────────
-- REPLIES (comments)
-- ──────────────────────────────────────────────
create table public.replies (
  id         uuid primary key default uuid_generate_v4(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  parent_id  uuid references public.replies(id) on delete cascade, -- nested replies
  body       text not null,
  upvotes    integer not null default 0,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_replies_post on public.replies(post_id, created_at asc);

-- Keep post reply_count in sync
create or replace function public.update_reply_count()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts
    set reply_count = reply_count + 1
    where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update public.posts
    set reply_count = greatest(reply_count - 1, 0)
    where id = OLD.post_id;
  end if;
  return null;
end;
$$;

create trigger trg_reply_count
  after insert or delete on public.replies
  for each row execute function public.update_reply_count();

-- ──────────────────────────────────────────────
-- VOTES
-- One vote per user per reply
-- ──────────────────────────────────────────────
create table public.votes (
  reply_id   uuid not null references public.replies(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  value      smallint not null default 1, -- 1 = upvote (extend to -1 for downvote later)
  created_at timestamptz not null default now(),
  primary key (reply_id, user_id)
);

-- Update reply upvotes + author reputation on vote
create or replace function public.handle_vote_change()
returns trigger language plpgsql security definer as $$
declare
  v_author uuid;
begin
  if TG_OP = 'INSERT' then
    update public.replies set upvotes = upvotes + NEW.value where id = NEW.reply_id;
    select author_id into v_author from public.replies where id = NEW.reply_id;
    update public.profiles set reputation = reputation + NEW.value where id = v_author;
  elsif TG_OP = 'DELETE' then
    update public.replies set upvotes = upvotes - OLD.value where id = OLD.reply_id;
    select author_id into v_author from public.replies where id = OLD.reply_id;
    update public.profiles set reputation = greatest(reputation - OLD.value, 0) where id = v_author;
  end if;
  return null;
end;
$$;

create trigger trg_vote_change
  after insert or delete on public.votes
  for each row execute function public.handle_vote_change();

-- ──────────────────────────────────────────────
-- REPORTS (moderation lite)
-- ──────────────────────────────────────────────
create table public.reports (
  id          uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null, -- 'post' | 'reply'
  target_id   uuid not null,
  reason      text not null,
  resolved    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- STORAGE BUCKET
-- Run in Supabase dashboard → Storage → New Bucket
-- Name: avatars, public: true
-- ──────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- ──────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ──────────────────────────────────────────────

-- PROFILES
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- COMMUNITIES
alter table public.communities enable row level security;

create policy "Communities are viewable by everyone"
  on public.communities for select using (true);

create policy "Authenticated users can create communities"
  on public.communities for insert with check (auth.uid() = owner_id);

create policy "Owner can update community"
  on public.communities for update using (auth.uid() = owner_id);

create policy "Owner can delete community"
  on public.communities for delete using (auth.uid() = owner_id);

-- COMMUNITY MEMBERS
alter table public.community_members enable row level security;

create policy "Members are viewable by everyone"
  on public.community_members for select using (true);

create policy "Users can join communities"
  on public.community_members for insert with check (auth.uid() = user_id);

create policy "Users can leave communities"
  on public.community_members for delete using (auth.uid() = user_id);

-- POSTS
alter table public.posts enable row level security;

create policy "Posts are viewable by everyone"
  on public.posts for select using (true);

create policy "Members can create posts"
  on public.posts for insert with check (
    auth.uid() = author_id and
    exists (
      select 1 from public.community_members
      where community_id = posts.community_id and user_id = auth.uid()
    )
  );

create policy "Author or community owner can update post"
  on public.posts for update using (
    auth.uid() = author_id or
    exists (
      select 1 from public.communities
      where id = posts.community_id and owner_id = auth.uid()
    )
  );

create policy "Author or community owner can delete post"
  on public.posts for delete using (
    auth.uid() = author_id or
    exists (
      select 1 from public.communities
      where id = posts.community_id and owner_id = auth.uid()
    )
  );

-- REPLIES
alter table public.replies enable row level security;

create policy "Replies are viewable by everyone"
  on public.replies for select using (true);

create policy "Members can create replies"
  on public.replies for insert with check (
    auth.uid() = author_id and
    exists (
      select 1 from public.posts p
      join public.community_members cm on cm.community_id = p.community_id
      where p.id = replies.post_id and cm.user_id = auth.uid()
    )
  );

create policy "Author or community owner can delete reply"
  on public.replies for delete using (
    auth.uid() = author_id or
    exists (
      select 1 from public.posts p
      join public.communities c on c.id = p.community_id
      where p.id = replies.post_id and c.owner_id = auth.uid()
    )
  );

-- VOTES
alter table public.votes enable row level security;

create policy "Votes are viewable by everyone"
  on public.votes for select using (true);

create policy "Authenticated users can vote"
  on public.votes for insert with check (auth.uid() = user_id);

create policy "Users can remove own vote"
  on public.votes for delete using (auth.uid() = user_id);

-- REPORTS
alter table public.reports enable row level security;

create policy "Users can create reports"
  on public.reports for insert with check (auth.uid() = reporter_id);

create policy "Users can view own reports"
  on public.reports for select using (auth.uid() = reporter_id);

-- STORAGE POLICIES — avatars bucket
create policy "Avatar images are publicly accessible"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert with check (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own avatar"
  on storage.objects for update using (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete using (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ──────────────────────────────────────────────
-- HELPER VIEW: posts with author info
-- ──────────────────────────────────────────────
create or replace view public.posts_with_authors as
select
  p.*,
  pr.username   as author_username,
  pr.avatar_url as author_avatar,
  pr.reputation as author_reputation
from public.posts p
join public.profiles pr on pr.id = p.author_id
where p.is_deleted = false;

-- ──────────────────────────────────────────────
-- HELPER VIEW: replies with author info
-- ──────────────────────────────────────────────
create or replace view public.replies_with_authors as
select
  r.*,
  pr.username   as author_username,
  pr.avatar_url as author_avatar,
  pr.reputation as author_reputation
from public.replies r
join public.profiles pr on pr.id = r.author_id
where r.is_deleted = false;
