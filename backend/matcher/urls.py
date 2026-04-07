from django.urls import path

from .auth_views import login_user, register_user
from .views import analyze_resume, explainability_history, match_jobs, save_explainability_record
from .views import admin_analyses, admin_delete_user, admin_users, analysis_history, save_analysis_record
from .views import add_job_role, delete_job_role, list_job_roles
from .web_views import (
    admin_analyses_page,
    admin_dashboard_page,
    admin_users_page,
    analyzer_page,
    analytics_page,
    dashboard_page,
    explainability_page,
    landing_page,
    login_page,
    profile_page,
    job_roles_page,
    results_page,
    signup_page,
)

urlpatterns = [
    # Template pages (React replacement)
    path('', landing_page, name='landing'),
    path('login/', login_page, name='login_page'),
    path('signup/', signup_page, name='signup_page'),
    path('analyzer/', analyzer_page, name='analyzer_page'),
    path('results/', results_page, name='results_page'),
    path('explainability/', explainability_page, name='explainability_page'),
    path('dashboard/', dashboard_page, name='dashboard_page'),
    path('analytics/', analytics_page, name='analytics_page'),
    path('profile/', profile_page, name='profile_page'),
    path('job-roles/', job_roles_page, name='job_roles_page'),
    path('admin/', admin_dashboard_page, name='admin_dashboard_page'),
    path('admin/users/', admin_users_page, name='admin_users_page'),
    path('admin/analyses/', admin_analyses_page, name='admin_analyses_page'),

    # Preferred API endpoints
    path('api/match/', match_jobs),
    path('api/analyze_resume/', analyze_resume),
    path('api/register/', register_user),
    path('api/login/', login_user),
    path('api/explainability/save/', save_explainability_record),
    path('api/explainability/history/', explainability_history),
    path('api/analyses/save/', save_analysis_record),
    path('api/analyses/history/', analysis_history),
    path('api/admin/users/', admin_users),
    path('api/admin/users/<str:username>/', admin_delete_user),
    path('api/admin/analyses/', admin_analyses),
    path('api/job-roles/', list_job_roles),
    path('api/job-roles/add/', add_job_role),
    path('api/job-roles/<str:role_name>/', delete_job_role),

    # Legacy API endpoints kept for backward compatibility
    path('match/', match_jobs),
    path('analyze_resume/', analyze_resume),
    path('register/', register_user),
    path('login-api/', login_user),
    path('explainability/save/', save_explainability_record),
    path('explainability/history/', explainability_history),
    path('analyses/save/', save_analysis_record),
    path('analyses/history/', analysis_history),
]