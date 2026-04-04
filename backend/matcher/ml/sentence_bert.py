import re
import importlib

_model = None
_cosine_similarity = None


def _get_model_components():
    global _model, _cosine_similarity
    if _model is not None and _cosine_similarity is not None:
        return _model, _cosine_similarity

    try:
        sentence_transformers_module = importlib.import_module("sentence_transformers")
        pairwise_module = importlib.import_module("sklearn.metrics.pairwise")

        sentence_transformer_cls = getattr(sentence_transformers_module, "SentenceTransformer")
        _model = sentence_transformer_cls("sentence-transformers/all-mpnet-base-v2")
        _cosine_similarity = getattr(pairwise_module, "cosine_similarity")
    except Exception:
        _model = None
        _cosine_similarity = None

    return _model, _cosine_similarity


def _tokenize(text: str):
    return set(re.findall(r"[a-zA-Z0-9]+", (text or "").lower()))


def _fallback_similarity(resume_text, job_texts):
    resume_tokens = _tokenize(resume_text)
    if not resume_tokens:
        return [0.0 for _ in job_texts]

    scores = []
    for job_text in job_texts:
        job_tokens = _tokenize(job_text)
        if not job_tokens:
            scores.append(0.0)
            continue

        overlap = len(resume_tokens & job_tokens)
        denom = max(1, len(resume_tokens | job_tokens))
        scores.append(overlap / denom)

    return scores


def calculate_similarity(resume_text, job_texts):
    model, cosine_similarity_fn = _get_model_components()

    if model is None or cosine_similarity_fn is None:
        return _fallback_similarity(resume_text, job_texts)

    resume_embedding = model.encode([resume_text])
    job_embeddings = model.encode(job_texts)

    similarities = cosine_similarity_fn(resume_embedding, job_embeddings)
    return similarities[0]
