import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GlassCard from "../components/GlassCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const signedUser = await login({ email, password });
      navigate(signedUser?.role === "admin" ? "/admin" : "/dashboard");
    } catch (submissionError) {
      setError(
        submissionError?.response?.data?.error ||
          submissionError?.response?.data?.message ||
          submissionError?.message ||
          "Invalid login credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter mx-auto grid min-h-[70vh] max-w-md place-items-center">
      <GlassCard className="w-full p-7 sm:p-8">
        <h1 className="mb-1 font-display text-2xl font-semibold">Welcome Back</h1>
        <p className="mb-6 text-sm text-slate-300">Log in to continue matching your resume with top roles.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-slate-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="soft-input px-3 py-2.5"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-slate-200">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="soft-input px-3 py-2.5"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error && <p className="rounded-xl border border-rose-200/30 bg-rose-300/15 px-3 py-2 text-sm text-rose-200">{error}</p>}

          <button type="submit" disabled={loading} className="cta-btn w-full px-4 py-2.5 disabled:opacity-70">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-300">
          Create an account?{" "}
          <Link to="/signup" className="text-cyan-200 hover:text-cyan-100">
            Sign up
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
