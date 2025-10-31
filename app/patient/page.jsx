"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import { useAuth } from "../hooks/useAuth";
import { SyncLoader } from "react-spinners";

export default function PatientPortal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("login");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const {
    isAuthenticated,
    user,
    isLoading,
    isLoggingIn,
    loginWithAPI,
    logout,
  } = useAuth();

  const handleLogin = async (formData) => {
    // Prevent multiple login attempts
    if (isLoggingIn) {
      return;
    }

    try {
      const result = await loginWithAPI(formData.login, formData.password);

      if (result.success) {
        toast.success("Login successful! Welcome back.");
        // User is now authenticated, the useAuth hook will handle the state update
      } else {
        // Error toast is already shown in useAuth hook
      }
    } catch (error) {
      toast.error("An unexpected error occurred during login");
    }
  };

  const handleRegister = (formData) => {
    // Registration is handled by the RegisterForm component
    // After successful registration, switch to login tab
    setActiveTab("login");
    toast.success(
      "Registration successful! Please log in with your credentials."
    );
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    // brief delay so the spinner is visible
    await new Promise((resolve) => setTimeout(resolve, 500));
    logout();
    setIsLoggingOut(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 font-sans flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="bg-white py-4 border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex items-center justify-between select-none">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/")}
                aria-label="Back to home"
                className="p-1 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
              >
                <Image
                  src="/icons/back.png"
                  alt="Back"
                  width={28}
                  height={28}
                />
              </button>
              <div className="w-8 h-8 bg-white border-2 border-[#4ad294] rounded-md flex items-center justify-center">
                <Image
                  src="/icons/users.png"
                  alt="Patient Portal"
                  width={20}
                  height={20}
                />
              </div>
              <h1 className="text-lg font-bold text-[#25323A]">
                Patient Portal
              </h1>
            </div>

            {isAuthenticated && user && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Computer"
                  className="p-2 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <Image
                    src="/icons/computer.png"
                    alt="Computer"
                    width={20}
                    height={20}
                  />
                </button>
                <div className="text-right">
                  <p className="text-xs text-gray-600">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full flex items-center justify-center px-8 py-16 overflow-y-auto min-h-0">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-center">
          {isLoading ? (
            // Loading state
            <motion.div
              className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 w-full max-w-md text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4ad294] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </motion.div>
          ) : !isAuthenticated ? (
            // Authentication Forms
            <motion.div
              className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 w-full max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              key="guest"
            >
              {/* Tab Selector */}
              <div className="flex mb-8">
                <button
                  onClick={() => setActiveTab("login")}
                  className={`flex-1 py-3 px-4 rounded-t-lg font-medium transition-colors cursor-pointer ${
                    activeTab === "login"
                      ? "bg-white text-[#25323A] border border-gray-200 border-b-0"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setActiveTab("register")}
                  className={`flex-1 py-3 px-4 rounded-t-lg font-medium transition-colors cursor-pointer ${
                    activeTab === "register"
                      ? "bg-white text-[#25323A] border border-gray-200 border-b-0"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Animated Forms */}
              <AnimatePresence mode="wait" initial={false}>
                {activeTab === "login" ? (
                  <LoginForm onSubmit={handleLogin} isLoading={isLoggingIn} />
                ) : (
                  <RegisterForm onSubmit={handleRegister} />
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            // Patient Dashboard - UI only (no functionality wired yet)
            <motion.div
              className="w-full max-w-5xl -mt-36"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              key="authed"
            >
              <div className="space-y-6">
                {/* Welcome Card */}
                <motion.div
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <h2 className="text-xl md:text-2xl font-bold text-[#25323A] mb-2">
                    Welcome, {user?.name}!
                  </h2>
                  <p className="text-gray-700 mb-2">
                    {user?.email || user?.email_address}
                  </p>
                  <div className="flex items-center gap-2 text-gray-700 pt-6">
                    {/* Phone icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 text-gray-500"
                      aria-hidden="true"
                    >
                      <path d="M2.25 6.75c0-1.243 1.007-2.25 2.25-2.25h2.1c.99 0 1.86.64 2.16 1.584l.72 2.25c.27.846.03 1.77-.6 2.4l-1.14 1.14a12.036 12.036 0 005.46 5.46l1.14-1.14c.63-.63 1.554-.87 2.4-.6l2.25.72a2.25 2.25 0 011.584 2.16v2.1c0 1.243-1.007 2.25-2.25 2.25H18c-8.284 0-15-6.716-15-15v-1.5z" />
                    </svg>
                    <span>{user?.phone_number || user?.phone || "—"}</span>
                  </div>
                </motion.div>

                {/* Join Queue Card */}
                <motion.div
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
                >
                  <h3 className="text-lg font-semibold text-[#25323A] mb-2">
                    Join the Queue
                  </h3>
                  <p className="text-gray-600 mb-4">
                    You're not currently in the queue. Click below to register
                    for service.
                  </p>
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#4ad294] hover:bg-[#3bb882] text-white px-6 py-3 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5"
                      aria-hidden="true"
                    >
                      <path d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.75 20.25A7.5 7.5 0 0111.25 12h1.5a7.5 7.5 0 017.5 7.5v.75a.75.75 0 01-.75.75h-15a.75.75 0 01-.75-.75v-.75z" />
                    </svg>
                    <span className="font-medium">Join Queue Now</span>
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      {isLoggingOut && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
          <SyncLoader size={10} color="#4ad294" speedMultiplier={0.9} />
        </div>
      )}
    </div>
  );
}
