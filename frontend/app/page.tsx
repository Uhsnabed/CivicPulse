"use client";

import { useEffect, useState } from "react";
import { ReportComposer } from "../components/ReportComposer";
import { PublicSignalBoard } from "../components/PublicSignalBoard";

type HealthState = "checking" | "connected" | "unavailable";

const evidenceSteps = [
  ["01", "Capture", "Photo, voice, text and consented location."],
  ["02", "Understand", "AI extracts the civic issue and flags missing context."],
  ["03", "Explain", "A transparent packet shows confidence, context and routing logic."],
];

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

export default function HomePage() {
  const [health, setHealth] = useState<HealthState>("checking");
  const [showPrinciples, setShowPrinciples] = useState(false);
  useEffect(() => {
    const endpoint = "/api/v1/health";
    fetch(endpoint).then((response) => { if (!response.ok) throw new Error(); setHealth("connected"); }).catch(() => setHealth("unavailable"));
  }, []);

  const isLive = health === "connected";
  const statusCopy = health === "checking" ? "Connecting to CivicPulse API" : isLive ? "CivicPulse API is live" : "API is temporarily unavailable";

  return <main className="min-h-screen overflow-hidden bg-[#f7f6f0] text-[#071d22]">
    <section className="grid-field relative border-b border-black/10">
      <div className="orb absolute -right-20 top-28 h-80 w-80 rounded-full bg-[#b8f3d0]/50" />
      <div className="orb orb-delayed absolute -left-28 bottom-4 h-56 w-56 rounded-full bg-[#ffcf66]/35" />
      <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-7 md:px-10 md:pb-28">
        <nav className="flex items-center justify-between" aria-label="Primary navigation">
          <a href="#top" className="flex items-center gap-2 text-sm font-black tracking-[0.16em]"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#071d22] text-[#b8f3d0]">C</span>CIVICPULSE</a>
          <div className="flex gap-2"><a href="#public-signals" className="rounded-full border border-black/15 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-widest transition hover:border-[#0b7665] hover:text-[#0b7665]">Public board</a><a href="#how-it-works" className="rounded-full border border-black/15 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-widest transition hover:border-[#0b7665] hover:text-[#0b7665]">How it works</a></div>
        </nav>
        <div id="top" className="mt-16 grid items-end gap-12 lg:grid-cols-[1.28fr_.72fr] lg:gap-20">
          <div>
            <div className="rise flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#0b7665]"><span className="h-2 w-2 rounded-full bg-[#0b7665]" />Proof of Place</div>
            <h1 className="rise rise-delay mt-5 max-w-4xl text-5xl font-black leading-[.94] tracking-[-0.055em] sm:text-6xl md:text-8xl">Public problems deserve <span className="text-[#0b7665]">public proof.</span></h1>
            <p className="rise rise-delay-2 mt-7 max-w-xl text-lg leading-8 text-[#46585d] md:text-xl">CivicPulse turns a citizen report into an evidence-backed case packet—with consent, context, confidence and a clear explanation of what the system knows.</p>
            <div className="rise rise-delay-2 mt-9 flex flex-wrap gap-3">
              <a href="#report" className="inline-flex items-center gap-2 rounded-full bg-[#071d22] px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#0b7665]">Report a local issue <ArrowIcon /></a>
              <button onClick={() => setShowPrinciples((value) => !value)} className="rounded-full border border-black/15 bg-white/70 px-6 py-3.5 text-sm font-bold transition hover:border-[#0b7665]" aria-expanded={showPrinciples}>Why it is trustworthy</button>
            </div>
          </div>
          <aside className="rise rise-delay-2 rounded-[2rem] border border-white/80 bg-[#071d22] p-6 text-white shadow-2xl shadow-[#071d22]/15 md:p-8">
            <div className="flex items-center justify-between border-b border-white/15 pb-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">System signal</p><span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold">MODULE 01</span></div>
            <div className="mt-7 flex items-start gap-3"><span className={`pulse-dot mt-1.5 h-3 w-3 rounded-full ${isLive ? "bg-[#b8f3d0]" : "bg-[#ffcf66]"}`} /><div><p className="text-xl font-bold">{statusCopy}</p><p className="mt-2 text-sm leading-6 text-white/60">{isLive ? "The client and API are communicating locally." : "Start the FastAPI service to enable live checks."}</p></div></div>
            <div className="mt-8 grid grid-cols-2 gap-3 text-sm"><div className="rounded-2xl bg-white/8 p-4"><p className="text-white/50">Reports</p><p className="mt-1 font-semibold">Live only</p></div><div className="rounded-2xl bg-white/8 p-4"><p className="text-white/50">AI role</p><p className="mt-1 font-semibold">Explain, not assert</p></div></div>
          </aside>
        </div>
        {showPrinciples && <div className="mt-10 max-w-3xl rounded-2xl border border-[#0b7665]/20 bg-[#e9fbef] p-6 text-sm leading-7 text-[#23443d]"><strong>Our trust rule:</strong> CivicPulse never calls a claim “verified” merely because an AI model processed it. It preserves submitted evidence, reports confidence, and makes routing reasoning inspectable.</div>}
      </div>
    </section>
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
      <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0b7665]">The evidence chain</p><h2 className="mt-4 text-4xl font-black tracking-[-0.04em] md:text-5xl">Built to show its work.</h2><p className="mt-5 text-lg leading-8 text-[#627278]">Every step adds useful context without replacing a citizen’s account with an opaque AI decision.</p></div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">{evidenceSteps.map(([number, title, description]) => <article key={number} className="group rounded-3xl border border-black/10 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-[#0b7665] hover:shadow-xl hover:shadow-[#0b7665]/10"><p className="text-sm font-black text-[#0b7665]">{number}</p><h3 className="mt-12 text-2xl font-black">{title}</h3><p className="mt-3 leading-7 text-[#627278]">{description}</p><div className="mt-8 text-[#0b7665] transition group-hover:translate-x-1"><ArrowIcon /></div></article>)}</div>
    </section>
    <ReportComposer />
    <PublicSignalBoard />
    <footer className="border-t border-black/10 bg-[#071d22] px-6 py-8 text-sm text-white/60"><div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 md:px-4"><span className="font-bold tracking-wide text-white">CIVICPULSE</span><span>Evidence first. Privacy aware. No fabricated data.</span></div></footer>
  </main>;
}
