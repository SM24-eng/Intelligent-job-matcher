(function () {
  const API_PREFIX = "/api";
  const TOKEN_KEY = "ijm_token";
  const USER_KEY = "ijm_user";
  const ANALYSES_KEY = "ijm_analyses";
  const USERS_KEY = "ijm_users";
  const LAST_RESULTS_KEY = "ijm_last_results";

  const protectedPages = new Set([
    "analyzer",
    "results",
    "explainability",
    "dashboard",
    "analytics",
    "profile",
    "job_roles",
    "admin_dashboard",
    "admin_users",
    "admin_analyses",
  ]);

  const adminPages = new Set(["admin_dashboard", "admin_users", "admin_analyses"]);

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function getUser() {
    return safeJsonParse(localStorage.getItem(USER_KEY) || "null", null);
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function saveAuth(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function parseJwt(token) {
    if (!token || token.split(".").length < 2) {
      return null;
    }

    try {
      const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      return null;
    }
  }

  function getAnalyses() {
    return safeJsonParse(localStorage.getItem(ANALYSES_KEY) || "[]", []);
  }

  function setAnalyses(items) {
    localStorage.setItem(ANALYSES_KEY, JSON.stringify(items));
  }

  function getUsers() {
    return safeJsonParse(localStorage.getItem(USERS_KEY) || "[]", []);
  }

  function setUsers(items) {
    localStorage.setItem(USERS_KEY, JSON.stringify(items));
  }

  function normalizeScore(raw) {
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) {
      return 0;
    }
    return value > 1 ? Math.round(Math.min(100, value)) : Math.round(value * 100);
  }

  function normalizeWeight(raw) {
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) {
      return 0;
    }
    return value > 1 ? Math.round(Math.min(100, value)) : Math.round(value * 100);
  }

  function isAuthenticated() {
    return Boolean(getToken() && getUser());
  }

  function show(el) {
    if (el) {
      el.classList.remove("hidden");
    }
  }

  function hide(el) {
    if (el) {
      el.classList.add("hidden");
    }
  }

  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) {
      el.className = className;
    }
    if (typeof text === "string") {
      el.textContent = text;
    }
    return el;
  }

  async function apiFetch(path, options) {
    const opts = options || {};
    const headers = Object.assign({}, opts.headers || {});
    const hasFormData = typeof FormData !== "undefined" && opts.body instanceof FormData;

    if (!hasFormData && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const token = getToken();
    if (token) {
      headers.Authorization = "Bearer " + token;
    }

    const response = await fetch(API_PREFIX + path, {
      method: opts.method || "GET",
      headers: headers,
      body: opts.body,
    });

    const payload = await response.json().catch(function () {
      return {};
    });

    if (!response.ok) {
      const message = payload.error || payload.message || "Request failed";
      throw new Error(message);
    }

    return payload;
  }

  function setActiveNav() {
    const links = document.querySelectorAll("#top-nav a");
    const path = window.location.pathname;

    links.forEach(function (link) {
      const href = link.getAttribute("href");
      if (!href) {
        return;
      }

      if (href === "/" && path === "/") {
        link.classList.add("active");
      } else if (href !== "/" && path.startsWith(href)) {
        link.classList.add("active");
      }
    });
  }

  function initNavState() {
    const auth = isAuthenticated();
    const user = getUser();
    const guestItems = document.querySelectorAll("[data-guest-only='true']");
    const authItems = document.querySelectorAll("[data-auth-only='true']");
    const adminItems = document.querySelectorAll("[data-admin-only='true']");

    guestItems.forEach(function (item) {
      if (auth) {
        hide(item);
      } else {
        show(item);
      }
    });

    authItems.forEach(function (item) {
      if (auth) {
        show(item);
      } else {
        hide(item);
      }
    });

    adminItems.forEach(function (item) {
      if (auth && user && user.role === "admin") {
        show(item);
      } else {
        hide(item);
      }
    });

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        clearAuth();
        window.location.href = "/";
      });
    }

    setActiveNav();
  }

  function protectRoute(pageKey) {
    if (protectedPages.has(pageKey) && !isAuthenticated()) {
      window.location.href = "/login";
      return false;
    }

    const user = getUser();
    if (adminPages.has(pageKey) && (!user || user.role !== "admin")) {
      window.location.href = "/dashboard";
      return false;
    }

    if ((pageKey === "login" || pageKey === "signup") && isAuthenticated()) {
      window.location.href = "/dashboard";
      return false;
    }

    return true;
  }

  function getCurrentUserAnalyses() {
    const user = getUser();
    if (!user) {
      return Promise.resolve([]);
    }

    return apiFetch("/analyses/history/")
      .then(function (response) {
        if (!Array.isArray(response)) {
          return [];
        }

        return response.map(function (item) {
          return {
            id: item.id,
            userEmail: item.user_email || item.username || user.email,
            resumeSnippet: item.resume_snippet || "",
            recommendedJobs: item.recommended_jobs || [],
            analyzedAt: item.analyzed_at || item.created_at,
          };
        });
      })
      .catch(function () {
        return [];
      });
  }

  function renderError(containerId, message) {
    const target = document.getElementById(containerId);
    if (!target) {
      return;
    }
    if (!message) {
      target.textContent = "";
      hide(target);
      return;
    }
    target.textContent = message;
    show(target);
  }

  function initLogin() {
    const form = document.getElementById("login-form");
    if (!form) {
      return;
    }

    const submitBtn = document.getElementById("login-submit");

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      renderError("login-error", "");

      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;

      if (!email || !password) {
        renderError("login-error", "Email and password are required.");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Logging in...";

      try {
        const data = await apiFetch("/login/", {
          method: "POST",
          body: JSON.stringify({ username: email, password: password }),
        });

        const token = data.access || data.token;
        if (!token) {
          throw new Error("Authentication failed");
        }

        const payload = parseJwt(token) || {};
        const user = {
          name: email.includes("@") ? email.split("@")[0] : email,
          email: email,
          role: payload.role || "user",
        };

        saveAuth(token, user);
        window.location.href = user.role === "admin" ? "/admin" : "/dashboard";
      } catch (error) {
        renderError("login-error", error.message || "Invalid login credentials.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Login";
      }
    });
  }

  function initSignup() {
    const form = document.getElementById("signup-form");
    if (!form) {
      return;
    }

    const submitBtn = document.getElementById("signup-submit");

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      renderError("signup-error", "");

      const name = document.getElementById("signup-name").value.trim();
      const email = document.getElementById("signup-email").value.trim();
      const password = document.getElementById("signup-password").value;
      const confirm = document.getElementById("signup-confirm").value;

      if (password !== confirm) {
        renderError("signup-error", "Passwords do not match.");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Creating account...";

      try {
        await apiFetch("/register/", {
          method: "POST",
          body: JSON.stringify({ username: email, password: password }),
        });

        const users = getUsers();
        const role = email.toLowerCase().includes("admin") ? "admin" : "user";
        const nextUsers = [{ name: name || email, email: email, role: role }]
          .concat(users.filter(function (item) {
            return item.email !== email;
          }));

        setUsers(nextUsers);
        window.location.href = "/login";
      } catch (error) {
        renderError("signup-error", error.message || "Signup failed.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Sign Up";
      }
    });
  }

  function initAnalyzer() {
    const button = document.getElementById("analyze-btn");
    if (!button) {
      return;
    }

    button.addEventListener("click", async function () {
      renderError("analyzer-error", "");
      const resumeText = document.getElementById("resume-text").value.trim();
      const fileInput = document.getElementById("resume-file");
      const selectedFile = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

      if (!resumeText && !selectedFile) {
        renderError("analyzer-error", "Enter resume text or upload a PDF before analyzing.");
        return;
      }

      button.disabled = true;
      button.textContent = "Analyzing Resume...";

      try {
        let response;
        let resumeSnippet;

        if (selectedFile && !resumeText) {
          const formData = new FormData();
          formData.append("resume", selectedFile);
          response = await apiFetch("/analyze_resume/", { method: "POST", body: formData });
          resumeSnippet = "Uploaded resume file: " + selectedFile.name;
        } else {
          response = await apiFetch("/match/", {
            method: "POST",
            body: JSON.stringify({ resume_text: resumeText }),
          });
          resumeSnippet = resumeText.slice(0, 180);
        }

        const jobs = (Array.isArray(response) ? response : response.jobs || []).slice(0, 5);
        if (!jobs.length) {
          throw new Error("No matching jobs found. Check that jobs are loaded in backend MongoDB.");
        }

        sessionStorage.setItem(LAST_RESULTS_KEY, JSON.stringify({ jobs: jobs, resumeSnippet: resumeSnippet }));

        const user = getUser();
        const analyzedAt = new Date().toISOString();

        await apiFetch("/analyses/save/", {
          method: "POST",
          body: JSON.stringify({
            user_email: user ? user.email : "unknown",
            resume_snippet: resumeSnippet,
            recommended_jobs: jobs,
            analyzed_at: analyzedAt,
          }),
        });

        const all = getAnalyses();
        const entry = {
          id: Date.now(),
          userEmail: user ? user.email : "unknown",
          resumeSnippet: resumeSnippet,
          recommendedJobs: jobs,
          analyzedAt: analyzedAt,
        };
        setAnalyses([entry].concat(all));

        window.location.href = "/results";
      } catch (error) {
        renderError("analyzer-error", error.message || "Resume analysis failed. Please retry.");
      } finally {
        button.disabled = false;
        button.textContent = "Analyze Resume";
      }
    });
  }

  async function getResultPayload() {
    const fromSession = safeJsonParse(sessionStorage.getItem(LAST_RESULTS_KEY) || "null", null);
    if (fromSession && Array.isArray(fromSession.jobs) && fromSession.jobs.length) {
      return fromSession;
    }

    const analyses = await getCurrentUserAnalyses();
    if (!analyses.length) {
      return null;
    }

    const latest = analyses[0];
    return {
      jobs: Array.isArray(latest.recommendedJobs) ? latest.recommendedJobs.slice(0, 5) : [],
      resumeSnippet: latest.resumeSnippet || "",
    };
  }

  function createJobCard(job, rank, resumeSnippet, allJobs) {
    const final = normalizeScore(job.final_score || job.score || job.semantic_score || 0);
    const semantic = normalizeScore(job.semantic_score);
    const skill = normalizeScore(job.skill_score);
    const experience = normalizeScore(job.experience_score);
    const role = normalizeScore(job.role_score);

    const card = createEl("article", "glass-card job-card");

    const meta = createEl("div", "job-meta");
    meta.appendChild(createEl("span", "", "Rank #" + rank));
    meta.appendChild(createEl("span", "score-pill", final + "% Match"));

    const title = createEl("h3", "", job.title || "Untitled Role");

    const progress = createEl("div", "progress");
    const inner = createEl("span");
    inner.style.width = final + "%";
    progress.appendChild(inner);

    const summary = createEl(
      "p",
      "muted",
      "Selection summary: skill fit " +
        skill +
        "%, semantic fit " +
        semantic +
        "%, experience " +
        experience +
        "%, role intent " +
        role +
        "%."
    );

    const explainLink = createEl("a", "subtle-btn inline", "Explain This Match");
    explainLink.href = "/explainability?job=" + encodeURIComponent(rank - 1);

    const details = createEl("details", "");
    const summaryTag = createEl("summary", "", "Show explainability details");
    const detailsBody = createEl(
      "p",
      "muted",
      "Final formula combines semantic, skill, experience and role weights, then applies penalties for missing core skills and low role intent."
    );
    details.appendChild(summaryTag);
    details.appendChild(detailsBody);

    card.appendChild(meta);
    card.appendChild(title);
    card.appendChild(progress);
    card.appendChild(summary);
    card.appendChild(explainLink);
    card.appendChild(details);

    return card;
  }

  async function initResults() {
    const grid = document.getElementById("results-grid");
    if (!grid) {
      return;
    }

    const payload = await getResultPayload();
    if (!payload || !payload.jobs || !payload.jobs.length) {
      show(document.getElementById("results-empty"));
      return;
    }

    hide(document.getElementById("results-empty"));
    grid.innerHTML = "";

    payload.jobs.forEach(function (job, index) {
      grid.appendChild(createJobCard(job, index + 1, payload.resumeSnippet || "", payload.jobs));
    });
  }

  function buildNarrative(semantic, skill, experience, role, missingCount) {
    const list = [];

    if (skill >= 70) {
      list.push("Strong skill overlap with the job requirements drove this recommendation.");
    } else if (skill >= 45) {
      list.push("Moderate skill overlap was detected, with room to improve role readiness.");
    } else {
      list.push("Skill overlap is limited, so recommendation relied more on semantic and intent signals.");
    }

    if (semantic >= 70) {
      list.push("Your resume language is semantically close to this role's responsibilities.");
    } else {
      list.push("Semantic similarity contributed, but was not the dominant factor.");
    }

    if (experience >= 65) {
      list.push("Experience alignment is high and matches expected seniority.");
    } else {
      list.push("Experience fit is moderate, which reduced overall confidence score.");
    }

    if (role < 40) {
      list.push("Role intent was low, so a role-intent penalty lowered the final score.");
    }

    if (missingCount > 0) {
      list.push("Missing core skills were identified and transparently penalized.");
    } else {
      list.push("No major core-skill gaps were found, preserving final score.");
    }

    return list;
  }

  async function initExplainability() {
    const empty = document.getElementById("explain-empty");
    const content = document.getElementById("explain-content");
    if (!empty || !content) {
      return;
    }

    const payload = await getResultPayload();
    if (!payload || !payload.jobs || !payload.jobs.length) {
      show(empty);
      hide(content);
      return;
    }

    hide(empty);
    show(content);

    const query = new URLSearchParams(window.location.search);
    const index = Number(query.get("job") || "0");
    const selectedIndex = Number.isFinite(index) ? Math.max(0, Math.min(index, payload.jobs.length - 1)) : 0;
    const job = payload.jobs[selectedIndex] || payload.jobs[0];
    const rank = selectedIndex + 1;

    const title = job.title || "Untitled Role";
    const finalScore = normalizeScore(job.final_score || job.score || job.semantic_score);
    const semantic = normalizeScore(job.semantic_score);
    const skill = normalizeScore(job.skill_score);
    const experience = normalizeScore(job.experience_score);
    const role = normalizeScore(job.role_score);

    const semanticWeight = normalizeWeight(job.semantic_weight);
    const skillWeight = normalizeWeight(job.skill_weight);
    const experienceWeight = normalizeWeight(job.experience_weight);
    const roleWeight = normalizeWeight(job.role_weight);

    const weightedScore = normalizeScore(job.weighted_score);
    const missingPenalty = normalizeScore(job.missing_core_penalty);
    const afterPenalty = normalizeScore(job.score_after_missing_penalty);
    const rolePenalty = Boolean(job.low_role_penalty_applied);

    const matchedSkills = Array.isArray(job.matched_skills) ? job.matched_skills : [];
    const missingSkills = Array.isArray(job.missing_skills) ? job.missing_skills : [];
    const narrative = buildNarrative(semantic, skill, experience, role, missingSkills.length);

    const subtitle =
      "Rank #" + rank +
      " with final match score " + finalScore + "%" +
      (payload.resumeSnippet ? " | Resume context: " + payload.resumeSnippet : "");

    document.getElementById("explain-title").textContent = "Why " + title + " was selected";
    document.getElementById("explain-subtitle").textContent = subtitle;

    const narrativeList = document.getElementById("narrative-list");
    narrativeList.innerHTML = "";
    narrative.forEach(function (line) {
      const item = createEl("p", "stat-card", line);
      narrativeList.appendChild(item);
    });

    const pipelineGrid = document.getElementById("pipeline-grid");
    pipelineGrid.innerHTML = "";
    [
      ["Weighted Score", weightedScore + "%"],
      ["Missing Skill Penalty", "-" + missingPenalty + "%"],
      ["After Penalty", afterPenalty + "%"],
      ["Role Penalty Applied", rolePenalty ? "Yes (x85%)" : "No"],
    ].forEach(function (pair) {
      const card = createEl("div", "stat-card");
      card.appendChild(createEl("p", "muted", pair[0]));
      card.appendChild(createEl("p", "stat-value small", pair[1]));
      pipelineGrid.appendChild(card);
    });

    const matchedWrap = document.getElementById("matched-skills");
    const missingWrap = document.getElementById("missing-skills");
    matchedWrap.innerHTML = "";
    missingWrap.innerHTML = "";

    if (!matchedSkills.length) {
      matchedWrap.appendChild(createEl("span", "muted", "No direct skill overlap detected."));
    }

    if (!missingSkills.length) {
      missingWrap.appendChild(createEl("span", "muted", "No major core-skill gaps detected."));
    }

    matchedSkills.forEach(function (skillName) {
      matchedWrap.appendChild(createEl("span", "skill-chip match", skillName));
    });

    missingSkills.forEach(function (skillName) {
      missingWrap.appendChild(createEl("span", "skill-chip missing", skillName));
    });

    const factorCtx = document.getElementById("factor-chart");
    if (factorCtx && window.Chart) {
      new Chart(factorCtx, {
        type: "bar",
        data: {
          labels: ["Semantic", "Skill", "Experience", "Role Intent"],
          datasets: [
            {
              label: "Contribution %",
              data: [
                Math.round((semanticWeight * semantic) / 100),
                Math.round((skillWeight * skill) / 100),
                Math.round((experienceWeight * experience) / 100),
                Math.round((roleWeight * role) / 100),
              ],
              backgroundColor: ["#22d3ee", "#34d399", "#fbbf24", "#c4b5fd"],
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { labels: { color: "#dbeafe" } } },
          scales: {
            x: { ticks: { color: "#dbeafe" } },
            y: { ticks: { color: "#dbeafe" }, beginAtZero: true, max: 100 },
          },
        },
      });
    }

    const compareSelect = document.getElementById("compare-job");
    const comparisonCanvas = document.getElementById("comparison-chart");
    const candidateJobs = payload.jobs.filter(function (item, idx) {
      return idx !== selectedIndex;
    });

    function drawComparison(candidate) {
      if (!comparisonCanvas || !window.Chart || !candidate) {
        return;
      }

      new Chart(comparisonCanvas, {
        type: "bar",
        data: {
          labels: ["Semantic", "Skill", "Experience", "Role Intent"],
          datasets: [
            {
              label: title,
              data: [semantic, skill, experience, role],
              backgroundColor: "#67e8f9",
            },
            {
              label: candidate.title || "Comparison Job",
              data: [
                normalizeScore(candidate.semantic_score),
                normalizeScore(candidate.skill_score),
                normalizeScore(candidate.experience_score),
                normalizeScore(candidate.role_score),
              ],
              backgroundColor: "#818cf8",
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { labels: { color: "#dbeafe" } } },
          scales: {
            x: { ticks: { color: "#dbeafe" } },
            y: { ticks: { color: "#dbeafe" }, beginAtZero: true, max: 100 },
          },
        },
      });
    }

    if (!candidateJobs.length) {
      compareSelect.innerHTML = "<option>No alternate jobs in this result set</option>";
      compareSelect.disabled = true;
    } else {
      compareSelect.innerHTML = "";
      candidateJobs.forEach(function (item, idx) {
        const option = createEl("option", "", item.title || "Untitled Role");
        option.value = String(idx);
        compareSelect.appendChild(option);
      });

      drawComparison(candidateJobs[0]);
      compareSelect.addEventListener("change", function () {
        const idx = Number(compareSelect.value || "0");
        const selected = candidateJobs[Math.max(0, Math.min(idx, candidateJobs.length - 1))];
        drawComparison(selected);
      });
    }

    const saveStatus = document.getElementById("explain-save-status");
    const recordKey = title + "-" + rank + "-" + finalScore;
    const savedFlag = sessionStorage.getItem("ijm_explainability_saved_" + recordKey);

    async function saveAndFetchHistory() {
      try {
        if (!savedFlag) {
          saveStatus.textContent = "Persistence: Saving to backend...";
          await apiFetch("/explainability/save/", {
            method: "POST",
            body: JSON.stringify({
              job_title: title,
              rank: rank,
              final_score: finalScore / 100,
              semantic_score: semantic / 100,
              skill_score: skill / 100,
              experience_score: experience / 100,
              role_score: role / 100,
              matched_skills: matchedSkills,
              missing_skills: missingSkills,
              model_weights: {
                semantic: semanticWeight / 100,
                skill: skillWeight / 100,
                experience: experienceWeight / 100,
                role: roleWeight / 100,
              },
              narrative: narrative,
            }),
          });
          sessionStorage.setItem("ijm_explainability_saved_" + recordKey, "1");
        }
        saveStatus.textContent = "Persistence: Saved to backend";
      } catch (error) {
        saveStatus.textContent = "Persistence: Local only (offline)";
      }

      const historyList = document.getElementById("history-list");
      historyList.innerHTML = "";
      try {
        const history = await apiFetch("/explainability/history/");
        if (!Array.isArray(history) || !history.length) {
          historyList.appendChild(createEl("p", "muted", "No backend history available yet."));
          return;
        }

        history.slice(0, 5).forEach(function (entry) {
          const item = createEl("div", "stat-card");
          item.appendChild(createEl("p", "", entry.job_title || "Untitled Role"));
          const stamp = new Date(entry.created_at || Date.now()).toLocaleString();
          item.appendChild(
            createEl(
              "p",
              "muted",
              "Rank #" +
                (entry.rank || "-") +
                " | Final " +
                normalizeScore(entry.final_score) +
                "% | " +
                stamp
            )
          );
          historyList.appendChild(item);
        });
      } catch (error) {
        historyList.appendChild(createEl("p", "muted", "No backend history available yet."));
      }
    }

    saveAndFetchHistory();

    const reportButton = document.getElementById("download-report");
    if (reportButton) {
      reportButton.addEventListener("click", function () {
        if (!window.jspdf || !window.jspdf.jsPDF) {
          return;
        }

        try {
          const jsPDF = window.jspdf.jsPDF;
          const doc = new jsPDF();
          const lines = [
            "Intelligent Job Matcher - Explainability Report",
            "",
            "Role: " + title,
            "Rank: #" + rank,
            "Final Score: " + finalScore + "%",
            "",
            "Factor Scores:",
            "Semantic: " + semantic + "% (weight " + semanticWeight + "%)",
            "Skill: " + skill + "% (weight " + skillWeight + "%)",
            "Experience: " + experience + "% (weight " + experienceWeight + "%)",
            "Role Intent: " + role + "% (weight " + roleWeight + "%)",
            "",
            "Narrative:",
          ].concat(narrative.map(function (line) {
            return "- " + line;
          }));

          doc.setFontSize(11);
          doc.text(lines, 14, 18);

          const safeTitle = title.replace(/[^a-zA-Z0-9-_]+/g, "_") || "job";
          const fileName = "explainability_" + safeTitle + ".pdf";
          const pdfBlob = doc.output("blob");
          const blobUrl = URL.createObjectURL(pdfBlob);
          const downloadLink = document.createElement("a");
          downloadLink.href = blobUrl;
          downloadLink.download = fileName;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          setTimeout(function () {
            URL.revokeObjectURL(blobUrl);
          }, 1000);
        } catch (error) {
          console.error("PDF download failed", error);
        }
      });
    }
  }

  async function initDashboard() {
    const title = document.getElementById("dashboard-title");
    if (!title) {
      return;
    }

    const user = getUser() || { email: "", name: "User" };
    const history = await getCurrentUserAnalyses();
    const jobs = history.flatMap(function (item) {
      return Array.isArray(item.recommendedJobs) ? item.recommendedJobs : [];
    });

    const avg = jobs.length
      ? Math.round(
          jobs.reduce(function (sum, job) {
            return sum + normalizeScore(job.final_score || job.score || job.semantic_score);
          }, 0) / jobs.length
        )
      : 0;

    title.textContent = "Welcome, " + (user.name || "User");
    document.getElementById("stat-analyses").textContent = String(history.length);
    document.getElementById("stat-avg-score").textContent = avg + "%";
    document.getElementById("stat-jobs").textContent = String(jobs.length);

    const historyWrap = document.getElementById("dashboard-history");
    historyWrap.innerHTML = "";

    if (!history.length) {
      historyWrap.appendChild(createEl("p", "muted", "No analysis history found yet."));
      return;
    }

    history.forEach(function (entry) {
      const card = createEl("div", "stat-card");
      card.appendChild(createEl("p", "", (entry.resumeSnippet || "").slice(0, 180) + "..."));
      card.appendChild(createEl("p", "muted", new Date(entry.analyzedAt || Date.now()).toLocaleString()));

      const chipWrap = createEl("div", "chip-wrap");
      (entry.recommendedJobs || []).forEach(function (job) {
        chipWrap.appendChild(createEl("span", "skill-chip match", job.title || "Untitled Role"));
      });

      card.appendChild(chipWrap);
      historyWrap.appendChild(card);
    });
  }

  function buildAnalyticsData(analyses) {
    const trendMap = new Map();
    const roleMap = new Map();

    analyses.forEach(function (analysis) {
      const date = new Date(analysis.analyzedAt || Date.now()).toLocaleDateString();
      trendMap.set(date, (trendMap.get(date) || 0) + 1);

      (analysis.recommendedJobs || []).forEach(function (job) {
        const role = job.title || "Unknown Role";
        const score = normalizeScore(job.final_score || job.score || job.semantic_score);
        const existing = roleMap.get(role) || { role: role, count: 0, scoreTotal: 0 };

        roleMap.set(role, {
          role: role,
          count: existing.count + 1,
          scoreTotal: existing.scoreTotal + score,
        });
      });
    });

    const trendData = Array.from(trendMap.entries()).map(function (entry) {
      return { date: entry[0], count: entry[1] };
    });

    const rankedRoles = Array.from(roleMap.values()).sort(function (a, b) {
      return b.count - a.count;
    });

    const pie = rankedRoles.slice(0, 6).map(function (item) {
      return { label: item.role, value: item.count };
    });

    const bar = rankedRoles.slice(0, 6).map(function (item) {
      return {
        label: item.role,
        value: Math.round(item.scoreTotal / Math.max(1, item.count)),
      };
    });

    return { trendData: trendData, pieData: pie, barData: bar };
  }

  async function initAnalytics() {
    const empty = document.getElementById("analytics-empty");
    const content = document.getElementById("analytics-content");
    if (!empty || !content) {
      return;
    }

    const analyses = await getCurrentUserAnalyses();
    if (!analyses.length) {
      show(empty);
      hide(content);
      return;
    }

    hide(empty);
    show(content);

    const data = buildAnalyticsData(analyses);
    if (!window.Chart) {
      return;
    }

    const trendCanvas = document.getElementById("trend-chart");
    const roleCanvas = document.getElementById("role-chart");
    const qualityCanvas = document.getElementById("quality-chart");

    new Chart(trendCanvas, {
      type: "line",
      data: {
        labels: data.trendData.map(function (item) {
          return item.date;
        }),
        datasets: [
          {
            label: "Analyses",
            data: data.trendData.map(function (item) {
              return item.count;
            }),
            borderColor: "#67e8f9",
            backgroundColor: "rgba(103, 232, 249, 0.25)",
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        plugins: { legend: { labels: { color: "#dbeafe" } } },
        scales: {
          x: { ticks: { color: "#dbeafe" } },
          y: { ticks: { color: "#dbeafe" }, beginAtZero: true },
        },
      },
    });

    new Chart(roleCanvas, {
      type: "pie",
      data: {
        labels: data.pieData.map(function (item) {
          return item.label;
        }),
        datasets: [
          {
            data: data.pieData.map(function (item) {
              return item.value;
            }),
            backgroundColor: ["#38bdf8", "#67e8f9", "#818cf8", "#22d3ee", "#0ea5e9", "#14b8a6"],
          },
        ],
      },
      options: {
        plugins: { legend: { labels: { color: "#dbeafe" } } },
      },
    });

    new Chart(qualityCanvas, {
      type: "bar",
      data: {
        labels: data.barData.map(function (item) {
          return item.label;
        }),
        datasets: [
          {
            label: "Average Score",
            data: data.barData.map(function (item) {
              return item.value;
            }),
            backgroundColor: "#22d3ee",
          },
        ],
      },
      options: {
        plugins: { legend: { labels: { color: "#dbeafe" } } },
        scales: {
          x: { ticks: { color: "#dbeafe" } },
          y: { ticks: { color: "#dbeafe" }, beginAtZero: true, max: 100 },
        },
      },
    });
  }

  async function initProfile() {
    const name = document.getElementById("profile-name");
    if (!name) {
      return;
    }

    const user = getUser() || { name: "User", email: "" };
    const history = await getCurrentUserAnalyses();
    const jobs = history.flatMap(function (entry) {
      return Array.isArray(entry.recommendedJobs) ? entry.recommendedJobs : [];
    });

    const best = jobs.reduce(function (max, job) {
      return Math.max(max, normalizeScore(job.final_score || job.score || job.semantic_score));
    }, 0);

    const roleCounter = {};
    jobs.forEach(function (job) {
      const role = job.title || "Unknown Role";
      roleCounter[role] = (roleCounter[role] || 0) + 1;
    });

    const topRole = Object.entries(roleCounter).sort(function (a, b) {
      return b[1] - a[1];
    })[0];

    name.textContent = user.name || "User";
    document.getElementById("profile-email").textContent = user.email || "No email";
    document.getElementById("profile-analyses").textContent = String(history.length);
    document.getElementById("profile-top-role").textContent = topRole ? topRole[0] : "No recommendations yet";
    document.getElementById("profile-best-score").textContent = best + "%";

    const historyWrap = document.getElementById("profile-history");
    historyWrap.innerHTML = "";

    if (!history.length) {
      historyWrap.appendChild(createEl("p", "muted", "No history available yet."));
      return;
    }

    history.slice(0, 5).forEach(function (entry) {
      const card = createEl("div", "stat-card");
      card.appendChild(createEl("p", "", (entry.resumeSnippet || "").slice(0, 180) + "..."));
      card.appendChild(createEl("p", "muted", new Date(entry.analyzedAt || Date.now()).toLocaleString()));
      historyWrap.appendChild(card);
    });
  }

  async function initAdminDashboard() {
    const usersEl = document.getElementById("admin-total-users");
    if (!usersEl) {
      return;
    }

    const users = await apiFetch("/admin/users/").catch(function () {
      return [];
    });
    const analyses = await apiFetch("/admin/analyses/").catch(function () {
      return [];
    });

    usersEl.textContent = String(users.length);
    document.getElementById("admin-total-analyses").textContent = String(analyses.length);

    const recentWrap = document.getElementById("admin-recent");
    recentWrap.innerHTML = "";

    if (!analyses.length) {
      recentWrap.appendChild(createEl("p", "muted", "No recent analyses yet."));
      return;
    }

    analyses.slice(0, 5).forEach(function (item) {
      const card = createEl("div", "stat-card");
      card.appendChild(createEl("p", "", item.user_email || item.username || "Unknown user"));
      card.appendChild(createEl("p", "muted", new Date(item.analyzed_at || item.created_at || Date.now()).toLocaleString()));
      recentWrap.appendChild(card);
    });
  }

  async function initAdminUsers() {
    const list = document.getElementById("admin-users-list");
    if (!list) {
      return;
    }

    async function render() {
      const users = await apiFetch("/admin/users/").catch(function () {
        return [];
      });

      users.sort(function (a, b) {
        return (a.email || "").localeCompare(b.email || "");
      });

      list.innerHTML = "";

      if (!users.length) {
        list.appendChild(createEl("p", "muted", "No users found."));
        return;
      }

      users.forEach(function (user) {
        const row = createEl("div", "stat-card row space-between wrap gap");
        const left = createEl("div", "");
        left.appendChild(createEl("p", "", user.name || "Unnamed User"));
        left.appendChild(createEl("p", "muted", user.email || "No email"));

        const button = createEl("button", "subtle-btn", "Delete User");
        button.type = "button";
        button.addEventListener("click", async function () {
          await apiFetch("/admin/users/" + encodeURIComponent(user.username || user.email) + "/", {
            method: "DELETE",
          }).catch(function () {
            return null;
          });

          render();
        });

        row.appendChild(left);
        row.appendChild(button);
        list.appendChild(row);
      });
    }

    render();
  }

  async function initAdminAnalyses() {
    const list = document.getElementById("admin-analyses-list");
    if (!list) {
      return;
    }

    const analyses = await apiFetch("/admin/analyses/").catch(function () {
      return [];
    });
    list.innerHTML = "";

    if (!analyses.length) {
      list.appendChild(createEl("p", "muted", "No analyses are available yet."));
      return;
    }

    analyses.forEach(function (entry) {
      const card = createEl("div", "stat-card");
      const stamp = new Date(entry.analyzed_at || entry.created_at || Date.now()).toLocaleString();
      card.appendChild(createEl("p", "", (entry.user_email || entry.username || "Unknown") + " | " + stamp));
      card.appendChild(createEl("p", "muted", (entry.resume_snippet || "").slice(0, 180) + "..."));

      const chips = createEl("div", "chip-wrap");
      (entry.recommended_jobs || []).forEach(function (job) {
        const score = normalizeScore(job.score || job.final_score || job.semantic_score);
        chips.appendChild(createEl("span", "skill-chip match", (job.title || "Role") + " (" + score + "%)"));
      });

      card.appendChild(chips);
      list.appendChild(card);
    });
  }

  async function initJobRoles() {
    const form = document.getElementById("job-role-form");
    const input = document.getElementById("job-role-name");
    const errorBox = document.getElementById("job-role-error");
    const list = document.getElementById("job-roles-list");
    const countLabel = document.getElementById("job-roles-count");

    if (!list) {
      return;
    }

    function setError(message) {
      if (!errorBox) {
        return;
      }
      if (!message) {
        errorBox.textContent = "";
        hide(errorBox);
        return;
      }
      errorBox.textContent = message;
      show(errorBox);
    }

    function renderRoles(roles) {
      list.innerHTML = "";

      if (!roles.length) {
        list.appendChild(createEl("p", "muted", "No roles found in database yet."));
      } else {
        roles.forEach(function (role) {
          const row = createEl("div", "stat-card row space-between wrap gap");
          row.appendChild(createEl("span", "", role));

          const button = createEl("button", "subtle-btn", "Delete");
          button.type = "button";
          button.addEventListener("click", async function () {
            try {
              await apiFetch("/job-roles/" + encodeURIComponent(role) + "/", {
                method: "DELETE",
              });
              await refreshRoles();
            } catch (error) {
              setError(error.message || "Failed to delete role.");
            }
          });

          row.appendChild(button);
          list.appendChild(row);
        });
      }

      if (countLabel) {
        countLabel.textContent = "Distinct roles available in database: " + roles.length;
      }
    }

    async function refreshRoles() {
      setError("");
      try {
        const data = await apiFetch("/job-roles/");
        const roles = Array.isArray(data.roles) ? data.roles : [];
        renderRoles(roles);
      } catch (error) {
        setError(error.message || "Failed to load roles.");
      }
    }

    if (form) {
      form.addEventListener("submit", async function (event) {
        event.preventDefault();
        setError("");

        const name = (input && input.value ? input.value : "").trim();
        if (!name) {
          setError("Role name is required.");
          return;
        }

        try {
          await apiFetch("/job-roles/add/", {
            method: "POST",
            body: JSON.stringify({ name: name }),
          });

          if (input) {
            input.value = "";
          }

          await refreshRoles();
        } catch (error) {
          setError(error.message || "Failed to add role.");
        }
      });
    }

    await refreshRoles();
  }

  document.addEventListener("DOMContentLoaded", function () {
    const page = document.body.getAttribute("data-page") || "";

    initNavState();
    if (!protectRoute(page)) {
      return;
    }

    if (page === "login") {
      initLogin();
    }
    if (page === "signup") {
      initSignup();
    }
    if (page === "analyzer") {
      initAnalyzer();
    }
    if (page === "results") {
      initResults();
    }
    if (page === "explainability") {
      initExplainability();
    }
    if (page === "dashboard") {
      initDashboard();
    }
    if (page === "analytics") {
      initAnalytics();
    }
    if (page === "profile") {
      initProfile();
    }
    if (page === "admin_dashboard") {
      initAdminDashboard();
    }
    if (page === "admin_users") {
      initAdminUsers();
    }
    if (page === "admin_analyses") {
      initAdminAnalyses();
    }
    if (page === "job_roles") {
      initJobRoles();
    }
  });
})();
