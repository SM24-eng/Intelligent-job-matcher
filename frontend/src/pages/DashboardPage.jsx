import { Link } from "react-router-dom";
import GlassCard from "../components/GlassCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function DashboardPage() {
  const { user } = useAuth();
  const allAnalyses = JSON.parse(localStorage.getItem("ijm_analyses") || "[]");
  const history = allAnalyses.filter((entry) => entry.userEmail === user?.email);
  const jobs = history.flatMap((entry) => entry.recommendedJobs || []);
  const avgScore = jobs.length
    ? Math.round(
        (jobs.reduce((sum, job) => {
          const raw = Number(job?.final_score ?? job?.score ?? job?.semantic_score ?? 0);
          if (!Number.isFinite(raw) || raw <= 0) {
            return sum;
          }
          return sum + (raw > 1 ? Math.min(100, raw) : raw * 100);
        }, 0) /
          jobs.length)
      )
    : 0;

  return (
    <div className="page-enter mx-auto max-w-5xl space-y-5">
      <GlassCard className="p-6 sm:p-8">
        <h1 className="font-display text-3xl font-semibold">Welcome, {user?.name}</h1>
        <p className="mt-2 text-sm text-slate-300">
          Track your latest resume analyses and recommendation history.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/15 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-wider text-slate-300">Analyses</p>
            <p className="mt-1 font-display text-2xl font-semibold">{history.length}</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-wider text-slate-300">Avg Match Score</p>
            <p className="mt-1 font-display text-2xl font-semibold text-cyan-100">{avgScore}%</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-wider text-slate-300">Recommended Jobs</p>
            <p className="mt-1 font-display text-2xl font-semibold">{jobs.length}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/analyzer" className="cta-btn inline-block px-4 py-2.5 text-sm">
            Match New Resume
          </Link>
          <Link to="/analytics" className="subtle-btn inline-block px-4 py-2.5 text-sm">
            Open Analytics
          </Link>
          <Link to="/profile" className="subtle-btn inline-block px-4 py-2.5 text-sm">
            View Profile
          </Link>
        </div>
      </GlassCard>

      <div className="space-y-4">
        {history.length === 0 ? (
          <GlassCard className="p-6 text-center">
            <p className="text-slate-300">No analysis history found yet.</p>
          </GlassCard>
        ) : (
          history.map((entry) => (
            <GlassCard key={entry.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-2xl text-sm text-slate-200">{entry.resumeSnippet}...</p>
                <p className="text-xs text-slate-400">{new Date(entry.analyzedAt).toLocaleString()}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(entry.recommendedJobs || []).map((job) => (
                  <span
                    key={`${entry.id}-${job.title}`}
                    className="rounded-full border border-cyan-200/35 bg-cyan-300/15 px-2.5 py-1 text-xs text-cyan-100"
                  >
                    {job.title}
                  </span>
                ))}
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
