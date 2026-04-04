import { Link } from "react-router-dom";
import GlassCard from "../components/GlassCard.jsx";

export default function LandingPage() {
  return (
    <div className="page-enter grid min-h-[70vh] place-items-center">
      <GlassCard className="w-full max-w-4xl p-8 sm:p-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 inline-block rounded-full border border-cyan-200/40 bg-cyan-200/15 px-3 py-1 text-xs uppercase tracking-[0.22em] text-cyan-100">
            AI-powered job recommendation system
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            Intelligent Job Matcher
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-slate-200 sm:text-base">
            Convert raw resume text into precise career recommendations using semantic analysis, skill extraction,
            and hybrid AI matching. Discover the top opportunities aligned with your real strengths.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/signup" className="cta-btn px-6 py-3 text-sm sm:text-base">
              Get Started
            </Link>
            <Link to="/login" className="subtle-btn px-6 py-3 text-sm sm:text-base">
              I already have an account
            </Link>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
