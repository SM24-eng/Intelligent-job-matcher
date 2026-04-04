import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/GlassCard.jsx";
import ResumeUpload from "../components/ResumeUpload.jsx";
import { analyzeResumeFile, matchJobs } from "../services/authService";
import { useAuth } from "../context/AuthContext.jsx";

export default function AnalyzerPage() {
  const [resumeText, setResumeText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { addAnalysis } = useAuth();
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    setError("");
    if (!resumeText.trim() && !selectedFile) {
      setError("Enter resume text or upload a PDF before analyzing.");
      return;
    }

    setLoading(true);

    try {
      let response;
      let resumeSnippet;

      if (selectedFile && !resumeText.trim()) {
        response = await analyzeResumeFile(selectedFile);
        resumeSnippet = `Uploaded resume file: ${selectedFile.name}`;
      } else {
        const payload = { resume_text: resumeText.trim() };
        response = await matchJobs(payload);
        resumeSnippet = payload.resume_text.slice(0, 180);
      }

      const jobs = (Array.isArray(response) ? response : response?.jobs || []).slice(0, 5);

      if (!jobs.length) {
        setError("No matching jobs found. Check that jobs are loaded in backend MongoDB.");
        return;
      }

      addAnalysis({
        resumeSnippet,
        recommendedJobs: jobs,
        analyzedAt: new Date().toISOString(),
      });

      navigate("/results", { state: { jobs, resumeSnippet } });
    } catch (requestError) {
      const serverError = requestError?.response?.data?.error || requestError?.response?.data?.message;
      setError(serverError || "Resume analysis failed. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter mx-auto max-w-4xl">
      <GlassCard className="p-6 sm:p-8">
        <h1 className="font-display text-3xl font-semibold">Resume Analyzer</h1>
        <p className="mt-2 text-sm text-slate-300">
          Paste your resume or upload a PDF. Our hybrid AI model will rank the top matching roles.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="resume-text" className="mb-1 block text-sm text-slate-200">
              Resume Text
            </label>
            <textarea
              id="resume-text"
              rows={8}
              className="soft-input resize-y p-3"
              placeholder="Example: Python developer with Django and machine learning experience..."
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
            />
          </div>

          <ResumeUpload onFileSelected={setSelectedFile} />

          {error && <p className="rounded-xl border border-rose-200/30 bg-rose-300/15 px-3 py-2 text-sm text-rose-200">{error}</p>}

          <button type="button" className="cta-btn w-full px-4 py-3" disabled={loading} onClick={handleAnalyze}>
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                Analyzing Resume...
              </span>
            ) : (
              "Analyze Resume"
            )}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
