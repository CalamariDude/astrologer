-- Add theme preference to astrologer_profiles
alter table public.astrologer_profiles
  add column if not exists theme text not null default 'classic';
