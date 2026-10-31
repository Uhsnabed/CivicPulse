"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";

type Position = { latitude: number; longitude: number; accuracy: number };
type Submission = { reference: string; evidence_count: number };
type Analysis = { issue_category: string; severity: string; summary: string; visible_evidence: string[]; missing_evidence: string[]; confidence: number; routing_category: string; safety_note: string };

export function ReportComposer() {
  const [position, setPosition] = useState<Position | null>(null);
  const [locationMessage, setLocationMessage] = useState("Location is optional, and used only with your consent.");
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analysisCached, setAnalysisCached] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function captureLocation() {
    if (!navigator.geolocation) { setLocationMessage("This browser does not support location capture."); return; }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (value) => { setPosition({ latitude: value.coords.latitude, longitude: value.coords.longitude, accuracy: value.coords.accuracy }); setLocationMessage(`Location captured (accurate to about ${Math.round(value.coords.accuracy)} m).`); setIsLocating(false); },
      () => { setLocationMessage("Location was not shared. You can still submit without it."); setIsLocating(false); },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setSubmission(null); setAnalysis(null); setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    if (position) { formData.set("latitude", String(position.latitude)); formData.set("longitude", String(position.longitude)); formData.set("location_accuracy_meters", String(position.accuracy)); }
    try {
      const response = await fetch("/api/v1/reports", { method: "POST", body: formData });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail ?? "Your report could not be submitted.");
      setSubmission(body); formRef.current?.reset(); setPosition(null); setLocationMessage("Location is optional, and used only with your consent.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Your report could not be submitted."); }
    finally { setIsSubmitting(false); }
  }

  async function analyzeSavedEvidence() {
    if (!submission) return;
    setError(null); setIsAnalyzing(true);
    try {
      const response = await fetch(`/api/v1/reports/${submission.reference}/analyze`, { method: "POST" });
      const responseText = await response.text();
      let body: { detail?: string; analysis?: Analysis; cached?: boolean } = {};
      try { body = JSON.parse(responseText); } catch { /* A proxy/server failure may be plain text. */ }
      if (!response.ok) throw new Error(body.detail ?? `Evidence analysis failed (HTTP ${response.status}).`);
      if (!body.analysis) throw new Error("Analysis completed without a usable result.");
      setAnalysis(body.analysis); setAnalysisCached(Boolean(body.cached));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Evidence analysis could not be completed."); }
    finally { setIsAnalyzing(false); }
  }

  return <section id="report" className="border-t border-black/10 bg-[#e9fbef] px-6 py-20 md:px-10">
    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[.78fr_1.22fr]">
      <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#0b7665]">Live citizen report</p><h2 className="mt-4 text-4xl font-black tracking-[-.04em] md:text-5xl">Make a report that can show its work.</h2><p className="mt-5 max-w-md text-lg leading-8 text-[#46605a]">This creates a real private record in CivicPulse. AI analysis comes later, after you review and submit your evidence.</p><div className="mt-8 rounded-2xl border border-[#0b7665]/20 bg-white/70 p-5 text-sm leading-6 text-[#34534b]"><strong>Privacy promise:</strong> media remains private; a future public map will deliberately coarsen location. Never upload IDs, faces, or emergency situations.</div></div>
      <form ref={formRef} onSubmit={submitReport} className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-xl shadow-[#0b7665]/10 md:p-8">
        <div className="grid gap-5">
          <label className="grid gap-2 text-sm font-bold">What did you notice?<textarea name="description" maxLength={2000} rows={4} className="resize-none rounded-xl border border-black/15 p-3 font-normal outline-none transition focus:border-[#0b7665] focus:ring-2 focus:ring-[#b8f3d0]" placeholder="Describe the issue and nearest landmark…" /></label>
          <div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Report language<select name="language_code" defaultValue="en" className="rounded-xl border border-black/15 bg-white p-3 font-normal outline-none focus:border-[#0b7665]"><option value="en">English</option><option value="hi">Hindi</option><option value="bn">Bengali</option><option value="te">Telugu</option><option value="ta">Tamil</option></select></label><label className="grid gap-2 text-sm font-bold">Photo or audio <input name="evidence" type="file" multiple accept="image/jpeg,image/png,image/webp,audio/mpeg,audio/wav,audio/mp4,audio/m4a,audio/webm" className="rounded-xl border border-dashed border-black/25 p-2 text-xs font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-[#071d22] file:px-3 file:py-2 file:text-white" /></label></div>
          <div className="rounded-xl bg-[#f7f6f0] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold">Optional exact location</p><p className="mt-1 text-xs text-[#627278]">{locationMessage}</p></div><button type="button" onClick={captureLocation} disabled={isLocating} className="rounded-full border border-black/15 px-4 py-2 text-xs font-bold transition hover:border-[#0b7665] disabled:opacity-50">{isLocating ? "Capturing…" : position ? "Update location" : "Use my location"}</button></div></div>
          <label className="flex gap-3 rounded-xl border border-black/10 p-4 text-sm leading-6"><input name="consent_to_process" type="checkbox" required className="mt-1 h-4 w-4 accent-[#0b7665]" /><span>I consent to CivicPulse storing and processing this report and its attached evidence. I understand this is not an emergency service.</span></label>
          <label className="flex gap-3 rounded-xl border border-[#0b7665]/20 bg-[#f4fffa] p-4 text-sm leading-6"><input name="public_display_consent" type="checkbox" className="mt-1 h-4 w-4 accent-[#0b7665]" /><span><strong>Optional public signal:</strong> I allow an anonymous AI summary, status, and approximate area to appear on the public board. My photo, audio, description, and exact location stay private.</span></label>
          <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center rounded-full bg-[#071d22] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#0b7665] disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Saving your evidence…" : "Submit private report"}</button>
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          {submission && <div role="status" className="rounded-xl bg-[#dff7eb] p-4 text-sm text-[#16483b]"><p>Report saved. Your live case reference is <strong>{submission.reference}</strong>. {submission.evidence_count} evidence file(s) attached.</p><button type="button" onClick={analyzeSavedEvidence} disabled={isAnalyzing || Boolean(analysis)} className="mt-3 rounded-full bg-[#0b7665] px-4 py-2 text-xs font-bold text-white disabled:opacity-60">{isAnalyzing ? "Analyzing once…" : analysis ? "Analysis saved" : "Analyze evidence with Gemini (one call)"}</button></div>}
          {analysis && <div className="rounded-xl border border-[#0b7665]/25 bg-[#f4fffa] p-4 text-sm text-[#16483b]"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold capitalize">{analysis.issue_category.replace("_", " ")} · {analysis.severity} priority</p><span className="text-xs">Evidence support: {Math.round(analysis.confidence * 100)}%</span></div><p className="mt-2 leading-6">{analysis.summary}</p><p className="mt-2 text-xs"><strong>Routing category:</strong> {analysis.routing_category}</p>{analysis.visible_evidence.length > 0 && <p className="mt-2 text-xs"><strong>Observed:</strong> {analysis.visible_evidence.join(" · ")}</p>}{analysis.missing_evidence.length > 0 && <p className="mt-2 text-xs"><strong>Still needed:</strong> {analysis.missing_evidence.join(" · ")}</p>}<p className="mt-3 text-xs text-[#46605a]">{analysis.safety_note} {analysisCached ? "Saved result shown; Gemini was not called again." : "This result is now cached for this case."}</p></div>}
        </div>
      </form>
    </div>
  </section>;
}
