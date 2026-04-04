import { useRef, useState } from "react";

export default function ResumeUpload({ onFileSelected }) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef(null);

  const selectFile = (file) => {
    if (!file) {
      return;
    }
    setFileName(file.name);
    onFileSelected(file);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const file = event.dataTransfer.files?.[0];
        selectFile(file);
      }}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={`cursor-pointer rounded-2xl border border-dashed p-5 text-center transition-colors ${
        dragging ? "border-sky-300 bg-sky-300/10" : "border-white/30 bg-white/5"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(event) => selectFile(event.target.files?.[0])}
      />

      <p className="text-sm text-slate-200">Drag and drop your resume PDF here</p>
      <p className="mt-1 text-xs text-slate-400">or click to choose a file</p>

      {fileName && (
        <p className="mt-3 truncate text-sm font-semibold text-cyan-200">Selected: {fileName}</p>
      )}
    </div>
  );
}
