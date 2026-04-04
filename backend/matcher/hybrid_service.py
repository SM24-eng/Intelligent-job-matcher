from .utils import jobs_collection, resumes_collection
from .ml.sentence_bert import calculate_similarity
from .ml.skill_extractor import calculate_skill_match, extract_skills
from .ml.experience_extractor import calculate_experience_score
import re


def _tokenize_text(text):
    return set(re.findall(r"[a-zA-Z0-9]+", (text or "").lower()))


def _title_overlap_score(resume_text, job_title):
    stopwords = {"and", "or", "the", "a", "an", "with", "for", "to", "of"}
    resume_tokens = _tokenize_text(resume_text)
    title_tokens = {t for t in _tokenize_text(job_title) if t not in stopwords}

    if not title_tokens:
        return 0.0

    overlap = len(resume_tokens & title_tokens)
    return overlap / len(title_tokens)


# ---------------- Remove Bias ----------------
def remove_bias_terms(text):
    bias_words = [
        "he", "she", "him", "her",
        "male", "female",
        "indian", "american",
        "nationality"
    ]

    for word in bias_words:
        pattern = r'\b' + word + r'\b'
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)

    return text


# ---------------- Dynamic Weighting ----------------
def dynamic_weighting(job_text):
    job_skills = extract_skills(job_text)
    num_skills = len(job_skills)
    word_count = len(job_text.split())

    # Increased role importance
    if num_skills >= 5:
        return 0.28, 0.42, 0.15, 0.15
    elif word_count > 300:
        return 0.45, 0.25, 0.15, 0.15
    else:
        return 0.30, 0.30, 0.20, 0.20


# ---------------- Hybrid Matching ----------------
def run_hybrid_matching(resume_text):

    resume_text = remove_bias_terms(resume_text)

    resumes_collection.insert_one({
        "resume_text": resume_text
    })

    jobs = list(jobs_collection.find({}, {"_id": 0}))

    if not jobs:
        return []

    job_texts = [job.get("description", "") for job in jobs]
    semantic_scores = calculate_similarity(resume_text, job_texts)

    min_sem = min(semantic_scores)
    max_sem = max(semantic_scores)

    if max_sem != min_sem:
        semantic_scores = [
            (s - min_sem) / (max_sem - min_sem)
            for s in semantic_scores
        ]
    else:
        semantic_scores = [0.5 for _ in semantic_scores]

    results = []

    for job, semantic_score in zip(jobs, semantic_scores):

        semantic_score = float(semantic_score)
        job_description = job.get("description", "")
        job_title = job.get("title", "")

        skill_score, matched_skills, missing_skills, total_weight, matched_weight = calculate_skill_match(
            resume_text,
            job_description
        )

        experience_score = calculate_experience_score(
            resume_text,
            job_description
        )

        # Role Intent Similarity
        if job_title:
            role_score = calculate_similarity(resume_text, [job_title])[0]
            role_score = float(role_score)
        else:
            role_score = 0.0

        title_overlap = _title_overlap_score(resume_text, job_title)
        phrase_match = job_title.lower() in resume_text.lower() if job_title else False
        role_score = max(role_score, title_overlap)

        # Clamp scores
        skill_score = max(0.0, min(skill_score, 1.0))
        experience_score = max(0.0, min(experience_score, 1.0))
        role_score = max(0.0, min(role_score, 1.0))

        semantic_w, skill_w, exp_w, role_w = dynamic_weighting(job_description)

        # Priority boost if required skills mentioned
        priority_words = ["must", "required", "mandatory"]

        if any(word in job_description.lower() for word in priority_words):
            skill_w += 0.1
            semantic_w -= 0.05
            role_w -= 0.05

        # Final score calculation
        weighted_score = (
            semantic_w * semantic_score +
            skill_w * skill_score +
            exp_w * experience_score +
            role_w * role_score
        )

        # Reward clear title intent in the resume text.
        title_bonus = 0.0
        if phrase_match:
            title_bonus += 0.35
        else:
            title_bonus += 0.05 * title_overlap

        weighted_score += title_bonus

        # Missing core skill penalty
        missing_core_weight = total_weight - matched_weight

        if total_weight > 0:
            penalty = (missing_core_weight / total_weight) * 0.08
        else:
            penalty = 0

        after_penalty_score = weighted_score - penalty

        # Penalize low role intent
        low_role_penalty_applied = role_score < 0.4
        final_score = after_penalty_score

        if role_score < 0.4:
            final_score *= 0.85

        final_score = max(0.0, min(final_score, 1.0))

        if final_score > 0.1:
            job["semantic_score"] = round(semantic_score, 3)
            job["skill_score"] = round(skill_score, 3)
            job["experience_score"] = round(experience_score, 3)
            job["role_score"] = round(role_score, 3)
            job["final_score"] = round(final_score, 3)
            job["weighted_score"] = round(weighted_score, 3)
            job["missing_core_penalty"] = round(penalty, 3)
            job["score_after_missing_penalty"] = round(after_penalty_score, 3)
            job["low_role_penalty_applied"] = low_role_penalty_applied
            job["matched_skills"] = matched_skills
            job["missing_skills"] = missing_skills
            job["semantic_weight"] = round(semantic_w, 2)
            job["skill_weight"] = round(skill_w, 2)
            job["experience_weight"] = round(exp_w, 2)
            job["role_weight"] = round(role_w, 2)

            results.append(job)

    # Sort by score
    results = sorted(results, key=lambda x: x["final_score"], reverse=True)

    # Remove duplicate titles
    unique_results = []
    seen_titles = set()

    for job in results:
        title = job.get("title", "").lower()
        if title not in seen_titles:
            unique_results.append(job)
            seen_titles.add(title)

    return unique_results[:5]