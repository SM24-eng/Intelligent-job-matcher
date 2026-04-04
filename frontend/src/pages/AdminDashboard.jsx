import { useNavigate } from "react-router-dom";
import GlassCard from "../components/GlassCard.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function getStats() {
  const users = JSON.parse(localStorage.getItem("ijm_users") || "[]");
  const analyses = JSON.parse(localStorage.getItem("ijm_analyses") || "[]");
  return { users, analyses };
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const { users, analyses } = getStats();
  const recent = analyses.slice(0, 5);

  return (
    <div className="page-enter grid gap-4 md:grid-cols-[260px_1fr]">
      <Sidebar
        onLogout={() => {
          logout();
          navigate("/");
        }}
      />

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <GlassCard className="p-5">
            <p className="text-xs uppercase tracking-wider text-slate-300">Total Users</p>
            <p className="mt-2 font-display text-3xl font-semibold">{users.length}</p>
          </GlassCard>
          <GlassCard className="p-5">
            <p className="text-xs uppercase tracking-wider text-slate-300">Total Analyses</p>
            <p className="mt-2 font-display text-3xl font-semibold">{analyses.length}</p>
          </GlassCard>
          <GlassCard className="p-5">
            <p className="text-xs uppercase tracking-wider text-slate-300">System Status</p>
            <p className="mt-2 font-display text-3xl font-semibold text-emerald-200">Healthy</p>
          </GlassCard>
        </div>

        <GlassCard className="p-6">
          <h2 className="font-display text-2xl font-semibold">Recent Activity</h2>
          <div className="mt-4 space-y-3">
            {recent.length ? (
              recent.map((item) => (
                <div key={item.id} className="rounded-xl border border-white/15 bg-white/5 p-3">
                  <p className="text-sm text-slate-200">{item.userEmail}</p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(item.analyzedAt).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-300">No recent analyses yet.</p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
