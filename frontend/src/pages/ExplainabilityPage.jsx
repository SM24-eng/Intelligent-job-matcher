import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { jsPDF } from "jspdf";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import GlassCard from "../components/GlassCard.jsx";
import { getExplainabilityHistory, saveExplainabilityRecord } from "../services/authService";

const FACTOR_COLORS = {
  semantic: "#22d3ee",
  skill: "#34d399",
  experience: "#fbbf24",
  role: "#c4b5fd",
};

function clampPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return 0;
  }
  if (n <= 1) {
    return Math.round(n * 100);
  }
  return Math.round(Math.min(100, n));
}

function getExplainabilityInput(state) {
  if (state?.job) {
    return {
      job: state.job,
      score: state.score,
      rank: state.rank,
      resumeSnippet: state.resumeSnippet || "",
      jobs: Array.isArray(state.jobs) ? state.jobs : [],
      selectedIndex: Number.isInteger(state.selectedIndex) ? state.selectedIndex : 0,
    };
  }

  const allAnalyses = JSON.parse(localStorage.getItem("ijm_analyses") || "[]");
  const latest = allAnalyses[0];
  const fallbackJob = latest?.recommendedJobs?.[0];

  if (!fallbackJob) {
    return null;
  }

  return {
    job: fallbackJob,
    score: fallbackJob?.final_score ?? fallbackJob?.score ?? 0,
    rank: 1,
    resumeSnippet: latest?.resumeSnippet || "",
    jobs: Array.isArray(latest?.recommendedJobs) ? latest.recommendedJobs.slice(0, 5) : [],
    selectedIndex: 0,
  };
}

function buildNarrative({ semanticPercent, skillPercent, experiencePercent, rolePercent, missingSkillsCount }) {
  const points = [];

  if (skillPercent >= 70) {
    points.push("Strong skill overlap with the job requirements drove this recommendation.");
  } else if (skillPercent >= 45) {
    points.push("Moderate skill overlap was detected, with some room to improve role readiness.");
  } else {
    points.push("Skill overlap is currently limited, so this recommendation depends more on semantic and intent signals.");
  }

  if (semanticPercent >= 70) {
    points.push("Your resume language is semantically close to this role's responsibilities.");
  } else {
    points.push("Semantic similarity contributed, but was not the dominant factor.");
  }

  if (experiencePercent >= 65) {
    points.push("Experience alignment is high, indicating your background matches expected seniority.");
  } else {
    points.push("Experience fit is moderate, which reduced the overall confidence score.");
  }

  if (rolePercent < 40) {
    points.push("Role intent was low, so a role-intent penalty lowered the final score.");
  }

  if (missingSkillsCount > 0) {
    points.push("Missing core skills were identified and transparently penalized in the final score.");
  } else {
    points.push("No major core-skill gaps were found, helping preserve the final score.");
  }

  return points;
}

export default function ExplainabilityPage() {
  const location = useLocation();
  const data = useMemo(() => getExplainabilityInput(location.state), [location.state]);
  const [history, setHistory] = useState([]);
  const [savingStatus, setSavingStatus] = useState("idle");
  const [comparisonIndex, setComparisonIndex] = useState(data?.selectedIndex ?? 0);

  if (!data) {
    return (
      <div className="page-enter mx-auto max-w-2xl">
        <GlassCard className="p-8 text-center">
          <h2 className="font-display text-2xl font-semibold">No Explainability Data Yet</h2>
          <p className="mt-3 text-slate-300">Run a resume analysis first, then open explainability from a job card.</p>
          <Link to="/analyzer" className="cta-btn mt-6 inline-block px-5 py-2.5">
            Analyze Resume
          </Link>
        </GlassCard>
      </div>
    );
  }

  const { job, score, rank, resumeSnippet } = data;
  const candidateJobs = (data.jobs || []).filter((item) => item?.title && item.title !== job?.title);

  const finalPercent = clampPercent(score ?? job?.final_score ?? 0);
  const semanticPercent = clampPercent(job?.semantic_score);
  const skillPercent = clampPercent(job?.skill_score);
  const experiencePercent = clampPercent(job?.experience_score);
  const rolePercent = clampPercent(job?.role_score);

  const weightedScorePercent = clampPercent(job?.weighted_score);
  const missingPenaltyPercent = clampPercent(job?.missing_core_penalty);
  const afterPenaltyPercent = clampPercent(job?.score_after_missing_penalty);
  const rolePenaltyApplied = Boolean(job?.low_role_penalty_applied);

  const semanticWeight = clampPercent(job?.semantic_weight);
  const skillWeight = clampPercent(job?.skill_weight);
  const experienceWeight = clampPercent(job?.experience_weight);
  const roleWeight = clampPercent(job?.role_weight);

  const matchedSkills = Array.isArray(job?.matched_skills) ? job.matched_skills : [];
  const missingSkills = Array.isArray(job?.missing_skills) ? job.missing_skills : [];

  const weightedContributions = useMemo(
    () => [
      {
        name: "Semantic",
        value: Math.round((semanticWeight * semanticPercent) / 100),
        raw: semanticPercent,
        weight: semanticWeight,
        color: FACTOR_COLORS.semantic,
      },
      {
        name: "Skill",
        value: Math.round((skillWeight * skillPercent) / 100),
        raw: skillPercent,
        weight: skillWeight,
        color: FACTOR_COLORS.skill,
      },
      {
        name: "Experience",
        value: Math.round((experienceWeight * experiencePercent) / 100),
        raw: experiencePercent,
        weight: experienceWeight,
        color: FACTOR_COLORS.experience,
      },
      {
        name: "Role Intent",
        value: Math.round((roleWeight * rolePercent) / 100),
        raw: rolePercent,
        weight: roleWeight,
        color: FACTOR_COLORS.role,
      },
    ],
    [
      semanticWeight,
      semanticPercent,
      skillWeight,
      skillPercent,
      experienceWeight,
      experiencePercent,
      roleWeight,
      rolePercent,
    ]
  );

  const narrative = useMemo(
    () =>
      buildNarrative({
        semanticPercent,
        skillPercent,
        experiencePercent,
        rolePercent,
        missingSkillsCount: missingSkills.length,
      }),
    [semanticPercent, skillPercent, experiencePercent, rolePercent, missingSkills.length]
  );

  const matchedSkillsKey = matchedSkills.join("|");
  const missingSkillsKey = missingSkills.join("|");
  const narrativeKey = narrative.join("|");

  useEffect(() => {
    setComparisonIndex(data?.selectedIndex ?? 0);
  }, [data?.selectedIndex]);

  useEffect(() => {
    let isMounted = true;

    async function saveAndFetchHistory() {
      if (!job?.title) {
        return;
      }

      const recordKey = `${job.title}-${rank}-${finalPercent}`;
      const savedFlag = sessionStorage.getItem(`ijm_explainability_saved_${recordKey}`);

      try {
        if (!savedFlag) {
          setSavingStatus("saving");
          await saveExplainabilityRecord({
            job_title: job.title,
            rank,
            final_score: finalPercent / 100,
            semantic_score: semanticPercent / 100,
            skill_score: skillPercent / 100,
            experience_score: experiencePercent / 100,
            role_score: rolePercent / 100,
            matched_skills: matchedSkills,
            missing_skills: missingSkills,
            model_weights: {
              semantic: semanticWeight / 100,
              skill: skillWeight / 100,
              experience: experienceWeight / 100,
              role: roleWeight / 100,
            },
            narrative,
          });
          sessionStorage.setItem(`ijm_explainability_saved_${recordKey}`, "1");
        }
        setSavingStatus("saved");
      } catch (error) {
        setSavingStatus("offline");
      }

      try {
        const historyData = await getExplainabilityHistory();
        if (isMounted && Array.isArray(historyData)) {
          setHistory(historyData.slice(0, 5));
        }
      } catch (error) {
        if (isMounted) {
          setHistory([]);
        }
      }
    }

    saveAndFetchHistory();

    return () => {
      isMounted = false;
    };
  }, [
    finalPercent,
    job?.title,
    matchedSkillsKey,
    missingSkillsKey,
    narrativeKey,
    rank,
    rolePercent,
    roleWeight,
    semanticPercent,
    semanticWeight,
    skillPercent,
    skillWeight,
    experiencePercent,
    experienceWeight,
  ]);

  const comparisonJob = useMemo(() => {
    if (!candidateJobs.length) {
      return null;
    }
    return candidateJobs[Math.max(0, Math.min(comparisonIndex, candidateJobs.length - 1))];
  }, [candidateJobs, comparisonIndex]);

  const comparisonRows = comparisonJob
    ? [
        {
          factor: "Semantic",
          current: semanticPercent,
          compare: clampPercent(comparisonJob?.semantic_score),
        },
        {
          factor: "Skill",
          current: skillPercent,
          compare: clampPercent(comparisonJob?.skill_score),
        },
        {
          factor: "Experience",
          current: experiencePercent,
          compare: clampPercent(comparisonJob?.experience_score),
        },
        {
          factor: "Role Intent",
          current: rolePercent,
          compare: clampPercent(comparisonJob?.role_score),
        },
      ]
    : [];

  const downloadPdfReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 12;
    const right = pageWidth - margin;
    let y = 16;

    const writeSectionTitle = (title) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(21, 94, 117);
      doc.text(title, margin, y);
      y += 6;
      doc.setDrawColor(186, 230, 253);
      doc.line(margin, y, right, y);
      y += 6;
    };

    const writeLabelValue = (label, value) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(label, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, margin + 44, y);
      y += 6;
    };

    const writeBullets = (items) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      items.forEach((item) => {
        const lines = doc.splitTextToSize(`- ${item}`, right - margin * 2);
        lines.forEach((line) => {
          doc.text(line, margin, y);
          y += 5;
        });
      });
    };

    doc.setFillColor(14, 116, 144);
    doc.rect(0, 0, pageWidth, 24, "F");
    doc.setTextColor(240, 249, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text("Intelligent Job Matcher", margin, 12);
    doc.setFontSize(11);
    doc.text("Transparent Explainability Report", margin, 19);

    y = 33;
    writeSectionTitle("Executive Summary");
    writeLabelValue("Role", job?.title || "Untitled Role");
    writeLabelValue("Rank", `#${rank}`);
    writeLabelValue("Final Match Score", `${finalPercent}%`);
    writeLabelValue("Generated On", new Date().toLocaleString());

    y += 2;
    writeSectionTitle("Score Breakdown");
    writeLabelValue("Semantic", `${semanticPercent}% (weight ${semanticWeight}%)`);
    writeLabelValue("Skill", `${skillPercent}% (weight ${skillWeight}%)`);
    writeLabelValue("Experience", `${experiencePercent}% (weight ${experienceWeight}%)`);
    writeLabelValue("Role Intent", `${rolePercent}% (weight ${roleWeight}%)`);
    writeLabelValue("Missing Skill Penalty", `-${missingPenaltyPercent}%`);
    writeLabelValue("Role Penalty Applied", rolePenaltyApplied ? "Yes" : "No");
    writeLabelValue("Final After All Penalties", `${finalPercent}%`);

    y += 2;
    writeSectionTitle("Narrative Rationale");
    writeBullets(narrative);

    y += 3;
    writeSectionTitle("Skills Snapshot");
    const matchedText = matchedSkills.length ? matchedSkills.join(", ") : "None";
    const missingText = missingSkills.length ? missingSkills.join(", ") : "None";
    const matchedLines = doc.splitTextToSize(matchedText, right - (margin + 44) - margin);
    const missingLines = doc.splitTextToSize(missingText, right - (margin + 44) - margin);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("Matched Skills", margin, y);
    doc.setFont("helvetica", "normal");
    matchedLines.forEach((line, idx) => {
      doc.text(line, margin + 44, y + idx * 5);
    });
    y += Math.max(6, matchedLines.length * 5 + 1);

    doc.setFont("helvetica", "bold");
    doc.text("Missing Skills", margin, y);
    doc.setFont("helvetica", "normal");
    missingLines.forEach((line, idx) => {
      doc.text(line, margin + 44, y + idx * 5);
    });

    const safeTitle = (job?.title || "job").replace(/[^a-zA-Z0-9-_]+/g, "_");
    doc.save(`explainability_${safeTitle}.pdf`);
  };

  return (
    <div className="page-enter mx-auto max-w-6xl space-y-5">
      <GlassCard className="p-6 sm:p-8">
        <p className="inline-block rounded-full border border-cyan-200/40 bg-cyan-300/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-100">
          Transparent Explainability Report
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold">Why {job?.title || "this role"} was selected</h1>
        <p className="mt-2 text-sm text-slate-300">
          Rank #{rank || "-"} with final match score <span className="font-semibold text-cyan-100">{finalPercent}%</span>
        </p>
        {resumeSnippet ? <p className="mt-2 text-xs text-slate-400">Resume context: {resumeSnippet}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="cta-btn px-4 py-2 text-sm" onClick={downloadPdfReport}>
            Download PDF Report
          </button>
          <span className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-300">
            Persistence: {savingStatus === "saved" ? "Saved to backend" : savingStatus === "saving" ? "Saving to backend..." : "Local only (offline)"}
          </span>
        </div>
      </GlassCard>

      <div className="grid gap-5 md:grid-cols-2">
        <GlassCard className="p-5">
          <h2 className="font-display text-xl font-semibold">Selection Reasons</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-200">
            {narrative.map((line) => (
              <p key={line} className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                {line}
              </p>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="font-display text-xl font-semibold">Score Pipeline</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/15 bg-white/5 p-3">
              <p className="text-xs text-slate-300">Weighted Score</p>
              <p className="mt-1 text-2xl font-semibold text-cyan-100">{weightedScorePercent}%</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/5 p-3">
              <p className="text-xs text-slate-300">Missing Skill Penalty</p>
              <p className="mt-1 text-2xl font-semibold text-rose-200">-{missingPenaltyPercent}%</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/5 p-3">
              <p className="text-xs text-slate-300">After Penalty</p>
              <p className="mt-1 text-2xl font-semibold text-sky-100">{afterPenaltyPercent}%</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/5 p-3">
              <p className="text-xs text-slate-300">Role Penalty Applied</p>
              <p className="mt-1 text-xl font-semibold text-amber-100">{rolePenaltyApplied ? "Yes (x 85%)" : "No"}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="font-display text-xl font-semibold">Factor Contributions</h2>
          <p className="mb-3 mt-1 text-xs text-slate-300">Contribution = Factor Weight x Factor Score</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weightedContributions} margin={{ top: 8, right: 10, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1f" />
                <XAxis dataKey="name" stroke="#dbeafe" fontSize={12} />
                <YAxis stroke="#dbeafe" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: "#0b2138", border: "1px solid #5aa9e633", color: "#e2f5ff" }}
                  formatter={(value, name, props) => [
                    `${value}%`,
                    `${props.payload.name} contribution (weight ${props.payload.weight}%, score ${props.payload.raw}%)`,
                  ]}
                />
                <Legend wrapperStyle={{ color: "#dbeafe", fontSize: "12px" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {weightedContributions.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="#0f172a" strokeOpacity={0.55} strokeWidth={1} />
                  ))}
                  <LabelList dataKey="value" position="top" fill="#e2f5ff" formatter={(v) => `${v}%`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="font-display text-xl font-semibold">Weight Distribution</h2>
          <p className="mb-3 mt-1 text-xs text-slate-300">How the model prioritized each factor for this role</p>
          <div className="h-72 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={weightedContributions}
                  dataKey="weight"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={95}
                  paddingAngle={3}
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={false}
                >
                  {weightedContributions.map((entry) => (
                    <Cell key={`pie-${entry.name}`} fill={entry.color} stroke="#082f49" strokeOpacity={0.6} strokeWidth={1} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#0b2138", border: "1px solid #5aa9e633", color: "#e2f5ff" }}
                  formatter={(value) => [`${value}%`, "Weight"]}
                />
                <Legend verticalAlign="bottom" height={32} wrapperStyle={{ color: "#dbeafe", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <h2 className="font-display text-xl font-semibold">Skills Transparency</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-emerald-200">Matched Skills</p>
            <div className="flex flex-wrap gap-2">
              {matchedSkills.length ? (
                matchedSkills.map((skill) => (
                  <span
                    key={`match-${skill}`}
                    className="rounded-full border border-emerald-300/40 bg-emerald-300/15 px-2.5 py-1 text-xs text-emerald-100"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-300">No direct skill overlap detected.</p>
              )}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-rose-200">Missing Skills</p>
            <div className="flex flex-wrap gap-2">
              {missingSkills.length ? (
                missingSkills.map((skill) => (
                  <span
                    key={`missing-${skill}`}
                    className="rounded-full border border-rose-300/40 bg-rose-300/15 px-2.5 py-1 text-xs text-rose-100"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-300">No major core-skill gaps detected.</p>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="font-display text-xl font-semibold">Transparent Formula</h2>
        <p className="mt-3 text-sm text-slate-200">
          Final Score = ({semanticWeight}% x {semanticPercent}% + {skillWeight}% x {skillPercent}% + {experienceWeight}% x {experiencePercent}% + {roleWeight}% x {rolePercent}%) - {missingPenaltyPercent}%
          {rolePenaltyApplied ? " then multiplied by 85% for low role intent" : " with no role-intent penalty"}.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/results" className="subtle-btn px-4 py-2 text-sm">
            Back to Results
          </Link>
          <Link to="/analyzer" className="cta-btn px-4 py-2 text-sm">
            Analyze Another Resume
          </Link>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="font-display text-xl font-semibold">Comparison Mode</h2>
        {!candidateJobs.length ? (
          <p className="mt-3 text-sm text-slate-300">No alternate job in this result set to compare against.</p>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label htmlFor="compare-job" className="text-sm text-slate-200">
                Compare with:
              </label>
              <select
                id="compare-job"
                className="soft-input max-w-xs p-2 text-sm"
                value={comparisonIndex}
                onChange={(event) => setComparisonIndex(Number(event.target.value))}
              >
                {candidateJobs.map((item, idx) => (
                  <option value={idx} key={`${item.title}-${idx}`}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonRows} margin={{ top: 8, right: 10, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1f" />
                  <XAxis dataKey="factor" stroke="#dbeafe" fontSize={12} />
                  <YAxis stroke="#dbeafe" fontSize={12} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: "#0b2138", border: "1px solid #5aa9e633", color: "#e2f5ff" }} />
                  <Bar dataKey="current" name={job?.title || "Selected Job"} fill="#67e8f9" />
                  <Bar dataKey="compare" name={comparisonJob?.title || "Comparison Job"} fill="#818cf8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="font-display text-xl font-semibold">Recent Explainability History</h2>
        <div className="mt-4 space-y-2">
          {history.length ? (
            history.map((entry) => (
              <div key={entry.id} className="rounded-lg border border-white/15 bg-white/5 p-3 text-sm text-slate-200">
                <p className="font-semibold text-cyan-100">{entry.job_title}</p>
                <p className="text-xs text-slate-300">
                  Rank #{entry.rank} | Final {clampPercent(entry.final_score)}% | {new Date(entry.created_at).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-300">No backend history available yet.</p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}