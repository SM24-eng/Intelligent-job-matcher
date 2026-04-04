import { NavLink } from "react-router-dom";
import GlassCard from "./GlassCard";

const navItems = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/analyses", label: "Resume Analyses" },
];

export default function Sidebar({ onLogout }) {
  return (
    <GlassCard className="h-fit p-4 md:sticky md:top-28">
      <h2 className="mb-4 font-display text-lg font-semibold">Admin Panel</h2>
      <nav className="space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/admin"}
            className={({ isActive }) =>
              `block rounded-xl px-3 py-2 text-sm transition ${
                isActive
                  ? "bg-sky-300/20 text-sky-100"
                  : "text-slate-200 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <button type="button" onClick={onLogout} className="subtle-btn mt-5 w-full px-3 py-2 text-sm">
        Logout
      </button>
    </GlassCard>
  );
}
