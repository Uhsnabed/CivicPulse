
"use client";

import { useEffect, useState } from "react";

type Analysis = {
  issue_category?: string;
  severity?: string;
  summary?: string;
  visible_evidence?: string[];
  missing_evidence?: string[];
  confidence?: number;
  routing_category?: string;
  safety_note?: string;
};

type Recommendation = {
  service_queue?: string;
  reason?: string;
  status?: string;
};

type Report = {
  id: string;
  public_reference: string;
  status: string;
  citizen_description: string | null;
  language_code: string | null;
  ai_analysis: Analysis | null;
  routing_recommendation: Recommendation | null;
  created_at: string;
  updated_at: string;
};

type TimelineEvent = {
  event_type: string;
  created_at: string;
};

const statuses = [
  "submitted",
  "under_review",
  "routed",
  "resolved",
  "closed",
];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function pretty(value?: string | null) {
  return (value || "Not available").replaceAll("_", " ");
}

export function ReviewerDashboard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [reviewerId, setReviewerId] = useState<string | null>(null);

  const [reports, setReports] = useState<Report[]>([]);
  const [selected, setSelected] = useState<Report | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  const [note, setNote] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setError("Frontend Supabase environment variables are missing.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${SUPABASE_URL.replace(/\/$/, "")}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.msg || body.message || "Sign-in failed.");
      }

      if (!body.access_token || !body.user?.id) {
        throw new Error("Supabase did not return a valid session.");
      }

      setToken(body.access_token);
      setReviewerId(body.user.id);
      setPassword("");
      setMessage("Signed in. Loading reviewer reports...");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  async function loadReports(accessToken: string) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/v1/reviewer/reports", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });

      const body = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setToken(null);
          setReviewerId(null);
          throw new Error("Your reviewer session expired or is not authorized. Please sign in again.");
        }
        throw new Error(body.detail || "Could not load reports.");
      }

      const rows: Report[] = body.reports || [];
      setReports(rows);

      if (selected) {
        const refreshed = rows.find(
          (report) => report.public_reference === selected.public_reference
        );
        setSelected(refreshed || null);
      }

      setMessage(`${rows.length} real report(s) loaded.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load reports.");
    } finally {
      setLoading(false);
    }
  }

  async function loadTimeline(reference: string) {
    try {
      const response = await fetch(
        `/api/v1/reports/${encodeURIComponent(reference)}/timeline`,
        { cache: "no-store" }
      );
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.detail || "Could not load case timeline.");
      }

      setTimeline(body.events || []);
    } catch (reason) {
      setTimeline([]);
      setError(reason instanceof Error ? reason.message : "Could not load timeline.");
    }
  }

  useEffect(() => {
    if (token) void loadReports(token);
    // Load once when a new authenticated session is established.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (selected) {
      setNewStatus(selected.status);
      setNote("");
      void loadTimeline(selected.public_reference);
    } else {
      setTimeline([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.public_reference]);

  async function updateStatus(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selected) return;

    setUpdating(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/v1/reviewer/reports/${encodeURIComponent(selected.public_reference)}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            new_status: newStatus,
            note: note.trim() || null,
          }),
        }
      );

      const body = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setToken(null);
          setReviewerId(null);
        }
        throw new Error(body.detail || "Status update failed.");
      }

      setMessage(
        `Status updated: ${pretty(body.transition?.previous_status)} → ${pretty(body.transition?.new_status)}`
      );
      setNote("");
      await loadReports(token);
      await loadTimeline(selected.public_reference);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Status update failed.");
    } finally {
      setUpdating(false);
    }
  }

  function signOut() {
    setToken(null);
    setReviewerId(null);
    setReports([]);
    setSelected(null);
    setTimeline([]);
    setMessage("Signed out.");
    setError("");
  }

  return (
    <section id="reviewer" className="border-t border-black/10 bg-[#edf3ee] px-5 py-16 md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#0b7665]">
              Restricted workspace
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-[-.04em]">
              Civic reviewer desk
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-[#627278]">
              Review submitted citizen evidence, inspect AI assistance and record
              accountable status changes. AI analysis is not proof of truth.
            </p>
          </div>

          {token && (
            <button
              onClick={signOut}
              className="rounded-full border border-black/15 bg-white px-5 py-3 text-sm font-bold hover:border-[#0b7665]"
            >
              Sign out
            </button>
          )}
        </div>

        {(error || message) && (
          <div
            role={error ? "alert" : "status"}
            className={`mt-6 rounded-xl p-4 text-sm ${
              error ? "bg-red-50 text-red-800" : "bg-[#dff7eb] text-[#16483b]"
            }`}
          >
            {error || message}
          </div>
        )}

        {!token ? (
          <form
            onSubmit={signIn}
            className="mt-8 max-w-xl rounded-3xl border border-black/10 bg-white p-6 shadow-sm md:p-8"
          >
            <h3 className="text-xl font-black">Reviewer sign in</h3>
            <p className="mt-2 text-sm leading-6 text-[#627278]">
              Access is restricted to reviewer accounts authorized by the backend.
              Public registration is not available here.
            </p>

            <label className="mt-6 grid gap-2 text-sm font-bold">
              Email
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-xl border border-black/15 p-3 font-normal outline-none focus:border-[#0b7665]"
              />
            </label>

            <label className="mt-4 grid gap-2 text-sm font-bold">
              Password
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-xl border border-black/15 p-3 font-normal outline-none focus:border-[#0b7665]"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-full bg-[#071d22] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#0b7665] disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in to reviewer desk"}
            </button>
          </form>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
            <aside className="rounded-3xl border border-black/10 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black">Submitted reports</h3>
                  <p className="mt-1 text-xs text-[#627278]">
                    Authenticated reviewer · {reviewerId?.slice(0, 8)}…
                  </p>
                </div>
                <button
                  onClick={() => token && void loadReports(token)}
                  disabled={loading}
                  className="rounded-full border border-black/15 px-3 py-2 text-xs font-bold hover:border-[#0b7665] disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>

              {loading && <p className="mt-6 text-sm text-[#627278]">Loading live reports...</p>}

              {!loading && reports.length === 0 && (
                <p className="mt-6 rounded-xl bg-[#f7f6f0] p-4 text-sm leading-6 text-[#627278]">
                  No submitted reports are currently available.
                </p>
              )}

              <div className="mt-4 space-y-3">
                {reports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelected(report)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selected?.id === report.id
                        ? "border-[#0b7665] bg-[#f0fbf5]"
                        : "border-black/10 hover:border-[#0b7665]/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-black text-[#0b7665]">
                        {report.public_reference}
                      </span>
                      <span className="rounded-full bg-[#f1f2ed] px-2 py-1 text-[10px] font-bold capitalize">
                        {pretty(report.status)}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#34534b]">
                      {report.citizen_description || "No text description; inspect submitted evidence through the private evidence workflow."}
                    </p>
                    <p className="mt-3 text-[11px] text-[#7b8985]">
                      {new Date(report.created_at).toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>
            </aside>

            <div className="space-y-5">
              {!selected ? (
                <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-black/20 bg-white p-8 text-center text-sm text-[#627278]">
                  Select a report to inspect its available analysis and review history.
                </div>
              ) : (
                <>
                  <article className="rounded-3xl border border-black/10 bg-white p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-[#0b7665]">
                          {selected.public_reference}
                        </p>
                        <h3 className="mt-2 text-2xl font-black capitalize">
                          {pretty(selected.ai_analysis?.issue_category) || "Report details"}
                        </h3>
                      </div>
                      <span className="rounded-full bg-[#e9fbef] px-3 py-1.5 text-xs font-bold capitalize text-[#0b7665]">
                        {pretty(selected.status)}
                      </span>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl bg-[#f7f6f0] p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#627278]">Citizen description</p>
                        <p className="mt-2 text-sm leading-6">
                          {selected.citizen_description || "No text description supplied."}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[#f7f6f0] p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#627278]">Submission details</p>
                        <p className="mt-2 text-sm">Language: {selected.language_code || "Not specified"}</p>
                        <p className="mt-1 text-sm">Submitted: {new Date(selected.created_at).toLocaleString()}</p>
                        <p className="mt-1 text-sm">Updated: {new Date(selected.updated_at).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-black/10 pt-5">
                      <h4 className="font-black">Gemini evidence assessment</h4>
                      {!selected.ai_analysis ? (
                        <p className="mt-3 rounded-xl bg-[#fff9e8] p-4 text-sm leading-6 text-[#66531c]">
                          No AI analysis has been saved for this report yet. The reviewer desk does not invent or generate an assessment automatically.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-3 text-sm">
                          <p className="leading-6">{selected.ai_analysis.summary}</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-[#e9fbef] px-3 py-1 font-bold capitalize text-[#0b7665]">
                              {pretty(selected.ai_analysis.severity)} severity
                            </span>
                            {typeof selected.ai_analysis.confidence === "number" && (
                              <span className="rounded-full bg-[#f1f2ed] px-3 py-1 font-bold">
                                Evidence support: {Math.round(selected.ai_analysis.confidence * 100)}%
                              </span>
                            )}
                          </div>
                          {selected.ai_analysis.visible_evidence?.length ? (
                            <div><strong>Observed evidence</strong><ul className="mt-1 list-disc pl-5">{selected.ai_analysis.visible_evidence.map((item, index) => <li key={index}>{item}</li>)}</ul></div>
                          ) : null}
                          {selected.ai_analysis.missing_evidence?.length ? (
                            <div><strong>Missing context</strong><ul className="mt-1 list-disc pl-5">{selected.ai_analysis.missing_evidence.map((item, index) => <li key={index}>{item}</li>)}</ul></div>
                          ) : null}
                          {selected.ai_analysis.safety_note && <p className="rounded-xl bg-[#f7f6f0] p-3 text-xs leading-5">{selected.ai_analysis.safety_note}</p>}
                        </div>
                      )}
                    </div>

                    {selected.routing_recommendation && (
                      <div className="mt-5 rounded-2xl border border-[#e8d59a] bg-[#fff9e8] p-4 text-sm">
                        <p className="font-black">Suggested routing: {selected.routing_recommendation.service_queue}</p>
                        <p className="mt-2 leading-6">{selected.routing_recommendation.reason}</p>
                        <p className="mt-2 text-xs font-bold uppercase">
                          {pretty(selected.routing_recommendation.status)}
                        </p>
                      </div>
                    )}
                  </article>

                  <form onSubmit={updateStatus} className="rounded-3xl border border-black/10 bg-white p-6">
                    <h4 className="text-lg font-black">Reviewer decision</h4>
                    <p className="mt-1 text-sm text-[#627278]">
                      Status changes are recorded in the case audit timeline.
                    </p>

                    <label className="mt-5 grid gap-2 text-sm font-bold">
                      New status
                      <select
                        value={newStatus}
                        onChange={(event) => setNewStatus(event.target.value)}
                        className="rounded-xl border border-black/15 bg-white p-3 font-normal capitalize"
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status} className="capitalize">
                            {pretty(status)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="mt-4 grid gap-2 text-sm font-bold">
                      Reviewer note (optional)
                      <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        maxLength={500}
                        rows={3}
                        placeholder="Record the reason for this status change..."
                        className="resize-y rounded-xl border border-black/15 p-3 font-normal"
                      />
                      <span className="text-right text-xs font-normal text-[#7b8985]">{note.length}/500</span>
                    </label>

                    <button
                      type="submit"
                      disabled={updating || !newStatus || newStatus === selected.status}
                      className="mt-5 rounded-full bg-[#071d22] px-6 py-3 text-sm font-bold text-white hover:bg-[#0b7665] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {updating ? "Saving decision..." : "Save status & audit event"}
                    </button>
                  </form>

                  <article className="rounded-3xl border border-black/10 bg-white p-6">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-lg font-black">Audit timeline</h4>
                      <button
                        type="button"
                        onClick={() => void loadTimeline(selected.public_reference)}
                        className="text-xs font-bold text-[#0b7665] hover:underline"
                      >
                        Refresh
                      </button>
                    </div>
                    {timeline.length === 0 ? (
                      <p className="mt-4 text-sm text-[#627278]">No timeline events are available.</p>
                    ) : (
                      <ol className="mt-5 space-y-4 border-l-2 border-[#b8f3d0] pl-5">
                        {timeline.map((event, index) => (
                          <li key={`${event.event_type}-${event.created_at}-${index}`}>
                            <p className="text-sm font-bold capitalize">{pretty(event.event_type)}</p>
                            <p className="mt-1 text-xs text-[#7b8985]">
                              {new Date(event.created_at).toLocaleString()}
                            </p>
                          </li>
                        ))}
                      </ol>
                    )}
                  </article>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
