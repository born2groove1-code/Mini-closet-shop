-- Adds a second owner to the admin allowlist. Safe to re-run.
insert into public.admin_emails (email) values ('arti871985@gmail.com')
on conflict (email) do nothing;
