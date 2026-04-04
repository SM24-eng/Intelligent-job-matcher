from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .utils import users_collection


# -------- Register API --------
@api_view(['POST'])
def register_user(request):

    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response({"error": "Username and password required"})

    if users_collection.find_one({"username": username}):
        return Response({"error": "User already exists"})

    users_collection.insert_one(
        {
            "username": username,
            "password_hash": make_password(password),
            "role": "admin" if "admin" in username.lower() else "user",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )

    return Response({"message": "User registered successfully"})


# -------- Login API --------
@api_view(['POST'])
def login_user(request):

    username = request.data.get("username")
    password = request.data.get("password")

    user = users_collection.find_one({"username": username})

    if user is None or not check_password(password, user.get("password_hash", "")):
        return Response({"error": "Invalid username or password"})

    now = datetime.now(timezone.utc)

    access_token = jwt.encode(
        {
            "sub": username,
            "role": user.get("role", "user"),
            "type": "access",
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(hours=8)).timestamp()),
        },
        settings.SECRET_KEY,
        algorithm="HS256",
    )

    refresh_token = jwt.encode(
        {
            "sub": username,
            "type": "refresh",
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(days=7)).timestamp()),
        },
        settings.SECRET_KEY,
        algorithm="HS256",
    )

    return Response({
        "access": access_token,
        "refresh": refresh_token,
    })