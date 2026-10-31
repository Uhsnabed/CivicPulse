-- Public display is opt-in and deliberately excludes original media and exact addresses.
alter table public.civic_reports
  add column if not exists public_display_consent boolean not null default false;

create index if not exists civic_reports_public_signal_idx
  on public.civic_reports (public_display_consent, created_at desc)
  where public_display_consent = true;
