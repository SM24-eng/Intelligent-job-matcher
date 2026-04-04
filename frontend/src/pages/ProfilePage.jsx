import { Link } from "react-router-dom";
import GlassCard from "../components/GlassCard.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function toPercent(raw) {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return value > 1 ? Math.min(100, Math.round(value)) : Math.round(value * 100);
}

export default function ProfilePage() {
  const { user } = useAuth();
  const allAnalyses = JSON.parse(localStorage.getItem("ijm_analyses") || "[]");
  const history = allAnalyses.filter((entry) => entry.userEmail === user?.email);

  const topJobs = history.flatMap((entry) => entry.recommendedJobs || []);
  const bestScore = topJobs.reduce((max, job) => {
    const score = toPercent(job?.final_score ?? job?.score ?? job?.semantic_score);
    return Math.max(max, score);
  }, 0);

  const roleCount = topJobs.reduce((acc, job) => {
    const role = job?.title || "Unknown Role";
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  const topRole =
    Object.entries(roleCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "No recommendations yet";

  return (
    <div className="page-enter mx-auto max-w-5xl space-y-5">
      <GlassCard className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-cyan-200/40 bg-cyan-300/20 text-xl font-semibold text-cyan-100">
              {(user?.name || "U").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h1 className="font-display text-3xl font-semibold">{user?.name || "User"}</h1>
              <p className="text-sm text-slate-300">{user?.email || "No email"}</p>
            </div>
          </div>
          <Link to="/analyzer" className="cta-btn px-4 py-2.5 text-sm">
            New Analysis
          </Link>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-3">
        <GlassCard className="p-5">
          <p className="text-xs uppercase tracking-wider text-slate-300">Total Analyses</p>
          <p className="mt-2 font-display text-3xl font-semibold">{history.length}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs uppercase tracking-wider text-slate-300">Top Role</p>
          <p className="mt-2 text-sm font-semibold text-cyan-100">{topRole}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs uppercase tracking-wider text-slate-300">Best Match Score</p>
          <p className="mt-2 font-display text-3xl font-semibold text-emerald-200">{bestScore}%</p>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <h2 className="font-display text-2xl font-semibold">Progress Snapshot</h2>
        <p className="mt-1 text-sm text-slate-300">How close your best resume match is to a perfect fit.</p>
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-200">Best Match Readiness</span>
            <span className="text-cyan-100">{bestScore}%</span>
          </div>
          <ProgressBar value={bestScore} />
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold">Recent Analyses</h2>
          <Link to="/analytics" className="subtle-btn px-3 py-2 text-sm">
            Open Analytics
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {history.length ? (
            history.slice(0, 5).map((entry) => (
              <div key={entry.id} className="rounded-xl border border-white/15 bg-white/5 p-3">
                <p className="text-sm text-slate-200">{entry.resumeSnippet}...</p>
                <p className="mt-1 text-xs text-slate-400">{new Date(entry.analyzedAt).toLocaleString()}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-300">No history available yet.</p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

