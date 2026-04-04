from utils import jobs_collection
from ml.sentence_bert import calculate_similarity
from ml.skill_extractor import calculate_skill_match
from ml.experience_extractor import calculate_experience_score


def precision_at_k(predicted_titles, true_titles, k=5):
    predicted_k = predicted_titles[:k]
    relevant = 0

    for title in predicted_k:
        if title in true_titles:
            relevant += 1

    return relevant / k


def hybrid_score(semantic_score, skill_score, experience_score):
    return (
        0.4 * semantic_score +
        0.4 * skill_score +
        0.2 * experience_score
    )


def run_experiment():

    # ---------- Load Jobs ----------
    jobs = list(jobs_collection.find({}, {"_id": 0}))
    job_texts = [job.get("description", "") for job in jobs]
    job_titles = [job.get("title", "") for job in jobs]

    # ---------- Test Resumes ----------
    test_data = [
        {
            "resume": "Python developer with 3 years experience in Django, REST API and MongoDB.",
            "true_jobs": ["Python Developer", "Backend Developer"]
        },
        {
            "resume": "Data scientist with 2 years experience in machine learning, Python, Pandas and NumPy.",
            "true_jobs": ["Data Scientist"]
        }
    ]

    baseline_scores = []
    hybrid_scores = []

    for test in test_data:

        resume_text = test["resume"]
        true_jobs = test["true_jobs"]

        # -------- Baseline --------
        semantic_scores = calculate_similarity(resume_text, job_texts)

        baseline_ranked = sorted(
            zip(job_titles, semantic_scores),
            key=lambda x: x[1],
            reverse=True
        )

        baseline_titles = [title for title, _ in baseline_ranked]

        baseline_precision = precision_at_k(baseline_titles, true_jobs)
        baseline_scores.append(baseline_precision)

        # -------- Hybrid --------
        hybrid_results = []

        for job, semantic_score in zip(jobs, semantic_scores):

            job_description = job.get("description", "")

            skill_score, _, _ = calculate_skill_match(
                resume_text,
                job_description
            )

            experience_score = calculate_experience_score(
                resume_text,
                job_description
            )

            final_score = hybrid_score(
                float(semantic_score),
                skill_score,
                experience_score
            )

            hybrid_results.append((job["title"], final_score))

        hybrid_ranked = sorted(
            hybrid_results,
            key=lambda x: x[1],
            reverse=True
        )

        hybrid_titles = [title for title, _ in hybrid_ranked]

        hybrid_precision = precision_at_k(hybrid_titles, true_jobs)
        hybrid_scores.append(hybrid_precision)

    print("\nBaseline Precision@5:", sum(baseline_scores) / len(baseline_scores))
    print("Hybrid Precision@5:", sum(hybrid_scores) / len(hybrid_scores))


if __name__ == "__main__":
    run_experiment()
