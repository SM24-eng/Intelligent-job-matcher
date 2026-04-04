from dataclasses import dataclass

import jwt
from django.conf import settings
from rest_framework import authentication
from rest_framework import exceptions


@dataclass
class MongoUser:
    username: str
    role: str = "user"

    @property
    def is_authenticated(self):
        return True


class MongoJWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request).decode("utf-8")

        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise exceptions.AuthenticationFailed("Invalid Authorization header format")

        token = parts[1]

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError as exc:
            raise exceptions.AuthenticationFailed("Token expired") from exc
        except jwt.InvalidTokenError as exc:
            raise exceptions.AuthenticationFailed("Invalid token") from exc

        if payload.get("type") != "access":
            raise exceptions.AuthenticationFailed("Invalid token type")

        username = payload.get("sub")
        if not username:
            raise exceptions.AuthenticationFailed("Invalid token payload")

        user = MongoUser(username=username, role=payload.get("role", "user"))
        return (user, token)
