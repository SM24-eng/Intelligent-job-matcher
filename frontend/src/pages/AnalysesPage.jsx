import { useNavigate } from "react-router-dom";
import GlassCard from "../components/GlassCard.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function AnalysesPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const analyses = JSON.parse(localStorage.getItem("ijm_analyses") || "[]");

  return (
    <div className="page-enter grid gap-4 md:grid-cols-[260px_1fr]">
      <Sidebar
        onLogout={() => {
          logout();
          navigate("/");
        }}
      />

      <GlassCard className="p-6">
        <h1 className="font-display text-2xl font-semibold">Resume Analyses</h1>

        <div className="mt-5 space-y-3">
          {analyses.length ? (
            analyses.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-white/15 bg-white/5 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-100">{entry.userEmail}</p>
                  <p className="text-xs text-slate-400">{new Date(entry.analyzedAt).toLocaleString()}</p>
                </div>
                <p className="mt-2 text-sm text-slate-300">{entry.resumeSnippet}...</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(entry.recommendedJobs || []).map((job) => (
                    <span
                      key={`${entry.id}-${job.title}`}
                      className="rounded-full border border-cyan-200/35 bg-cyan-300/15 px-2.5 py-1 text-xs text-cyan-100"
                    >
                      {job.title} ({Math.round(job.score * 100)}%)
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-300">No analyses are available yet.</p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
