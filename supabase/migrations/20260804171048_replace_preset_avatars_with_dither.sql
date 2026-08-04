-- Clear only Kocteau's generated disc URLs. Uploaded photos remain untouched.
update public.profiles
set avatar_url = null
where avatar_url like '%/preset-%.svg%';
