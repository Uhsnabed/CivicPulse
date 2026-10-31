"use client";

import { useEffect, useState } from "react";

type HealthState = "checking" | "connected" | "unavailable";

export default function HomePage() {
  const [health, setHealth] = useState<HealthState>("checking");

  useEffect(() => {
    const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"}/health`;
    fetch(endpoint)
      .then((response) => {
        if (!response.ok) throw new Error("API health check failed");
        setHealth("connected");
      })
      .catch(() => setHealth("unavailable"));
  }, []);

  const statusLabel = {
    checking: "Checking live API…",
    connected: "Live API connected",
    unavailable: "API unavailable — start the FastAPI service",
  }[health];

  return (
    <main className="min-h-screen px-6 py-10 md:px-16">
      <section className="mx-auto max-w-4xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-800">CivicPulse / Proof of Place</p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">Evidence-first civic reporting, built for public trust.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
          A citizen report becomes a transparent evidence packet: submitted media, consented location, AI confidence, live context, and an explainable routing recommendation.
        </p>
        <div className="mt-10 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Module 1 service status</p>
          <p className={`mt-2 text-xl font-semibold ${health === "connected" ? "text-emerald-700" : "text-slate-700"}`}>{statusLabel}</p>
          <p className="mt-4 text-sm text-slate-600">No sample reports are displayed. Module 2 will show only genuine reports persisted to the live database.</p>
        </div>
      </section>
    </main>
  );
}
