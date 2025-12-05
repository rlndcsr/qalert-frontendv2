"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_APP_BASE_URL ||
  "https://intercarpellary-rosana-indivisibly.ngrok-free.dev/api";

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
        // Clear invalid data silently
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
      }
    }

    setIsLoading(false);
  }, []);

  const loginWithAPI = async (login, password) => {
    // Prevent multiple simultaneous login attempts
    if (isLoggingIn) {
      return { success: false, error: "Login already in progress" };
    }

    setIsLoggingIn(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login: login,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();

      // Store token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("userData", JSON.stringify(data.user));

      setIsAuthenticated(true);
      setUser(data.user);

      return { success: true, user: data.user };
    } catch (error) {
      toast.error(
        error.message || "Login failed. Please check your credentials."
      );
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

  const registerWithAPI = async (formData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.fullName,
          email_address: formData.emailRegister,
          phone_number: formData.phoneNumber,
          id_number: formData.universityId || null,
          password: formData.passwordRegister,
          password_confirmation: formData.confirmPassword,
          gender: formData.gender || null,
        }),
      });

      const data = await response.json();

      // Only treat as success if response is actually successful
      if (response.ok) {
        return { success: true, data };
      } else {
        // Handle validation errors from backend
        // Display the main message as toast
        toast.error(data.message || "Registration failed");
        return { success: false, error: data.message };
      }
    } catch (error) {
      // Handle network errors or validation errors
      if (error.name === "TypeError" || error.name === "SyntaxError") {
        toast.error("Network error. Please check your connection.");
        return { success: false, error: error.message };
      }

      // Handle validation errors from backend
      toast.error(error.message || "Registration failed. Please try again.");
      return { success: false, error: error.message };
    }
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
    registerWithAPI,
    logout,
    updateUser,
  };
}
