-- Add tags column to saved_charts (text array for user-defined labels)
alter table public.saved_charts add column if not exists tags text[] not null default '{}';

-- GIN index for fast array-contains queries
create index if not exists idx_saved_charts_tags on public.saved_charts using gin (tags);
