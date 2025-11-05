"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import { useAuth } from "../hooks/useAuth";
import { SyncLoader } from "react-spinners";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_APP_BASE_URL || "http://qalert-backend.test/api";

export default function PatientPortal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("login");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinReason, setJoinReason] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [queueEntry, setQueueEntry] = useState(null);
  const [queuePosition, setQueuePosition] = useState(null);
  const [isQueueLoading, setIsQueueLoading] = useState(false);
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

  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  };

  const getTodayDateString = () => {
    // Use UTC YYYY-MM-DD to match server-side ISO dates and avoid local timezone
    return new Date().toISOString().slice(0, 10);
  };

  // Normalize various date inputs to YYYY-MM-DD (returns null if not parseable)
  const toYMD = (value) => {
    if (!value) return null;
    if (typeof value === "string") {
      // Already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      // Try parsing ISO / datetime strings
      const parsed = new Date(value);
      if (!isNaN(parsed)) return parsed.toISOString().slice(0, 10);
    }
    if (value instanceof Date && !isNaN(value)) {
      return value.toISOString().slice(0, 10);
    }
    return null;
  };

  const fetchUserQueue = async () => {
    if (!isAuthenticated || !user) return;
    const token = getAuthToken();
    if (!token) return;

    const userId = user?.id || user?.user_id || user?.uid;
    if (!userId) return;

    setIsQueueLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/queues`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        method: "GET",
      });

      if (!response.ok) {
        setQueueEntry(null);
        setQueuePosition(null);
        return;
      }

      const data = await response.json();
      const list = Array.isArray(data)
        ? data
        : data?.data || data?.queues || data?.items || [];
      const today = getTodayDateString();

      const todaysForUser = list
        .filter((q) => {
          const entryDate = toYMD(q?.date ?? q?.created_at);
          // Exact match: only accept entries whose normalized date equals today
          const dateMatches = entryDate === today;
          return dateMatches && (q?.user_id ?? q?.user?.id) === userId;
        })
        .sort((a, b) => {
          const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
          return bTime - aTime; // pick latest
        });

      const selected = todaysForUser[0] || null;

      // Debug: show what we found for this user today
      // Remove after verifying
      console.log("[queues] today:", today, "userId:", userId, {
        total: list.length,
        todaysCount: todaysForUser.length,
        selected,
      });

      if (selected) {
        setQueueEntry(selected);
      } else {
        setQueueEntry(null);
        setQueuePosition(null);
      }
    } catch (e) {
      // Silent fail; keep UI stable
    } finally {
      setIsQueueLoading(false);
    }
  };

  const fetchQueuePosition = async () => {
    if (!isAuthenticated || !user) return;
    const token = getAuthToken();
    if (!token) return;

    const userId = user?.id || user?.user_id || user?.uid;
    if (!userId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/queues`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        method: "GET",
      });

      if (!response.ok) {
        setQueuePosition(null);
        return;
      }

      const data = await response.json();
      const list = Array.isArray(data)
        ? data
        : data?.data || data?.queues || data?.items || [];
      const today = getTodayDateString();

      const todays = list
        .filter((q) => {
          const entryDate = toYMD(q?.date ?? q?.created_at);
          // Exact-date filtering: only consider entries with a normalized date equal to today
          const dateMatches = entryDate === today;
          // Only include entries that are in "waiting" status
          const isWaiting = !q?.queue_status || q.queue_status === "waiting";
          return dateMatches && isWaiting;
        })
        .sort((a, b) => {
          const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
          return aTime - bTime;
        });

      const currentIndex = todays.findIndex(
        (q) => (q?.user_id ?? q?.user?.id) === userId
      );
      if (currentIndex >= 0) {
        setQueuePosition(currentIndex + 1);
      } else {
        setQueuePosition(null);
      }
    } catch (e) {
      setQueuePosition(null);
    }
  };

  // TEMP: Debug function to print all queues raw
  const debugFetchAllQueues = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/queues`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        method: "GET",
      });
      const data = await response
        .json()
        .catch(() => ({ error: "invalid json" }));
      console.log("[queues][raw] status:", response.status, "data:", data);

      // Also show filtered view for current user and today (debug only)
      const list = Array.isArray(data) ? data : data?.data || [];
      const today = getTodayDateString();
      const filtered = list.filter((q) => {
        const entryDate = toYMD(q?.date ?? q?.created_at);
        const dateMatches = entryDate === today;
        return dateMatches && (q?.user_id ?? q?.user?.id) === user?.user_id;
      });
      console.log(
        "[queues][filtered] today:",
        today,
        "userId:",
        user?.user_id,
        filtered
      );

      // Also log the single matched entry (today) and any match across all returned queues
      const matchedToday = filtered[0] || null;
      const anyMatch =
        list.find((q) => (q?.user_id ?? q?.user?.id) === user?.user_id) || null;

      // Exact date match: only entries whose normalized date equals today's date
      const matchedExactDate = list.find((q) => {
        const entryDate = toYMD(q?.date ?? q?.created_at);
        return (
          entryDate === today && (q?.user_id ?? q?.user?.id) === user?.user_id
        );
      });

      if (matchedToday) {
        console.log(
          "[queues][match][today] matched queue entry for current user:",
          matchedToday
        );
      } else {
        console.log(
          "[queues][match][today] no matching queue entry found for current user for today"
        );
      }

      if (anyMatch) {
        console.log(
          "[queues][match][any] matched queue entry (any date) for current user:",
          anyMatch
        );
      } else {
        console.log(
          "[queues][match][any] no matching queue entry found for current user in returned list"
        );
      }

      if (matchedExactDate) {
        console.log(
          "[queues][match][exactDate] matched queue entry where date === today for current user:",
          matchedExactDate
        );
      } else {
        console.log(
          "[queues][match][exactDate] no matching queue entry found where date === today for current user"
        );
      }
    } catch (err) {
      console.log("[queues][raw] error:", err?.message || err);
    }
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // TEMP: print all queues as provided by the API
      debugFetchAllQueues();
      fetchUserQueue();
      fetchQueuePosition();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, user?.user_id, user?.id_number]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 font-sans flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="bg-white py-4 border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex items-center justify-between select-none">
            <div className="flex items-center gap-3">
              <motion.button
                key={`back-${isAuthenticated ? "auth" : "guest"}`}
                onClick={() => router.push("/")}
                aria-label="Back to home"
                className="p-1 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <Image
                  src="/icons/back.png"
                  alt="Back"
                  width={28}
                  height={28}
                />
              </motion.button>
              <motion.div
                key={`users-${isAuthenticated ? "auth" : "guest"}`}
                className="w-8 h-8 bg-white border-2 border-[#4ad294] rounded-md flex items-center justify-center"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.45,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.02,
                }}
              >
                <Image
                  src="/icons/users.png"
                  alt="Patient Portal"
                  width={20}
                  height={20}
                />
              </motion.div>
              <motion.h1
                key={`title-${isAuthenticated ? "auth" : "guest"}`}
                className="text-lg font-bold text-[#25323A]"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.45,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.04,
                }}
              >
                Patient Portal
              </motion.h1>
            </div>

            {isAuthenticated && user && (
              <div className="flex items-center gap-2">
                <motion.button
                  type="button"
                  aria-label="Computer"
                  title="View queue display"
                  className="p-2 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                    delay: 0.08,
                  }}
                >
                  <Image
                    src="/icons/computer.png"
                    alt="Computer"
                    width={20}
                    height={20}
                  />
                </motion.button>
                <div className="text-right">
                  <p className="text-xs text-gray-600">{user.email}</p>
                </div>
                <motion.button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                    delay: 0.16,
                  }}
                >
                  Logout
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full flex items-start justify-center px-8 py-16 overflow-y-auto min-h-0">
        <div className="max-w-6xl mx-auto w-full flex justify-center items-start">
          {isLoading ? (
            // Loading state with skeletons
            <motion.div
              className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 w-full max-w-md text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex flex-col gap-6">
                {/* Skeleton for Welcome Card */}
                <div className="animate-pulse bg-gray-100 rounded-xl h-32 w-full mb-2" />
                {/* Skeleton for Queue Status/Join Card */}
                <div className="animate-pulse bg-gray-100 rounded-xl h-40 w-full mb-2" />
                {/* Skeleton for What to do next Card */}
                <div className="animate-pulse bg-gray-100 rounded-xl h-32 w-full" />
              </div>
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
                {isLoading ? (
                  <div className="animate-pulse flex flex-col gap-4">
                    <div className="bg-gray-100 h-10 w-full rounded" />
                    <div className="bg-gray-100 h-10 w-full rounded" />
                    <div className="bg-gray-100 h-10 w-full rounded" />
                  </div>
                ) : activeTab === "login" ? (
                  <LoginForm onSubmit={handleLogin} isLoading={isLoggingIn} />
                ) : (
                  <RegisterForm onSubmit={handleRegister} />
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            // Patient Dashboard
            <motion.div
              className="w-full max-w-5xl -mt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              key="authed"
            >
              <div className="space-y-6">
                {/* Welcome Card */}
                {isQueueLoading ? (
                  <motion.div
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    {/* Skeleton UI for Welcome Card */}
                    <div className="animate-pulse flex flex-col gap-4">
                      <div className="h-7 w-1/2 bg-gray-100 rounded mb-2" />
                      <div className="h-5 w-1/3 bg-gray-100 rounded mb-2" />
                      <div className="h-5 w-1/4 bg-gray-100 rounded mb-2" />
                      <div className="h-5 w-1/3 bg-gray-100 rounded" />
                    </div>
                  </motion.div>
                ) : (
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
                    {user?.id_number && (
                      <div className="pt-6 font-semibold text-sm flex items-center gap-2 text-gray-700">
                        <Image
                          src="/icons/id-card.png"
                          alt="ID Number"
                          width={20}
                          height={20}
                          className="w-5 h-5"
                        />
                        <span>{user.id_number}</span>
                      </div>
                    )}
                    <div
                      className={`flex items-center gap-2 text-gray-700 ${
                        user?.id_number ? "pt-2" : "pt-6"
                      }`}
                    >
                      {/* Phone icon */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5 text-[#4ad294]"
                        aria-hidden="true"
                      >
                        <path d="M2.25 6.75c0-1.243 1.007-2.25 2.25-2.25h2.1c.99 0 1.86.64 2.16 1.584l.72 2.25c.27.846.03 1.77-.6 2.4l-1.14 1.14a12.036 12.036 0 005.46 5.46l1.14-1.14c.63-.63 1.554-.87 2.4-.6l2.25.72a2.25 2.25 0 011.584 2.16v2.1c0 1.243-1.007 2.25-2.25 2.25H18c-8.284 0-15-6.716-15-15v-1.5z" />
                      </svg>
                      <span className="font-semibold text-sm">
                        {user?.phone_number || user?.phone || "—"}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Queue Status or Join Card */}
                {isQueueLoading ? (
                  <motion.div
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
                  >
                    {/* Skeleton UI for queue status card */}
                    <div className="animate-pulse flex flex-col gap-4">
                      <div className="h-6 w-1/3 bg-gray-100 rounded" />
                      <div className="h-4 w-1/4 bg-gray-100 rounded" />
                      <div className="h-5 w-2/3 bg-gray-100 rounded" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div className="h-16 bg-gray-100 rounded" />
                        <div className="h-16 bg-gray-100 rounded" />
                      </div>
                      <div className="h-4 w-1/2 bg-gray-100 rounded mt-4" />
                    </div>
                  </motion.div>
                ) : queueEntry ? (
                  <motion.div
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-[#25323A]">
                        Your Queue Status
                      </h3>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          queueEntry.queue_status === "called"
                            ? "bg-blue-100 text-blue-700"
                            : queueEntry.queue_status === "completed"
                            ? "bg-green-100 text-green-700"
                            : queueEntry.queue_status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {queueEntry.queue_status || "waiting"}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">
                      <span className="font-medium">Purpose:</span>{" "}
                      {queueEntry.reason}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 p-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-5 h-5 text-[#4ad294]"
                          aria-hidden="true"
                        >
                          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7 .75.75 0 00.75.75h12.5A.75.75 0 0019 21a7 7 0 00-7-7z" />
                        </svg>
                        <div>
                          <p className="text-xs text-gray-600">
                            Queue Position
                          </p>
                          <p className="text-md font-semibold">
                            {!queueEntry.queue_status ||
                            queueEntry.queue_status === "waiting"
                              ? `#${queuePosition}`
                              : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-purple-50 p-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-5 h-5 text-purple-500"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5zM11.25 6a.75.75 0 011.5 0v5.19l3.03 3.03a.75.75 0 11-1.06 1.06l-3.22-3.22A.75.75 0 0111.25 11V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div>
                          <p className="text-xs text-gray-600">
                            Est. Wait Time
                          </p>
                          <p className="text-md font-semibold">
                            {!queueEntry.queue_status ||
                            queueEntry.queue_status === "waiting"
                              ? queueEntry.estimated_time_wait ?? "Pending"
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Registered at:{" "}
                        {new Date(queueEntry.created_at).toLocaleString()}
                      </div>
                      {(!queueEntry.queue_status ||
                        queueEntry.queue_status === "waiting") && (
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-md transition-colors hover:cursor-pointer"
                        >
                          Cancel Queue Entry
                        </button>
                      )}
                    </div>
                  </motion.div>
                ) : (
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
                      onClick={() => {
                        setJoinReason("");
                        setIsJoinOpen(true);
                      }}
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
                )}

                {/* What to do next? card - only show when user has a queue entry for today */}
                {queueEntry && (
                  <motion.div
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.06 }}
                  >
                    <h3 className="text-lg font-semibold text-[#25323A] mb-4">
                      What to do next?
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3">
                        <span className="flex-none text-[#16a34a]">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="9"
                              strokeWidth="1.5"
                              className="text-[#16a34a] stroke-current"
                            />
                            <path
                              d="M9 12.5l1.8 1.8L15 10"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-[#16a34a] stroke-current"
                            />
                          </svg>
                        </span>
                        <span className="text-sm">
                          Keep your phone nearby to receive SMS notifications
                        </span>
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="flex-none text-[#16a34a]">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="9"
                              strokeWidth="1.5"
                              className="text-[#16a34a] stroke-current"
                            />
                            <path
                              d="M9 12.5l1.8 1.8L15 10"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-[#16a34a] stroke-current"
                            />
                          </svg>
                        </span>
                        <span className="text-sm">
                          Monitor this dashboard for real-time queue updates
                        </span>
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="flex-none text-[#16a34a]">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="9"
                              strokeWidth="1.5"
                              className="text-[#16a34a] stroke-current"
                            />
                            <path
                              d="M9 12.5l1.8 1.8L15 10"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-[#16a34a] stroke-current"
                            />
                          </svg>
                        </span>
                        <span className="text-sm">
                          Proceed to the clinic immediately when notified
                        </span>
                      </li>
                    </ul>
                  </motion.div>
                )}
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

      {/* Join Queue Dialog */}
      <AnimatePresence mode="wait" initial={false}>
        {isJoinOpen && (
          <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
            <DialogContent
              asChild
              className="sm:max-w-xl p-0 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-lg"
            >
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="p-6">
                  <DialogHeader className="mb-2">
                    <DialogTitle className="text-[18px] md:text-[20px] text-[#25323A]">
                      Join the Queue
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                      Please specify the purpose of your visit
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-4">
                    <label className="block text-[13px] font-medium text-[#25323A] mb-2">
                      Purpose of Visit
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g., Medical Consultation, Medical Certificate, Follow-up Checkup, First Aid"
                      className="w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4ad294] focus:border-[#4ad294] text-[14px] p-3 placeholder:text-gray-400"
                      value={joinReason}
                      onChange={(e) => setJoinReason(e.target.value)}
                    />
                  </div>

                  <div className="mt-4 flex items-start gap-3 rounded-md border border-gray-200 bg-gray-50 p-3">
                    <Image
                      src="/icons/bell.png"
                      alt="Notifications"
                      width={20}
                      height={20}
                      className="w-5 h-5 mt-[2px]"
                    />
                    <div className="text-sm">
                      <p className="font-medium text-[#25323A]">
                        You'll receive SMS notifications
                      </p>
                      <p className="text-gray-600">
                        We'll send updates to{" "}
                        {user?.phone_number ||
                          user?.phone ||
                          "your phone number"}
                      </p>
                    </div>
                  </div>

                  <DialogFooter className="mt-6">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => setIsJoinOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-semibold text-white bg-[#4ad294] hover:bg-[#3bb882] rounded-md transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                      disabled={isJoining}
                      onClick={async () => {
                        if (!joinReason.trim()) {
                          toast.error("Please enter your purpose of visit.");
                          return;
                        }

                        const token =
                          typeof window !== "undefined"
                            ? localStorage.getItem("token")
                            : null;
                        if (!token) {
                          toast.error(
                            "You are not authenticated. Please log in again."
                          );
                          return;
                        }

                        const userId = user?.id || user?.user_id || user?.uid;
                        if (!userId) {
                          toast.error("Unable to determine your user ID.");
                          return;
                        }

                        setIsJoining(true);
                        try {
                          const endpoint = `${API_BASE_URL}/queues`;
                          const response = await fetch(endpoint, {
                            method: "POST",
                            headers: {
                              Accept: "application/json",
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                              user_id: userId,
                              reason: joinReason.trim(),
                            }),
                          });

                          const data = await response.json().catch(() => ({}));
                          if (!response.ok) {
                            const message =
                              data?.message || "Failed to join the queue.";
                            throw new Error(message);
                          }

                          setIsJoinOpen(false);
                          setJoinReason("");
                          toast.success("You've joined the queue.");
                          fetchUserQueue();
                          fetchQueuePosition();
                        } catch (err) {
                          toast.error(
                            err.message ||
                              "An error occurred while joining the queue."
                          );
                        } finally {
                          setIsJoining(false);
                        }
                      }}
                    >
                      {isJoining ? "Joining..." : "Join Queue"}
                    </button>
                  </DialogFooter>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
