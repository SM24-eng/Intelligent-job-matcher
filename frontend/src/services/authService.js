import api from "./api";

export async function loginUser(payload) {
  const response = await api.post("/login/", {
    username: payload.email,
    password: payload.password,
  });
  return response.data;
}

export async function signupUser(payload) {
  const response = await api.post("/register/", {
    username: payload.email,
    password: payload.password,
  });
  return response.data;
}

export async function matchJobs(payload) {
  const response = await api.post("/match/", payload);
  return response.data;
}

export async function analyzeResumeFile(file) {
  const formData = new FormData();
  formData.append("resume", file);

  const response = await api.post("/analyze_resume/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

export async function saveExplainabilityRecord(payload) {
  const response = await api.post("/explainability/save/", payload);
  return response.data;
}

export async function getExplainabilityHistory() {
  const response = await api.get("/explainability/history/");
  return response.data;
}
