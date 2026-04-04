import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const sharedLinkStyle = ({ isActive }) =>
  `rounded-full px-3 py-1.5 text-sm transition ${
    isActive ? "bg-white/20 text-cyan-200" : "text-slate-200 hover:bg-white/10 hover:text-white"
  }`;

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="fixed left-0 right-0 top-4 z-30 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-xl">
        <Link to="/" className="font-display text-lg font-semibold tracking-wide text-white">
          Intelligent Job Matcher
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <NavLink className={sharedLinkStyle} to="/">
            Home
          </NavLink>
          <NavLink className={sharedLinkStyle} to="/analyzer">
            Match Jobs
          </NavLink>
          {isAuthenticated && (
            <NavLink className={sharedLinkStyle} to="/dashboard">
              Dashboard
            </NavLink>
          )}
          {isAuthenticated && (
            <NavLink className={sharedLinkStyle} to="/analytics">
              Analytics
            </NavLink>
          )}
          {isAuthenticated && (
            <NavLink className={sharedLinkStyle} to="/profile">
              Profile
            </NavLink>
          )}
          {isAuthenticated && user?.role === "admin" && (
            <NavLink className={sharedLinkStyle} to="/admin">
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="subtle-btn px-3 py-2 text-sm">
                Login
              </Link>
              <Link to="/signup" className="cta-btn px-3 py-2 text-sm">
                Sign Up
              </Link>
            </>
          ) : (
            <button type="button" className="subtle-btn px-3 py-2 text-sm" onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
