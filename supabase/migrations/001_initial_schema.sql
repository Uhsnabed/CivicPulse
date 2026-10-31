-- CivicPulse begins empty by design. This migration creates structure only;
-- it inserts no mock reports, counts, or civic datasets.

create extension if not exists pgcrypto;

create type public.report_status as enum ('draft', 'submitted', 'under_review', 'routed', 'resolved', 'closed');
create type public.evidence_type as enum ('photo', 'audio', 'text');

create table public.civic_reports (
  id uuid primary key default gen_random_uuid(),
  public_reference text unique not null default ('CP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  status public.report_status not null default 'draft',
  category text,
  citizen_description text,
  language_code text,
  occurred_at timestamptz,
  latitude double precision,
  longitude double precision,
  location_accuracy_meters numeric,
  location_label text,
  consent_to_process boolean not null default false,
  consent_recorded_at timestamptz,
  ai_analysis jsonb,
  routing_recommendation jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint consent_before_submission check (status = 'draft' or consent_to_process = true),
  constraint valid_latitude check (latitude is null or latitude between -90 and 90),
  constraint valid_longitude check (longitude is null or longitude between -180 and 180),
  constraint valid_accuracy check (location_accuracy_meters is null or location_accuracy_meters >= 0)
);

create table public.report_evidence (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.civic_reports(id) on delete cascade,
  evidence_type public.evidence_type not null,
  storage_path text,
  original_filename text,
  media_sha256 text,
  extracted_text text,
  created_at timestamptz not null default now()
);

create table public.report_events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.civic_reports(id) on delete cascade,
  event_type text not null,
  actor_type text not null check (actor_type in ('citizen', 'system', 'reviewer')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index civic_reports_status_created_at_idx on public.civic_reports (status, created_at desc);
create index report_evidence_report_id_idx on public.report_evidence (report_id);
create index report_events_report_id_created_at_idx on public.report_events (report_id, created_at desc);

alter table public.civic_reports enable row level security;
alter table public.report_evidence enable row level security;
alter table public.report_events enable row level security;

-- Browser clients do not access civic data directly. FastAPI uses a server-side
-- service-role key in later modules, keeping exact locations and evidence private.
revoke all on public.civic_reports, public.report_evidence, public.report_events from anon, authenticated;
