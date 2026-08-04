import { createContext, useContext, useEffect, useMemo, useState } from "react";

import api from "../utils/api.js";

const AuthContext = createContext(null);

const normalizeUser = (user) => ({
  id: user?.id || user?._id || null,
  name: user?.name || "",
  email: user?.email || "",
  role: user?.role || "",
  patientProfile:
    user?.patientProfile?._id || user?.patientProfile || null,
  subscriptionPlan: user?.subscriptionPlan || "Free"
});

const getStoredToken = () => localStorage.getItem("token");

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/auth/me");
      const profile = normalizeUser(response.data?.data);

      setUser(profile);
      setAuthError("");
    } catch (error) {
      console.error("Failed to fetch authenticated profile:", error);
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      setAuthError("Your session could not be restored. Please sign in again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const existingToken = getStoredToken();

    if (!existingToken) {
      setLoading(false);
      return;
    }

    setToken(existingToken);
    fetchProfile();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setAuthError("");

      const response = await api.post("/auth/login", { email, password });
      const nextToken = response.data?.data?.token;
      const nextUser = normalizeUser(response.data?.data?.user);

      localStorage.setItem("token", nextToken);
      setToken(nextToken);
      setUser(nextUser);

      const profileResponse = await api.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${nextToken}`
        }
      });

      setUser(normalizeUser(profileResponse.data?.data));
      return { success: true, user: nextUser };
    } catch (error) {
      console.error("Login request failed:", error);

      const message =
        error.response?.data?.message || "Login failed. Please check your credentials.";

      setAuthError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
    setAuthError("");
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      authError,
      isAuthenticated: Boolean(user && token),
      login,
      logout,
      refreshProfile: fetchProfile
    }),
    [user, token, loading, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
};

export { AuthProvider, useAuth };
