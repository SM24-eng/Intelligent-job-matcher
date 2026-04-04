from matcher.hybrid_service import run_hybrid_matching
from matcher.baseline_service import run_baseline_matching
from matcher.evaluation import (
    precision_at_k,
    recall_at_k,
    mean_average_precision,
    ndcg_at_k,
)

# ---------------------------------------
# Ranking Function (Hybrid Model)
# ---------------------------------------

def rank_jobs_hybrid(resume_text):

    # Keep text normalized before matching.
    enriched_text = resume_text.lower()

    hybrid_jobs = run_hybrid_matching(enriched_text)

    seen = set()
    unique_titles = []

    for job in hybrid_jobs:
        title = job["title"]
        if title not in seen:
            seen.add(title)
            unique_titles.append(title)

    return unique_titles


# ---------------------------------------
# Ranking Function (Baseline Model)
# ---------------------------------------

def rank_jobs_baseline(resume_text):
    return run_baseline_matching(resume_text)

# ---------------------------------------
# Test Dataset
# ---------------------------------------

test_cases = [
    {
        "resume": "React developer with JavaScript and frontend UI experience",
        "relevant_jobs": ["Frontend Developer"],
    },
    {
        "resume": "Python Django backend developer building REST APIs",
        "relevant_jobs": ["Backend Developer"],
    },
    {
        "resume": "Machine learning engineer with deep learning and NLP",
        "relevant_jobs": ["Machine Learning Engineer"],
    },
    {
        "resume": "Cloud and DevOps engineer with AWS Docker Kubernetes",
        "relevant_jobs": ["DevOps Engineer"],
    },
    {
        "resume": "Android developer with Java and Kotlin mobile apps",
        "relevant_jobs": ["Android Developer"],
    },
    {
        "resume": "Data scientist working with pandas numpy and ML models",
        "relevant_jobs": ["Data Scientist"],
    },
    {
        "resume": "Frontend engineer working with React but also basic Python",
        "relevant_jobs": ["Frontend Developer"],
    },
    {
        "resume": "Backend developer with Java Spring Boot microservices",
        "relevant_jobs": ["Backend Developer"],
    },
]

# ---------------------------------------
# Store predictions for final metrics
# ---------------------------------------

hybrid_predictions_all = []
baseline_predictions_all = []
all_true_labels = []

# ---------------------------------------
# Run Evaluation
# ---------------------------------------

for case in test_cases:
    resume = case["resume"]
    true_labels = case["relevant_jobs"]

    # Hybrid predictions
    hybrid_titles = rank_jobs_hybrid(resume)

    # Baseline predictions
    baseline_titles = rank_jobs_baseline(resume)

    hybrid_predictions_all.append(hybrid_titles)
    baseline_predictions_all.append(baseline_titles)
    all_true_labels.append(true_labels)

    print("\n====================================")
    print("Resume:", resume)
    print("Relevant Jobs:", true_labels)

    print("\n--- Hybrid Model ---")
    print("Top 5 Predictions:", hybrid_titles[:5])
    print("Precision@5:", precision_at_k(hybrid_titles, true_labels, 5))
    print("Recall@5:", recall_at_k(hybrid_titles, true_labels, 5))
    print("nDCG@5:", ndcg_at_k(hybrid_titles, true_labels, 5))

    print("\n--- Baseline Model ---")
    print("Top 5 Predictions:", baseline_titles[:5])
    print("Precision@5:", precision_at_k(baseline_titles, true_labels, 5))
    print("Recall@5:", recall_at_k(baseline_titles, true_labels, 5))
    print("nDCG@5:", ndcg_at_k(baseline_titles, true_labels, 5))


# ---------------------------------------
# Final Aggregate Metrics
# ---------------------------------------

print("\n==============================")
print("FINAL RESULTS")
print("==============================")

print("\nHybrid Model MAP:",
    mean_average_precision(hybrid_predictions_all, all_true_labels))

print("Baseline Model MAP:",
    mean_average_precision(baseline_predictions_all, all_true_labels))
