from django.urls import path
from .views import match_jobs, analyze_resume, save_explainability_record, explainability_history
from .auth_views import register_user, login_user

urlpatterns = [
    path('match/', match_jobs),
    path('analyze_resume/', analyze_resume),

    path('register/', register_user),
    path('login/', login_user),
    path('explainability/save/', save_explainability_record),
    path('explainability/history/', explainability_history),
]