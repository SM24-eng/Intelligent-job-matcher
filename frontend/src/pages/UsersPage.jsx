import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/GlassCard.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function UsersPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [users, setUsers] = useState(JSON.parse(localStorage.getItem("ijm_users") || "[]"));

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.email.localeCompare(b.email)),
    [users]
  );

  const handleDelete = (email) => {
    const filtered = users.filter((item) => item.email !== email);
    setUsers(filtered);
    localStorage.setItem("ijm_users", JSON.stringify(filtered));
  };

  return (
    <div className="page-enter grid gap-4 md:grid-cols-[260px_1fr]">
      <Sidebar
        onLogout={() => {
          logout();
          navigate("/");
        }}
      />

      <GlassCard className="p-6">
        <h1 className="font-display text-2xl font-semibold">All Users</h1>
        <div className="mt-5 space-y-3">
          {sortedUsers.length ? (
            sortedUsers.map((user) => (
              <div
                key={user.email}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 p-3"
              >
                <div>
                  <p className="font-medium text-slate-100">{user.name}</p>
                  <p className="text-sm text-slate-300">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(user.email)}
                  className="rounded-lg border border-rose-300/40 bg-rose-300/15 px-3 py-1.5 text-xs font-semibold text-rose-200"
                >
                  Delete User
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-300">No users found.</p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
