import GlassCard from "./GlassCard";
import ProgressBar from "./ProgressBar";
import { Link } from "react-router-dom";

function toPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.round(Math.max(0, Math.min(1, n)) * 100);
}

function toWeightPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.round(Math.max(0, Math.min(1, n)) * 100);
}

export default function JobCard({ rank, job, score, resumeSnippet = "", allJobs = [], selectedIndex = 0 }) {
  const title = job?.title || "Untitled Role";
  const percentage = toPercent(score);

  const semanticPercent = toPercent(job?.semantic_score);
  const skillPercent = toPercent(job?.skill_score);
  const experiencePercent = toPercent(job?.experience_score);
  const rolePercent = toPercent(job?.role_score);

  const semanticWeight = toWeightPercent(job?.semantic_weight);
  const skillWeight = toWeightPercent(job?.skill_weight);
  const experienceWeight = toWeightPercent(job?.experience_weight);
  const roleWeight = toWeightPercent(job?.role_weight);

  const weightedScorePercent = toPercent(job?.weighted_score);
  const missingPenaltyPercent = toPercent(job?.missing_core_penalty);
  const afterMissingPenaltyPercent = toPercent(job?.score_after_missing_penalty);
  const lowRolePenaltyApplied = Boolean(job?.low_role_penalty_applied);

  const matchedSkills = Array.isArray(job?.matched_skills) ? job.matched_skills : [];
  const missingSkills = Array.isArray(job?.missing_skills) ? job.missing_skills : [];

  return (
    <GlassCard className="group p-5 transition-all duration-300 hover:-translate-y-1 hover:border-sky-300/70 hover:shadow-glow">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-slate-300">Rank #{rank}</p>
        <p className="rounded-full border border-sky-200/40 bg-sky-300/20 px-2.5 py-1 text-xs font-semibold text-sky-100">
          {percentage}% Match
        </p>
      </div>
      <h3 className="mb-3 font-display text-xl font-semibold text-white">{title}</h3>
      <ProgressBar value={percentage} />

      <p className="mt-4 text-xs text-slate-300">
        Selection summary: skill fit {skillPercent}%, semantic fit {semanticPercent}%, experience {experiencePercent}%.
      </p>

      <Link
        to="/explainability"
        state={{ job, score, rank, resumeSnippet, jobs: allJobs, selectedIndex }}
        className="mt-3 inline-block rounded-lg border border-cyan-200/40 bg-cyan-300/15 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/25"
      >
        Explain This Match
      </Link>

      <details className="mt-3 rounded-xl border border-white/15 bg-white/5 p-3 text-xs text-slate-200 open:border-cyan-200/40 open:bg-cyan-300/10">
        <summary className="cursor-pointer list-none font-semibold text-cyan-100">Show explainability details</summary>

        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <p>Semantic Fit: {semanticPercent}%</p>
            <p>Weight: {semanticWeight}%</p>
            <p>Skill Match: {skillPercent}%</p>
            <p>Weight: {skillWeight}%</p>
            <p>Experience Fit: {experiencePercent}%</p>
            <p>Weight: {experienceWeight}%</p>
            <p>Role Intent: {rolePercent}%</p>
            <p>Weight: {roleWeight}%</p>
          </div>

          <p>
            Matched Skills: {matchedSkills.length ? matchedSkills.join(", ") : "No direct skill overlap detected"}
          </p>
          <p>
            Missing Skills: {missingSkills.length ? missingSkills.join(", ") : "No major gaps detected"}
          </p>

          <div className="rounded-lg border border-cyan-200/20 bg-cyan-300/10 p-2 text-[11px] leading-relaxed text-cyan-100">
            <p>
              Final Formula: ({semanticWeight}% x {semanticPercent}% + {skillWeight}% x {skillPercent}% + {experienceWeight}% x {experiencePercent}% + {roleWeight}% x {rolePercent}%) - Missing Skill Penalty {missingPenaltyPercent}%
              {lowRolePenaltyApplied ? " then x 85% (low role intent)" : ""}
            </p>
            <p>
              Score Walkthrough: Weighted {weightedScorePercent}% {" -> "} After Missing Penalty {afterMissingPenaltyPercent}% {" -> "} Final {percentage}%
            </p>
          </div>
        </div>
      </details>
    </GlassCard>
  );
}
