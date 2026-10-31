# CivicPulse — Proof of Place

CivicPulse converts a consented citizen report (photo, audio, text, and browser location) into an explainable civic evidence packet. It makes no claim that AI has verified an incident: it surfaces the submitted evidence, AI confidence, live contextual signals, and a transparent routing recommendation.

## Module 1 status

This repository contains the deployable foundation only:

- `frontend/`: Next.js citizen-facing application
- `backend/`: FastAPI API service
- `supabase/migrations/`: live Postgres schema and row-level security policies
- `docs/`: architecture and operating notes

No civic reports, dashboard counts, or sample data are seeded. Data shown by future modules will be created by genuine user submissions and live integrations.

## Architecture

```text
Next.js web client
       |
       v
FastAPI API  -----> OpenAI (Module 3)
       |
       +---------> live geospatial / weather services (Module 4)
       |
       v
Supabase Postgres + Storage
```

## Local setup

### Prerequisites

- Node.js 18.17+ (Node 20 LTS recommended for deployment)
- Python 3.11+
- A Supabase project (Module 2 requires its URL and keys)

The browser does not need the Supabase JavaScript SDK in Module 1; all sensitive database access remains server-side. We will add a pinned SDK version only if a later client-side feature requires it.

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` for the generated API documentation.

### Frontend

```powershell
cd frontend
npm install
Copy-Item .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Supabase setup

In the Supabase SQL editor, run `supabase/migrations/001_initial_schema.sql`. Then set the backend and frontend environment variables from their respective example files. Do not expose `SUPABASE_SERVICE_ROLE_KEY` or `OPENAI_API_KEY` to the browser.

## Git routine

Commit after every completed module or independently testable feature. Before pushing, inspect `git status` to ensure that no `.env` file or key is staged.

## License

To be selected by the team before public release.
