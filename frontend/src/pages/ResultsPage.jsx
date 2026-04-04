import { Link, useLocation } from "react-router-dom";
import JobCard from "../components/JobCard.jsx";
import GlassCard from "../components/GlassCard.jsx";

export default function ResultsPage() {
  const location = useLocation();
  const jobs = location.state?.jobs || [];
  const resumeSnippet = location.state?.resumeSnippet || "";
  const topJobs = jobs.slice(0, 5);

  const getScore = (job) => {
    const raw =
      job?.final_score ??
      job?.score ??
      job?.semantic_score ??
      0;

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  if (!jobs.length) {
    return (
      <div className="page-enter mx-auto max-w-2xl">
        <GlassCard className="p-8 text-center">
          <h2 className="font-display text-2xl font-semibold">No Results Yet</h2>
          <p className="mt-3 text-slate-300">Analyze a resume first to view your top job recommendations.</p>
          <Link to="/analyzer" className="cta-btn mt-6 inline-block px-5 py-2.5">
            Go to Analyzer
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="page-enter mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold">Top 5 Job Matches</h1>
        <p className="mt-2 text-sm text-slate-300">
          Ranked by hybrid score: semantic fit, skill overlap, experience alignment, and role intent.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {topJobs.map((job, index) => (
          <JobCard
            key={`${job.title}-${index}`}
            rank={index + 1}
            job={job}
            score={getScore(job)}
            resumeSnippet={resumeSnippet}
            allJobs={topJobs}
            selectedIndex={index}
          />
        ))}
      </div>
    </div>
  );
}
