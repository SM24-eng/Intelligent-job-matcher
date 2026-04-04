import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GlassCard from "../components/GlassCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const updateField = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await signup({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      navigate("/login");
    } catch (submissionError) {
      setError(
        submissionError?.response?.data?.error ||
          submissionError?.response?.data?.message ||
          submissionError?.message ||
          "Signup failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter mx-auto grid min-h-[70vh] max-w-md place-items-center">
      <GlassCard className="w-full p-7 sm:p-8">
        <h1 className="mb-1 font-display text-2xl font-semibold">Create Account</h1>
        <p className="mb-6 text-sm text-slate-300">Start your AI-powered resume journey.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm text-slate-200">
              Name
            </label>
            <input
              id="name"
              type="text"
              className="soft-input px-3 py-2.5"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-slate-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="soft-input px-3 py-2.5"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
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
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="mb-1 block text-sm text-slate-200">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              className="soft-input px-3 py-2.5"
              value={form.confirmPassword}
              onChange={(event) => updateField("confirmPassword", event.target.value)}
              required
            />
          </div>

          {error && <p className="rounded-xl border border-rose-200/30 bg-rose-300/15 px-3 py-2 text-sm text-rose-200">{error}</p>}

          <button type="submit" disabled={loading} className="cta-btn w-full px-4 py-2.5 disabled:opacity-70">
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-300">
          Already have an account?{" "}
          <Link to="/login" className="text-cyan-200 hover:text-cyan-100">
            Login
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
