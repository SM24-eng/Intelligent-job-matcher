from .utils import jobs_collection
from .ml.sentence_bert import calculate_similarity


def run_baseline_matching(resume_text):
    jobs = list(jobs_collection.find({}, {"_id": 0}))
    if not jobs:
        return []

    job_texts = [job.get("description", "") for job in jobs]
    semantic_scores = calculate_similarity(resume_text, job_texts)

    ranked = sorted(
        zip(jobs, semantic_scores),
        key=lambda x: float(x[1]),
        reverse=True,
    )

    seen = set()
    ranked_titles = []
    for job, _ in ranked:
        title = job.get("title", "")
        if title and title not in seen:
            seen.add(title)
            ranked_titles.append(title)

    return ranked_titles

