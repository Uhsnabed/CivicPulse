# Starts the backend port used by the Next.js development proxy.
Set-Location (Join-Path $PSScriptRoot "..\backend")
& .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8010
