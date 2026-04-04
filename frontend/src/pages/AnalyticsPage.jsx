import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import GlassCard from "../components/GlassCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const CHART_COLORS = ["#38bdf8", "#67e8f9", "#818cf8", "#22d3ee", "#0ea5e9", "#14b8a6"];

function normalizeScore(raw) {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return value > 1 ? Math.min(100, value) : Math.round(value * 100);
}

function getChartData(analyses) {
  const dailyCounts = new Map();
  const roleStats = new Map();

  analyses.forEach((analysis) => {
    const dateKey = new Date(analysis.analyzedAt || Date.now()).toLocaleDateString();
    dailyCounts.set(dateKey, (dailyCounts.get(dateKey) || 0) + 1);

    (analysis.recommendedJobs || []).forEach((job) => {
      const role = job?.title || "Unknown Role";
      const score = normalizeScore(job?.final_score ?? job?.score ?? job?.semantic_score);
      const current = roleStats.get(role) || { role, count: 0, scoreTotal: 0 };

      roleStats.set(role, {
        role,
        count: current.count + 1,
        scoreTotal: current.scoreTotal + score,
      });
    });
  });

  const trendData = [...dailyCounts.entries()].map(([date, count]) => ({ date, count }));

  const rankedRoles = [...roleStats.values()].sort((a, b) => b.count - a.count);
  const pieData = rankedRoles.slice(0, 6).map((item) => ({ name: item.role, value: item.count }));
  const barData = rankedRoles.slice(0, 6).map((item) => ({
    role: item.role,
    avgScore: Math.round(item.scoreTotal / Math.max(item.count, 1)),
  }));

  return { trendData, pieData, barData };
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const allAnalyses = JSON.parse(localStorage.getItem("ijm_analyses") || "[]");
  const analyses = allAnalyses.filter((item) => item.userEmail === user?.email);
  const { trendData, pieData, barData } = getChartData(analyses);

  return (
    <div className="page-enter mx-auto max-w-6xl space-y-5">
      <GlassCard className="p-6 sm:p-8">
        <h1 className="font-display text-3xl font-semibold">Analytics Hub</h1>
        <p className="mt-2 text-sm text-slate-300">
          Visual insights from your resume analyses, including trend, score quality, and role distribution.
        </p>
      </GlassCard>

      {analyses.length === 0 ? (
        <GlassCard className="p-7 text-center">
          <p className="text-slate-300">No analytics yet. Run at least one resume analysis to unlock charts.</p>
          <Link to="/analyzer" className="cta-btn mt-5 inline-block px-4 py-2.5 text-sm">
            Analyze Resume
          </Link>
        </GlassCard>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          <GlassCard className="p-5">
            <h2 className="font-display text-xl font-semibold">Analysis Trend</h2>
            <p className="mb-4 mt-1 text-xs text-slate-300">Number of analyses completed by day</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1f" />
                  <XAxis dataKey="date" stroke="#dbeafe" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="#dbeafe" fontSize={12} />
                  <Tooltip contentStyle={{ background: "#0b2138", border: "1px solid #5aa9e633", color: "#e2f5ff" }} />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#67e8f9" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h2 className="font-display text-xl font-semibold">Role Distribution</h2>
            <p className="mb-4 mt-1 text-xs text-slate-300">Top recommended job roles (pie chart)</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                    {pieData.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0b2138", border: "1px solid #5aa9e633", color: "#e2f5ff" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="p-5 md:col-span-2">
            <h2 className="font-display text-xl font-semibold">Average Match Quality</h2>
            <p className="mb-4 mt-1 text-xs text-slate-300">Average score by recommended role</p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 8, right: 12, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1f" />
                  <XAxis dataKey="role" stroke="#dbeafe" fontSize={12} interval={0} angle={-8} textAnchor="end" height={60} />
                  <YAxis stroke="#dbeafe" fontSize={12} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: "#0b2138", border: "1px solid #5aa9e633", color: "#e2f5ff" }} />
                  <Bar dataKey="avgScore" radius={[6, 6, 0, 0]}>
                    {barData.map((item, index) => (
                      <Cell key={`${item.role}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}