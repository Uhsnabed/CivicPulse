# CivicPulse — Proof of Place

<p align="center">
  <strong>Turning citizen-submitted evidence into structured, reviewable civic signals.</strong>
</p>

<p align="center">
  <a href="https://civic-pulse-sooty-six.vercel.app/">Live Application</a> •
  <a href="https://youtu.be/X9Z2K5p64zU">Demo Video</a> •
  <a href="https://github.com/Uhsnabed/CivicPulse">GitHub Repository</a>
</p>

---

## Overview

**CivicPulse — Proof of Place** is an AI-powered, evidence-first civic reporting platform designed to make public infrastructure reporting more structured, transparent and accountable.

Citizens can report civic issues by submitting descriptions, photographs, audio evidence and optional location information. The platform securely stores submitted reports and uses Google Gemini to generate structured, AI-assisted evidence analysis.

Authorized reviewers can inspect reports, examine AI-generated insights, update report statuses and track changes through an audit timeline. Citizens can also opt in to sharing anonymous signals on a public board.

CivicPulse combines citizen participation, AI-assisted analysis, privacy protection and human oversight to support more effective civic issue management.

## Problem Statement

Civic issues such as damaged infrastructure, faulty electrical installations, non-functional public facilities and waste accumulation are frequently reported without sufficient structured evidence.

This creates challenges for authorities and maintenance teams when assessing issues, identifying priorities and determining appropriate actions.

CivicPulse addresses this gap through an evidence-based reporting workflow that connects citizen submissions with AI-assisted interpretation and transparent human review.

## Key Features

### 1. Evidence-Based Civic Reporting
- Submit civic complaints with descriptions.
- Attach supporting photographs and audio evidence.
- Provide optional GPS and location information.
- Record citizen consent before processing.
- Securely store submitted reports and evidence.

### 2. Gemini-Powered AI Analysis
- Analyze submitted descriptions and supporting image evidence.
- Generate structured evidence summaries.
- Identify observable issues and suggested categories.
- Assess potential risk and suggest priority.
- Highlight missing information that may be required for further assessment.
- Recommend appropriate maintenance categories.

AI-generated results are decision-support recommendations, not independently verified facts.

### 3. Public Signals Board
- Display citizen-approved anonymous civic signals.
- Improve community awareness of reported issues.
- Keep private evidence and sensitive report information protected.
- Use actual database records rather than mock or hardcoded reports.

### 4. Reviewer Dashboard
- Dedicated authentication for authorized reviewers.
- View and inspect submitted civic reports.
- Examine supporting evidence and AI analysis.
- Update report statuses.
- Maintain a traceable audit timeline of report updates.

### 5. Privacy and Accountability
- Private storage for supporting evidence.
- Consent-based public sharing.
- Restricted reviewer access.
- Human oversight over report review and status changes.
- Audit records for traceability.

## Application Workflow

```text
        CITIZEN
           |
           v
    Submit Civic Report
   (Description + Evidence)
           |
           v
     Secure Backend
           |
           v
    Supabase Database
           |
           v
     Gemini AI Analysis
           |
           v
   Structured AI Insights
           |
           v
    Authorized Reviewer
           |
           v
     Status Management
           |
           v
      Audit Timeline

           |
           v
   Public Signals Board
 (Citizen-approved anonymous
          signals)
```

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript |
| Styling | Tailwind CSS |
| Backend | FastAPI, Python |
| Database | Supabase PostgreSQL |
| Evidence Storage | Supabase Storage |
| AI Integration | Google Gemini API |
| Deployment – Frontend | Vercel |
| Deployment – Backend | Render |

## System Architecture

CivicPulse follows a frontend-backend architecture with centralized data storage and AI integration.

- **Frontend:** Provides citizen reporting, public signals and reviewer interfaces.
- **Backend:** Handles report submission, validation, authentication, AI analysis and reviewer operations.
- **Supabase:** Stores civic reports, supporting evidence references and audit events.
- **Google Gemini:** Generates structured analysis from submitted report information.
- **Reviewer workflow:** Enables authorized human inspection and status management.

All sensitive database operations are handled by the backend.

## AI Integration

CivicPulse integrates Google Gemini through the `google-genai` Python SDK.

The AI analysis workflow uses the submitted report description and supporting image evidence to generate structured insights.

The analysis can include:

- Issue category
- Suggested priority
- Evidence summary
- Observable findings
- Missing contextual information
- Potential risks
- Recommended maintenance category

**Human-in-the-loop approach:** Gemini does not independently verify incidents, dispatch authorities or resolve civic issues. Its output assists authorized reviewers, who retain control over review decisions and status updates.

## Database Design

The backend uses Supabase PostgreSQL to manage the reporting workflow.

Key database entities include:

- `civic_reports` — stores submitted civic reports and their metadata.
- `report_evidence` — maintains references to supporting evidence.
- `report_events` — records report-related events and status history.

Supporting evidence is stored in a private Supabase Storage bucket.

The platform is designed to begin without seeded civic reports. Public signals and dashboard records originate from genuine submissions.

## Local Setup

### Prerequisites

- Node.js 18.17 or later
- Python 3.11 or later
- npm
- A Supabase project
- A Google Gemini API key

### 1. Clone the Repository

```bash
git clone https://github.com/Uhsnabed/CivicPulse.git
cd CivicPulse
```

### 2. Backend Setup

```bash
cd backend

python -m venv .venv
```

Activate the environment:

**Windows PowerShell**
```powershell
.venv\Scripts\Activate.ps1
```

**Linux / macOS**
```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create the backend environment file using the provided example:

```bash
cp .env.example .env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Configure the required environment variables using the example file and your own service credentials.

Start the backend:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8010
```

Backend API documentation:

`http://127.0.0.1:8010/docs`

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Create the local environment file:

```powershell
Copy-Item .env.local.example .env.local
```

Configure the required frontend environment variables according to the example file.

Start the development server:

```bash
npm run dev
```

Open:

`http://localhost:3000`

### 4. Supabase Configuration

1. Create a Supabase project.
2. Open the SQL Editor.
3. Execute the SQL migration files in `supabase/migrations/` in their intended order.
4. Configure the required database and private storage settings.
5. Set the necessary backend environment variables.

### 5. Environment Variables and Security

Use the provided `.env.example` and `.env.local.example` files as configuration references.

Never commit actual credentials or secrets.

In particular:
- Keep the Supabase service-role key exclusively on the backend.
- Keep the Gemini API key on the backend.
- Never expose privileged credentials through frontend environment variables.
- Keep `.env` and `.env.local` files out of Git.

## Live Demo

**Application:**  
https://civic-pulse-sooty-six.vercel.app/

**Video Demonstration:**  
https://youtu.be/X9Z2K5p64zU

The demonstration covers:
1. Existing civic report inspection.
2. Live submission of a water purifier issue.
3. Gemini-powered report analysis.
4. Public Signals board.
5. Authorized reviewer login.
6. Report status update and audit timeline.

## Project Structure

```text
CivicPulse/
│
├── backend/
│   ├── app/
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   ├── components/
│   └── package.json
│
├── supabase/
│   └── migrations/
│
├── docs/
│
├── scripts/
│
├── .gitignore
└── README.md
```

## Future Scope

Potential future enhancements include:

- Integration with official municipal complaint systems.
- More advanced geographic analysis of civic issues.
- Improved multilingual reporting and accessibility.
- Enhanced analytics for identifying recurring infrastructure problems.
- Additional integrations with civic maintenance workflows.

These are future possibilities, not claims about currently implemented functionality.

## Impact

CivicPulse aims to improve civic reporting through:

- Better structured citizen submissions.
- AI-assisted evidence interpretation.
- Privacy-conscious public information sharing.
- Human-controlled report assessment.
- Transparent and traceable review workflows.

By connecting citizens, AI-assisted analysis and authorized reviewers, CivicPulse provides a foundation for more accountable civic issue management.

---

**CivicPulse — Proof of Place**  
*Every report begins with evidence. Every review deserves accountability.*
