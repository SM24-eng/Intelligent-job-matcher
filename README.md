# Intelligent Job Matcher

The frontend now runs as Django templates (no React app required at runtime).

## Stack

- Backend: Django + Django REST Framework
- Storage: MongoDB
- Frontend rendering: Django templates + static CSS/JS

## Run Locally

1. Start MongoDB.
2. Create/activate Python virtual environment.
3. Install dependencies:

```bash
cd backend
pip install -r requirements.txt
```

4. Run Django server:

```bash
python manage.py runserver
```

5. Open:

- App: http://localhost:8000/
- API base: http://localhost:8000/api/

## Main Template Routes

- `/` landing page
- `/login` login page
- `/signup` signup page
- `/analyzer` resume analyzer
- `/results` job match results
- `/explainability` explainability report
- `/dashboard` user dashboard
- `/analytics` analytics page
- `/profile` profile page
- `/admin` admin dashboard
- `/admin/users` admin users
- `/admin/analyses` admin analyses

## Main API Routes

- `POST /api/register/`
- `POST /api/login/`
- `POST /api/match/`
- `POST /api/analyze_resume/`
- `POST /api/analyses/save/`
- `GET /api/analyses/history/`
- `POST /api/explainability/save/`
- `GET /api/explainability/history/`
- `GET /api/admin/users/`
- `DELETE /api/admin/users/<username>/`
- `GET /api/admin/analyses/`

## Notes

- Existing legacy API routes are still available for backward compatibility.
- Frontend state for dashboards/admin pages now persists in backend MongoDB via API endpoints.
