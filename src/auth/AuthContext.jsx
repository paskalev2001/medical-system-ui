import { createContext, useContext, useEffect, useState } from "react";
import { http } from "../api/http";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem("currentUser");
    return stored ? JSON.parse(stored) : null;
  });

  const [loading, setLoading] = useState(false);

  async function login(username, password) {
    localStorage.setItem("username", username);
    localStorage.setItem("password", password);

    try {
      setLoading(true);
      const response = await http.get("/auth/me");

      localStorage.setItem("currentUser", JSON.stringify(response.data));
      setCurrentUser(response.data);

      return response.data;
    } catch (error) {
      localStorage.removeItem("username");
      localStorage.removeItem("password");
      localStorage.removeItem("currentUser");
      setCurrentUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("username");
    localStorage.removeItem("password");
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
  }

  function hasRole(...roles) {
    return currentUser && roles.includes(currentUser.role);
  }

  const value = {
    currentUser,
    loading,
    login,
    logout,
    hasRole,
    isAuthenticated: Boolean(currentUser),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}