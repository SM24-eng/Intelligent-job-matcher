import re
from .skill_ontology import SKILL_ONTOLOGY


# -----------------------------
# Skill Alias Mapping
# -----------------------------
SKILL_ALIASES = {

    # AI / ML
    "machine learning": ["ml"],
    "deep learning": ["dl"],
    "natural language processing": ["nlp"],
    "computer vision": ["cv"],
    "artificial intelligence": ["ai"],

    # Frontend / JS
    "javascript": ["js", "reactjs"],
    
    # Backend
    "nodejs": ["node", "node.js"],
    "backend": ["server side", "api development"],
    "api": ["rest api", "restful api", "rest apis"],

    # DevOps
    "kubernetes": ["k8s"],
    "continuous integration": ["ci"],
    "continuous deployment": ["cd"],
    "devops": ["ci/cd", "docker", "kubernetes"],

    # Databases
    "postgresql": ["postgres"],
    "mongodb": ["mongo"],
    "database": ["nosql", "sql"],

    # DSA
    "algorithms": ["dsa", "data structures"],

}


# -----------------------------
# Normalize Text Using Aliases
# -----------------------------
def normalize_text(text):
    text = text.lower()

    for standard, aliases in SKILL_ALIASES.items():
        for alias in aliases:
            pattern = r'\b' + re.escape(alias) + r'\b'
            text = re.sub(pattern, standard, text)

    return text


# -----------------------------
# Match Whole Word Only
# -----------------------------
def contains_skill(text, skill):
    pattern = r'\b' + re.escape(skill) + r'\b'
    return re.search(pattern, text) is not None


# -----------------------------
# Extract Skills From Text
# -----------------------------
def extract_skills(text):
    text = normalize_text(text)
    found_skills = set()

    for category in SKILL_ONTOLOGY.values():
        for core_skill, related_skills in category.items():

            # Check core skill
            if contains_skill(text, core_skill):
                found_skills.add(core_skill)

            # Check related skills
            for skill in related_skills:
                if contains_skill(text, skill):
                    found_skills.add(skill)
                    found_skills.add(core_skill)

    return list(found_skills)


# -----------------------------
# Calculate Skill Match Score
# -----------------------------
def calculate_skill_match(resume_text, job_text):
    resume_skills = set(extract_skills(resume_text))
    job_skills = set(extract_skills(job_text))

    # If job has no skills detected
    if not job_skills:
        return 0.0, [], [], 0, 0

    matched = []
    missing = []

    total_weight = 0
    matched_weight = 0

    for category in SKILL_ONTOLOGY.values():
        for core_skill, related_skills in category.items():

            # Core skill (weight = 2)
            if core_skill in job_skills:
                total_weight += 2

                if core_skill in resume_skills:
                    matched.append(core_skill)
                    matched_weight += 2
                else:
                    missing.append(core_skill)

            # Related skills (weight = 1)
            for skill in related_skills:
                if skill in job_skills:
                    total_weight += 1

                    if skill in resume_skills:
                        matched.append(skill)
                        matched_weight += 1
                    else:
                        missing.append(skill)

    # If no weighted skills found
    if total_weight == 0:
        return 0.0, [], [], 0, 0

    score = matched_weight / total_weight

    return round(score, 3), matched, missing, total_weight, matched_weight
