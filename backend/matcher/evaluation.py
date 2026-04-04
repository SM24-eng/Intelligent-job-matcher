import math


# ---------------------------------------
# Precision@K
# ---------------------------------------
def precision_at_k(predicted_titles, true_titles, k=5):
    predicted_k = predicted_titles[:k]
    relevant = sum(1 for title in predicted_k if title in true_titles)
    return relevant / k


# ---------------------------------------
# Recall@K
# ---------------------------------------
def recall_at_k(predicted_titles, true_titles, k=5):
    predicted_k = predicted_titles[:k]
    relevant = sum(1 for title in predicted_k if title in true_titles)

    if len(true_titles) == 0:
        return 0.0

    return relevant / len(true_titles)


# ---------------------------------------
# Average Precision (AP)
# ---------------------------------------
def average_precision(predicted_titles, true_titles):
    score = 0.0
    relevant_count = 0

    for i, title in enumerate(predicted_titles):
        if title in true_titles:
            relevant_count += 1
            score += relevant_count / (i + 1)

    if relevant_count == 0:
        return 0.0

    return score / len(true_titles)


# ---------------------------------------
# Mean Average Precision (MAP)
# ---------------------------------------
def mean_average_precision(all_predictions, all_true_labels):
    ap_scores = []

    for predicted, true in zip(all_predictions, all_true_labels):
        ap_scores.append(average_precision(predicted, true))

    if not ap_scores:
        return 0.0

    return sum(ap_scores) / len(ap_scores)


# ---------------------------------------
# DCG@K
# ---------------------------------------
def dcg_at_k(predicted_titles, true_titles, k=5):
    predicted_k = predicted_titles[:k]
    dcg = 0.0

    for i, title in enumerate(predicted_k):
        if title in true_titles:
            dcg += 1 / math.log2(i + 2)

    return dcg


# ---------------------------------------
# nDCG@K
# ---------------------------------------
def ndcg_at_k(predicted_titles, true_titles, k=5):
    ideal_dcg = dcg_at_k(true_titles, true_titles, k)
    if ideal_dcg == 0:
        return 0.0

    actual_dcg = dcg_at_k(predicted_titles, true_titles, k)
    return actual_dcg / ideal_dcg
