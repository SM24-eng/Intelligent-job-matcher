from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import datetime
from .hybrid_service import run_hybrid_matching
from .utils import (
    analyses_collection,
    explainability_collection,
    job_roles_collection,
    jobs_collection,
    users_collection,
)


def _is_admin(request):
    return getattr(request.user, "role", "user") == "admin"


def _sync_job_roles_from_jobs():
    role_candidates = set()

    for field in ("title", "job_title", "role"):
        try:
            values = jobs_collection.distinct(field)
        except Exception:
            values = []

        for value in values:
            if isinstance(value, str):
                cleaned = value.strip()
                if cleaned:
                    role_candidates.add(cleaned)

    if not role_candidates:
        return

    existing_docs = job_roles_collection.find({}, {"name": 1})
    existing_by_lower = {
        (item.get("name") or "").strip().lower()
        for item in existing_docs
        if isinstance(item.get("name"), str) and item.get("name").strip()
    }

    missing_documents = []
    now = datetime.utcnow().isoformat()

    for role_name in sorted(role_candidates, key=lambda x: x.lower()):
        if role_name.lower() not in existing_by_lower:
            missing_documents.append(
                {
                    "name": role_name,
                    "created_by": "system",
                    "created_at": now,
                }
            )

    if missing_documents:
        job_roles_collection.insert_many(missing_documents)


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


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def save_analysis_record(request):
    payload = request.data or {}
    document = {
        "username": request.user.username,
        "user_email": payload.get("user_email") or request.user.username,
        "resume_snippet": payload.get("resume_snippet") or "",
        "recommended_jobs": payload.get("recommended_jobs") or [],
        "analyzed_at": payload.get("analyzed_at") or datetime.utcnow().isoformat(),
        "created_at": datetime.utcnow().isoformat(),
    }

    inserted = analyses_collection.insert_one(document)
    return Response({"id": str(inserted.inserted_id), "message": "Analysis saved"}, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analysis_history(request):
    cursor = analyses_collection.find(
        {"username": request.user.username},
        {
            "username": 1,
            "user_email": 1,
            "resume_snippet": 1,
            "recommended_jobs": 1,
            "analyzed_at": 1,
            "created_at": 1,
        },
    ).sort("created_at", -1).limit(100)

    response = []
    for item in cursor:
        response.append(
            {
                "id": str(item.get("_id")),
                "username": item.get("username"),
                "user_email": item.get("user_email"),
                "resume_snippet": item.get("resume_snippet", ""),
                "recommended_jobs": item.get("recommended_jobs", []),
                "analyzed_at": item.get("analyzed_at") or item.get("created_at"),
                "created_at": item.get("created_at"),
            }
        )

    return Response(response)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_users(request):
    if not _is_admin(request):
        return Response({"error": "Admin access required"}, status=403)

    cursor = users_collection.find(
        {},
        {
            "username": 1,
            "role": 1,
            "created_at": 1,
        },
    ).sort("created_at", -1)

    response = []
    for item in cursor:
        username = item.get("username", "")
        response.append(
            {
                "id": str(item.get("_id")),
                "username": username,
                "email": username,
                "name": username.split("@")[0] if "@" in username else username,
                "role": item.get("role", "user"),
                "created_at": item.get("created_at"),
            }
        )

    return Response(response)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def admin_delete_user(request, username):
    if not _is_admin(request):
        return Response({"error": "Admin access required"}, status=403)

    if username == request.user.username:
        return Response({"error": "Cannot delete currently authenticated admin"}, status=400)

    delete_user_result = users_collection.delete_one({"username": username})
    analyses_collection.delete_many({"username": username})
    explainability_collection.delete_many({"username": username})

    if delete_user_result.deleted_count == 0:
        return Response({"error": "User not found"}, status=404)

    return Response({"message": "User deleted"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_analyses(request):
    if not _is_admin(request):
        return Response({"error": "Admin access required"}, status=403)

    cursor = analyses_collection.find(
        {},
        {
            "username": 1,
            "user_email": 1,
            "resume_snippet": 1,
            "recommended_jobs": 1,
            "analyzed_at": 1,
            "created_at": 1,
        },
    ).sort("created_at", -1).limit(500)

    response = []
    for item in cursor:
        response.append(
            {
                "id": str(item.get("_id")),
                "username": item.get("username"),
                "user_email": item.get("user_email") or item.get("username"),
                "resume_snippet": item.get("resume_snippet", ""),
                "recommended_jobs": item.get("recommended_jobs", []),
                "analyzed_at": item.get("analyzed_at") or item.get("created_at"),
                "created_at": item.get("created_at"),
            }
        )

    return Response(response)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_job_roles(request):
    _sync_job_roles_from_jobs()

    roles = sorted(
        {
            (item.get("name") or "").strip()
            for item in job_roles_collection.find({}, {"name": 1})
            if isinstance(item.get("name"), str) and item.get("name").strip()
        },
        key=lambda x: x.lower(),
    )
    return Response({"roles": roles, "count": len(roles)})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_job_role(request):
    role_name = (request.data.get("name") or "").strip()

    if not role_name:
        return Response({"error": "Role name is required"}, status=400)

    existing = job_roles_collection.find_one({"name": {"$regex": f"^{role_name}$", "$options": "i"}})
    if existing:
        return Response({"error": "Role already exists"}, status=409)

    inserted = job_roles_collection.insert_one(
        {
            "name": role_name,
            "created_by": request.user.username,
            "created_at": datetime.utcnow().isoformat(),
        }
    )
    return Response({"id": str(inserted.inserted_id), "name": role_name, "message": "Role added"}, status=201)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_job_role(request, role_name):
    cleaned = (role_name or "").strip()
    if not cleaned:
        return Response({"error": "Role name is required"}, status=400)

    deleted = job_roles_collection.delete_one({"name": {"$regex": f"^{cleaned}$", "$options": "i"}})
    if deleted.deleted_count == 0:
        return Response({"error": "Role not found"}, status=404)

    return Response({"message": "Role deleted"})