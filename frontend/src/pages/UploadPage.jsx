
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function UploadPage() {

  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleFile = (selectedFile) => {
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError("");
    } else {
      setError("Only PDF files are allowed.");
      setFile(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {

    if (!file) return;

    setLoading(true);
    setError("");

    try {

      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch("http://127.0.0.1:8000/analyze_resume/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      localStorage.setItem("analysis_history", JSON.stringify(data));

      if (!response.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      navigate("/dashboard", { state: { results: data } });

    } catch (err) {
      console.error("Upload Error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="min-h-screen flex items-center justify-center px-6
    bg-gradient-to-br from-slate-100 via-indigo-100 to-purple-100">

      <div className="w-full max-w-2xl p-12 rounded-2xl
      backdrop-blur-xl bg-white/60 border border-white/40 shadow-xl">

        <h1 className="text-4xl font-bold text-center mb-4
        bg-gradient-to-r from-indigo-600 to-purple-600
        text-transparent bg-clip-text">

          Upload Your Resume

        </h1>

        <p className="text-gray-600 text-center mb-10">
          Our hybrid AI analyzes your skills, experience and role alignment
          to recommend the most suitable job roles.
        </p>


        {/* UPLOAD AREA */}

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}

          onDragLeave={() => setDragActive(false)}

          onDrop={handleDrop}

          className={`p-12 text-center rounded-xl transition-all cursor-pointer
          border-2 border-dashed
          ${
            dragActive
              ? "border-indigo-500 bg-indigo-50"
              : "border-gray-300 hover:border-indigo-400"
          }`}
        >

          <input
            type="file"
            accept=".pdf"
            onChange={(e) => handleFile(e.target.files[0])}
            className="hidden"
            id="fileUpload"
          />

          <label htmlFor="fileUpload" className="cursor-pointer">

            <div className="space-y-4">

              <div className="text-5xl">📄</div>

              <p className="text-lg font-semibold text-gray-700">

                {file ? file.name : "Drag & drop your resume"}

              </p>

              <p className="text-sm text-gray-500">
                PDF format only
              </p>

            </div>

          </label>

        </div>


        {/* REMOVE FILE */}

        {file && (
          <button
            onClick={() => setFile(null)}
            className="mt-4 text-sm text-red-500 hover:underline"
          >
            Remove file
          </button>
        )}


        {/* ERROR */}

        {error && (
          <p className="mt-4 text-sm text-red-500 text-center">{error}</p>
        )}


        {/* SUBMIT BUTTON */}

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className={`mt-10 w-full py-4 rounded-xl text-lg font-medium transition
          ${
            !file || loading
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:scale-105 shadow-lg"
          }`}
        >

          {loading ? "Analyzing Resume..." : "Analyze Resume"}

        </button>

      </div>

    </div>
  );
}

