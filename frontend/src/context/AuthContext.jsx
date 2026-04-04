import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loginUser, signupUser } from "../services/authService";

const AuthContext = createContext(null);

function parseJwt(token) {
  if (!token) {
    return null;
  }

  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
}

function getIdentity(value) {
  if (!value) {
    return "user";
  }
  return value.includes("@") ? value.split("@")[0] : value;
}

function getStoredState() {
  const token = localStorage.getItem("ijm_token");
  const user = JSON.parse(localStorage.getItem("ijm_user") || "null");
  return { token, user };
}

export function AuthProvider({ children }) {
  const [{ token, user }, setAuthState] = useState(getStoredState);

  useEffect(() => {
    if (token) {
      localStorage.setItem("ijm_token", token);
    } else {
      localStorage.removeItem("ijm_token");
    }

    if (user) {
      localStorage.setItem("ijm_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("ijm_user");
    }
  }, [token, user]);

  const login = async (credentials) => {
    const response = await loginUser(credentials);
    const incomingToken = response?.token || response?.access || response?.data?.token;

    if (!incomingToken) {
      throw new Error(response?.error || response?.message || "Authentication failed");
    }

    const jwtPayload = parseJwt(incomingToken);

    const incomingUser =
      response?.user ||
      response?.data?.user || {
        name: response?.name || getIdentity(credentials.email),
        email: credentials.email,
        role: jwtPayload?.role || "user",
      };

    const normalizedUser = {
      name: incomingUser?.name || getIdentity(credentials.email),
      email: incomingUser?.email || credentials.email,
      role: incomingUser?.role || jwtPayload?.role || "user",
    };

    setAuthState({ token: incomingToken, user: normalizedUser });
    return normalizedUser;
  };

  const signup = async (payload) => {
    const response = await signupUser(payload);
    const users = JSON.parse(localStorage.getItem("ijm_users") || "[]");
    const savedUser = {
      name: payload.name,
      email: payload.email,
      role: payload.email.toLowerCase().includes("admin") ? "admin" : "user",
    };

    const deduped = [savedUser, ...users.filter((item) => item.email !== payload.email)];
    localStorage.setItem("ijm_users", JSON.stringify(deduped));
    return response;
  };

  const logout = () => {
    setAuthState({ token: null, user: null });
  };

  const addAnalysis = (analysis) => {
    if (!user) {
      return;
    }

    const allAnalyses = JSON.parse(localStorage.getItem("ijm_analyses") || "[]");
    const entry = {
      id: Date.now(),
      userEmail: user.email,
      ...analysis,
    };
    localStorage.setItem("ijm_analyses", JSON.stringify([entry, ...allAnalyses]));
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      login,
      signup,
      logout,
      addAnalysis,
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
