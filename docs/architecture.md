# CivicPulse architecture

## Design principles

1. **Evidence, not assertions.** AI outputs are recommendations with confidence and a visible explanation; the platform does not declare reports true.
2. **Consent first.** Location and media are captured only after explicit citizen consent in Module 2.
3. **Live by default.** The application begins with an empty database. Maps, context sources, and dashboard aggregates are fetched live.
4. **Privacy minimisation.** Exact reporter coordinates are not exposed publicly; public map positions will be deliberately coarsened in Module 5.

## Planned evidence pipeline

```text
Consent + report media + browser GPS
  -> FastAPI validation
  -> Supabase Storage and Postgres
  -> multimodal extraction and transcription
  -> live location / weather enrichment
  -> typed routing recommendation + explanation
  -> reporter view and privacy-safe public dashboard
```

## Module boundaries

| Module | Responsibility | Status |
| --- | --- | --- |
| 1 | Foundation, health checks, schema, deployment configuration | In progress |
| 2 | Report capture, consent, upload, persistence | Planned |
| 3 | Multimodal Evidence Chain analysis | Planned |
| 4 | Live context and explainable routing | Planned |
| 5 | Public accountability map and duplicate signals | Planned |
| 6 | Guardrails, deployment and demo rehearsal | Planned |
