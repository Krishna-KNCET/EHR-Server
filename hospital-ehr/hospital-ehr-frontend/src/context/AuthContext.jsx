/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

const clearAuthStorage = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("userData");
  localStorage.removeItem("userRole");
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const bootstrapSession = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setIsAuthLoading(false);
        return;
      }

      try {
        const res = await api.get("/auth/me");
        const sessionUser = res.data?.data;

        if (!sessionUser) {
          throw new Error("Invalid session payload");
        }

        localStorage.setItem("userData", JSON.stringify(sessionUser));
        localStorage.setItem("userRole", sessionUser.role);
        setUser(sessionUser);
      } catch {
        clearAuthStorage();
        setUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    };

    bootstrapSession();
  }, []);

  const login = async (email, password, expectedRole) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const { accessToken, user } = res.data.data;

      if (expectedRole && user.role !== expectedRole) {
        return {
          success: false,
          message: `This account is registered as ${user.role}. Please select the ${user.role} portal.`,
        };
      }

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("userRole", user.role);
      localStorage.setItem("userData", JSON.stringify(user));

      setUser(user);

      return { success: true, role: user.role };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Login failed",
      };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Keep local logout resilient even if the API call fails.
    } finally {
      clearAuthStorage();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
