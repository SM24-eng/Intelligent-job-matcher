from django.shortcuts import render

from .utils import jobs_collection


def _render_page(request, template_name, page_key, title):
    return render(
        request,
        template_name,
        {
            "page_key": page_key,
            "page_title": title,
        },
    )


def landing_page(request):
    return _render_page(request, "matcher/landing.html", "landing", "Intelligent Job Matcher")


def login_page(request):
    return _render_page(request, "matcher/login.html", "login", "Login")


def signup_page(request):
    return _render_page(request, "matcher/signup.html", "signup", "Sign Up")


def analyzer_page(request):
    return _render_page(request, "matcher/analyzer.html", "analyzer", "Resume Analyzer")


def results_page(request):
    return _render_page(request, "matcher/results.html", "results", "Top Job Matches")


def explainability_page(request):
    return _render_page(request, "matcher/explainability.html", "explainability", "Explainability")


def dashboard_page(request):
    return _render_page(request, "matcher/dashboard.html", "dashboard", "Dashboard")


def analytics_page(request):
    return _render_page(request, "matcher/analytics.html", "analytics", "Analytics")


def profile_page(request):
    return _render_page(request, "matcher/profile.html", "profile", "Profile")


def admin_dashboard_page(request):
    return _render_page(request, "matcher/admin_dashboard.html", "admin_dashboard", "Admin Dashboard")


def admin_users_page(request):
    return _render_page(request, "matcher/admin_users.html", "admin_users", "Admin Users")


def admin_analyses_page(request):
    return _render_page(request, "matcher/admin_analyses.html", "admin_analyses", "Admin Analyses")


def job_roles_page(request):
    roles = set()
    load_error = None

    try:
        cursor = jobs_collection.find({}, {"title": 1, "job_title": 1, "role": 1})
        for item in cursor:
            value = item.get("title") or item.get("job_title") or item.get("role")
            if isinstance(value, str):
                cleaned = value.strip()
                if cleaned:
                    roles.add(cleaned)
    except Exception:
        load_error = "Unable to load job roles from database."

    return render(
        request,
        "matcher/job_roles.html",
        {
            "page_key": "job_roles",
            "page_title": "Available Job Roles",
            "roles": sorted(roles, key=lambda x: x.lower()),
            "roles_count": len(roles),
            "load_error": load_error,
        },
    )
