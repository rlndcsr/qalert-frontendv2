"use client";

import { useState, useEffect } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_APP_BASE_URL || "http://qalert-backend.test/api";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("userData");

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setIsAuthenticated(true);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
        // Clear invalid data
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
      }
    }

    setIsLoading(false);
  }, []);

  const loginWithAPI = async (emailAddress, password) => {
    // Prevent multiple simultaneous login attempts
    if (isLoggingIn) {
      console.log("Login already in progress, ignoring duplicate request");
      return { success: false, error: "Login already in progress" };
    }

    setIsLoggingIn(true);
    console.log("Starting login API call for:", emailAddress);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_address: emailAddress,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      console.log("Login API response:", data);

      // Store token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("userData", JSON.stringify(data.user));

      setIsAuthenticated(true);
      setUser(data.user);

      return { success: true, user: data.user };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    } finally {
      setIsLoggingIn(false);
    }
  };

  const login = (userData, token = "mock-jwt-token") => {
    localStorage.setItem("token", token);
    localStorage.setItem("userData", JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    setIsAuthenticated(false);
    setUser(null);
  };

  const updateUser = (updatedUserData) => {
    const newUserData = { ...user, ...updatedUserData };
    localStorage.setItem("userData", JSON.stringify(newUserData));
    setUser(newUserData);
  };

  return {
    isAuthenticated,
    user,
    isLoading,
    isLoggingIn,
    login,
    loginWithAPI,
    logout,
    updateUser,
  };
}
