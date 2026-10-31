"use client";

import { useEffect, useState } from "react";

type Signal = { reference: string; submitted_at: string; status: string; issue_category: string; severity: string; summary: string; routing_category: string; area_hint: string };

export function PublicSignalBoard() {
  const [signals, setSignals] = useState<Signal[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadSignals() {
    setError(null);
    try {
      const response = await fetch("/api/v1/reports/public-signals", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail ?? "Could not load public signals.");
      setSignals(body);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load public signals."); }
  }

  useEffect(() => { loadSignals(); }, []);

  return <section id="public-signals" className="border-t border-black/10 bg-[#f7f6f0] px-6 py-20 md:px-10">
    <div className="mx-auto max-w-6xl"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#0b7665]">Live public signal board</p><h2 className="mt-4 text-4xl font-black tracking-[-.04em] md:text-5xl">What citizens chose to make visible.</h2><p className="mt-4 max-w-2xl leading-7 text-[#627278]">Only citizen-approved, AI-analyzed signals appear here. Evidence files, names, original report text, and exact location never appear publicly.</p></div><button onClick={loadSignals} className="rounded-full border border-black/15 bg-white px-5 py-3 text-sm font-bold hover:border-[#0b7665]">Refresh live board</button></div>
    {error && <p className="mt-8 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {signals === null && <p className="mt-8 text-sm text-[#627278]">Loading live signals…</p>}
    {signals?.length === 0 && <div className="mt-8 rounded-3xl border border-dashed border-black/20 bg-white p-8 text-[#627278]">No public signals yet. A citizen must explicitly opt in before their anonymized report can appear here.</div>}
    <div className="mt-8 grid gap-4 md:grid-cols-2">{signals?.map((signal) => <article key={signal.reference} className="rounded-3xl border border-black/10 bg-white p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#0b7665]">{signal.reference}</p><h3 className="mt-2 text-xl font-black capitalize">{signal.issue_category.replace("_", " ")}</h3></div><span className="rounded-full bg-[#e9fbef] px-3 py-1 text-xs font-bold capitalize text-[#0b7665]">{signal.severity}</span></div><p className="mt-4 leading-7 text-[#34534b]">{signal.summary}</p><div className="mt-5 border-t border-black/10 pt-4 text-xs leading-5 text-[#627278]"><p><strong>Area:</strong> {signal.area_hint}</p><p><strong>Suggested routing:</strong> {signal.routing_category}</p><p><strong>Status:</strong> {signal.status.replace("_", " ")} · {new Date(signal.submitted_at).toLocaleDateString()}</p></div></article>)}</div></div>
  </section>;
}
