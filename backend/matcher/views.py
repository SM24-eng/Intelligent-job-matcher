from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import datetime
from .hybrid_service import run_hybrid_matching
from .utils import explainability_collection


# ---------------- Manual Text Matching ----------------
@api_view(["POST"])
def match_jobs(request):

    resume_text = request.data.get("resume_text")

    if not resume_text:
        return Response({"error": "Resume text missing"}, status=400)

    results = run_hybrid_matching(resume_text)

    return Response(results)


# ---------------- Resume Upload + Match ----------------
@csrf_exempt
def analyze_resume(request):

    if request.method != "POST":
        return JsonResponse({"error": "Only POST allowed"}, status=405)

    resume_file = request.FILES.get("resume")

    if not resume_file:
        return JsonResponse({"error": "Resume not uploaded"}, status=400)

    try:
        import fitz
    except Exception:
        return JsonResponse({"error": "PDF parser dependency is missing. Install PyMuPDF."}, status=500)

    try:
        pdf_text = ""
        pdf = fitz.open(stream=resume_file.read(), filetype="pdf")

        for page in pdf:
            pdf_text += page.get_text()

    except Exception:
        return JsonResponse({"error": "Invalid PDF file"}, status=400)

    results = run_hybrid_matching(pdf_text)

    return JsonResponse(results, safe=False)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def save_explainability_record(request):
    payload = request.data or {}
    document = {
        "username": request.user.username,
        "job_title": payload.get("job_title") or "Untitled Role",
        "rank": payload.get("rank") or 1,
        "final_score": payload.get("final_score") or 0,
        "semantic_score": payload.get("semantic_score") or 0,
        "skill_score": payload.get("skill_score") or 0,
        "experience_score": payload.get("experience_score") or 0,
        "role_score": payload.get("role_score") or 0,
        "matched_skills": payload.get("matched_skills") or [],
        "missing_skills": payload.get("missing_skills") or [],
        "model_weights": payload.get("model_weights") or {},
        "narrative": payload.get("narrative") or [],
        "created_at": datetime.utcnow().isoformat(),
    }

    inserted = explainability_collection.insert_one(document)

    return Response({"id": str(inserted.inserted_id), "message": "Explainability record saved"}, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def explainability_history(request):
    cursor = explainability_collection.find(
        {"username": request.user.username},
        {
            "job_title": 1,
            "rank": 1,
            "final_score": 1,
            "semantic_score": 1,
            "skill_score": 1,
            "experience_score": 1,
            "role_score": 1,
            "matched_skills": 1,
            "missing_skills": 1,
            "model_weights": 1,
            "narrative": 1,
            "created_at": 1,
        },
    ).sort("created_at", -1).limit(30)

    response = []

    for item in cursor:
        response.append(
            {
                "id": str(item.get("_id")),
                "job_title": item.get("job_title", "Untitled Role"),
                "rank": item.get("rank", 1),
                "final_score": item.get("final_score", 0),
                "semantic_score": item.get("semantic_score", 0),
                "skill_score": item.get("skill_score", 0),
                "experience_score": item.get("experience_score", 0),
                "role_score": item.get("role_score", 0),
                "matched_skills": item.get("matched_skills", []),
                "missing_skills": item.get("missing_skills", []),
                "model_weights": item.get("model_weights", {}),
                "narrative": item.get("narrative", []),
                "created_at": item.get("created_at"),
            }
        )

    return Response(response)