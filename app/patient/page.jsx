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

const getTodayDateString = () => {
  // Use local YYYY-MM-DD (user's local date) so "today" matches what the
  // user expects in their timezone. Server timestamps may be in UTC; we
  // normalize dates using the local date part for comparisons below.
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

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
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [updatedReason, setUpdatedReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
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
    router.push("/");
    setIsLoggingOut(true);
    // brief delay so the spinner is visible
    await new Promise((resolve) => setTimeout(resolve, 500));
    logout();
    setIsLoggingOut(false);
  };

  const handleCancelQueue = async () => {
    console.log("Attempting to cancel queue entry:", queueEntry);
    if (!queueEntry?.queue_entry_id || isCancelling) {
      console.error(
        "No queue entry ID found or already cancelling:",
        queueEntry
      );
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error("You are not authenticated. Please log in again.");
      return;
    }

    setIsCancelling(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/queues/status/${queueEntry.queue_entry_id}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            queue_status: "cancelled",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel queue entry");
      }

      setIsCancelOpen(false);
      toast.success("Queue entry cancelled successfully");
      fetchUserQueue();
      fetchQueuePosition();
    } catch (error) {
      toast.error(
        error.message || "An error occurred while cancelling the queue entry"
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const handleUpdateReason = async () => {
    if (!queueEntry?.queue_entry_id || isUpdating) {
      console.error("No queue entry ID found or already updating:", queueEntry);
      return;
    }

    if (!updatedReason.trim()) {
      toast.error("Please enter a valid reason for your visit.");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error("You are not authenticated. Please log in again.");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/queues/reason/${queueEntry.queue_entry_id}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reason: updatedReason.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || "Failed to update reason");
      }

      setIsUpdateOpen(false);
      toast.success("Queue reason updated successfully");
      fetchUserQueue();
    } catch (error) {
      toast.error(
        error.message || "An error occurred while updating the reason"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  };

  // Normalize various date inputs to YYYY-MM-DD (returns null if not parseable)
  const toYMD = (value) => {
    if (!value) return null;
    if (typeof value === "string") {
      // Already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      // Try parsing ISO / datetime strings
      const parsed = new Date(value);
      if (!isNaN(parsed)) {
        // Return the local date portion (YYYY-MM-DD) so comparisons use the
        // user's local day instead of UTC date parts.
        const yyyy = parsed.getFullYear();
        const mm = String(parsed.getMonth() + 1).padStart(2, "0");
        const dd = String(parsed.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      }
    }
    if (value instanceof Date && !isNaN(value)) {
      const yyyy = value.getFullYear();
      const mm = String(value.getMonth() + 1).padStart(2, "0");
      const dd = String(value.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
    return null;
  };

  // Convert YYYY-MM-DD string to a local Date at midnight
  const ymdToLocalDate = (ymd) => {
    if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
    const [y, m, d] = ymd.split("-").map((v) => parseInt(v, 10));
    return new Date(y, m - 1, d);
  };

  // Days difference: dateA - dateB (both YYYY-MM-DD strings) in full days
  const daysBetween = (aYmd, bYmd) => {
    const aDate = ymdToLocalDate(aYmd);
    const bDate = ymdToLocalDate(bYmd);
    if (!aDate || !bDate) return null;
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((aDate - bDate) / msPerDay);
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

      console.log("[fetchUserQueue] Raw API response:", data);
      console.log("[fetchUserQueue] Normalized list:", list);
      console.log("[fetchUserQueue] Today's date:", today);
      console.log("[fetchUserQueue] Current userId:", userId);

      // First collect entries for this user and compute their date diffs vs today
      const forUser = list
        .filter((q) => {
          const qUserId = q?.user_id ?? q?.user?.id;
          // Use == for loose equality to handle string vs number mismatch
          const matches = qUserId == userId;
          console.log(
            "[fetchUserQueue] Checking queue entry:",
            q,
            "user_id:",
            qUserId,
            "userId:",
            userId,
            "matches:",
            matches
          );
          return matches;
        })
        .map((q) => {
          const entryDate = toYMD(q?.date ?? q?.created_at);
          const diff = entryDate ? daysBetween(entryDate, today) : null;
          console.log("[fetchUserQueue] Entry date computation:", {
            rawDate: q?.date,
            rawCreatedAt: q?.created_at,
            normalizedDate: entryDate,
            diff: diff,
          });
          return { q, entryDate, diff };
        });

      console.log("[fetchUserQueue] Entries for current user:", forUser);

      // Only show entries that match TODAY exactly (diff === 0)
      const todayEntries = forUser
        .filter((x) => x.entryDate && x.diff === 0)
        .map((x) => x.q);

      console.log(
        "[fetchUserQueue] Today's entries (diff === 0):",
        todayEntries
      );

      // Sort by most recent created_at first
      const sorted = todayEntries.sort((a, b) => {
        const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });

      const selected = sorted[0] || null;

      console.log("[fetchUserQueue] Final selection:", {
        total: list.length,
        forUserCount: forUser.length,
        todayEntriesCount: todayEntries.length, // ✅ FIXED
        selected: selected,
      });

      if (selected) {
        console.log("[fetchUserQueue] ✅ Setting queue entry:", selected);
        setQueueEntry(selected);
      } else {
        console.log("[fetchUserQueue] ❌ No queue entry found for today");
        setQueueEntry(null);
        setQueuePosition(null);
      }
    } catch (e) {
      console.error("[fetchUserQueue] Error:", e);
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

      // For queue position we only want entries that are for today's local date
      const todays = list
        .filter((q) => {
          const entryDate = toYMD(q?.date ?? q?.created_at);
          if (!entryDate) return false;
          const diff = daysBetween(entryDate, today);
          const isToday = diff === 0;
          // Only include entries that are in "waiting" status
          const isWaiting = !q?.queue_status || q.queue_status === "waiting";
          return isToday && isWaiting;
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
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md py-4 border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="w-full px-8">
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
                    src="/icons/pc.png"
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
                  className="p-2 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                    delay: 0.16,
                  }}
                  title="Logout"
                >
                  <svg viewBox="0 0 512 512" className="w-5 h-5">
                    <path
                      fill="currentColor"
                      className="text-gray-600"
                      d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"
                    ></path>
                  </svg>
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full flex items-start justify-center px-8 py-16">
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
                    className="bg-gradient-to-br from-[#4ad294] to-[#3bb882] rounded-2xl shadow-lg p-8 relative overflow-hidden"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    {/* Skeleton UI for Welcome Card */}
                    <div className="animate-pulse flex flex-col gap-4">
                      <div className="h-7 w-1/2 bg-white/20 rounded mb-2" />
                      <div className="h-5 w-1/3 bg-white/20 rounded mb-2" />
                      <div className="h-5 w-1/4 bg-white/20 rounded mb-2" />
                      <div className="h-5 w-1/3 bg-white/20 rounded" />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    className="bg-gradient-to-br from-[#4ad294] via-[#3ec085] to-[#2fa872] rounded-xl shadow-md p-6 relative overflow-hidden"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    {/* Heart Rate icon - top left with circular background */}
                    <div className="absolute top-6 left-6 w-12 h-12 bg-white/15 rounded-full border-2 border-white/40 flex items-center justify-center backdrop-blur-sm">
                      <Image
                        src="/icons/heart-rate.png"
                        alt=""
                        width={48}
                        height={48}
                        className="w-6 h-6"
                        quality={100}
                      />
                    </div>

                    {/* Medical/Clean icon - top right with circular background */}
                    <div className="hidden md:flex absolute top-8 right-8 w-28 h-28 bg-white/15 rounded-full border-2 border-white/30 items-center justify-center backdrop-blur-sm">
                      <Image
                        src="/icons/sparkles.png"
                        alt=""
                        width={112}
                        height={112}
                        className="w-14 h-14"
                        quality={100}
                      />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 pl-0">
                      <h2 className="text-sm font-normal ml-16 text-white/90">
                        Welcome back,
                      </h2>
                      <h3 className="text-lg font-semibold ml-16 text-white mb-8">
                        {user?.name}
                      </h3>

                      {/* Email */}
                      <div className="flex items-center gap-2 text-white mb-2">
                        <Image
                          src="/icons/mail.png"
                          alt=""
                          width={16}
                          height={16}
                          className="w-4 h-4 flex-shrink-0"
                        />
                        <span className="text-sm font-normal">
                          {user?.email || user?.email_address}
                        </span>
                      </div>

                      {/* Phone */}
                      <div className="flex items-center gap-2 text-white mb-2">
                        <Image
                          src="/icons/telephone.png"
                          alt=""
                          width={16}
                          height={16}
                          className="w-4 h-4 flex-shrink-0"
                        />
                        <span className="text-xs font-normal">
                          {user?.phone_number || user?.phone || "—"}
                        </span>
                      </div>

                      {/* ID Number */}
                      {user?.id_number && (
                        <div className="flex items-center gap-2 text-white">
                          <Image
                            src="/icons/id.png"
                            alt=""
                            width={16}
                            height={16}
                            className="w-4 h-4 flex-shrink-0"
                          />
                          <span className="text-xs font-normal">
                            {user.id_number}
                          </span>
                        </div>
                      )}
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
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 w-8 h-8 bg-[#4ad294]/10 rounded-md border border-[#4ad294]/30 flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            className="w-5 h-5 text-[#4ad294]"
                          >
                            <path
                              d="M4 7h16M4 12h10M4 17h7"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-[#25323A] flex items-center gap-1">
                            <span>Your Queue Status</span>
                          </h3>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {queueEntry.reason}
                          </p>
                        </div>
                      </div>
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

                    {/* Metrics Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                      <div className="rounded-lg border border-[#4ad294]/30 bg-[#f5fdf8] p-4 flex items-start gap-3">
                        <div className="mt-1 w-8 h-8 bg-[#4ad294] text-white rounded-full flex items-center justify-center text-xs font-semibold">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4"
                          >
                            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7 .75.75 0 00.75.75h12.5A.75.75 0 0019 21a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                            Queue Position
                          </p>
                          <p className="text-sm font-semibold text-[#25323A] mt-1">
                            {!queueEntry.queue_status ||
                            queueEntry.queue_status === "waiting"
                              ? `#${queuePosition}`
                              : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-lg border border-[#4ad294]/30 bg-[#f5fdf8] p-4 flex items-start gap-3">
                        <div className="mt-1 w-8 h-8 bg-[#4ad294] text-white rounded-full flex items-center justify-center text-xs font-semibold">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              fillRule="evenodd"
                              d="M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5zM11.25 6a.75.75 0 011.5 0v5.19l3.03 3.03a.75.75 0 11-1.06 1.06l-3.22-3.22A.75.75 0 0111.25 11V6z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                            Est. Wait Time
                          </p>
                          <p className="text-sm font-semibold text-[#25323A] mt-1">
                            {!queueEntry.queue_status ||
                            queueEntry.queue_status === "waiting"
                              ? queueEntry.estimated_time_wait ?? "Pending"
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Notifications Banner */}
                    <div className="rounded-lg border border-[#4ad294]/20 bg-[#F0FDF4] p-4 mb-5 flex items-start gap-3">
                      <div className="w-8 h-8 bg-white border border-[#4ad294]/30 rounded-full flex items-center justify-center">
                        <Image
                          src="/icons/bell.png"
                          alt="Bell"
                          width={20}
                          height={20}
                          className="w-5 h-5"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#25323A] mb-1">
                          SMS Notifications Active
                        </p>
                        <p className="text-xs text-gray-600">
                          You'll receive real-time updates via SMS at{" "}
                          <span className="font-medium">
                            {user?.phone_number || user?.phone || "your phone"}
                          </span>
                          . Stay on this page for live queue status.
                        </p>
                      </div>
                    </div>

                    {/* Footer Row */}
                    <div className="pt-3 border-t border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          className="w-4 h-4 text-gray-400"
                        >
                          <path
                            d="M12 8v4l3 3"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle cx="12" cy="12" r="9" strokeWidth="1.3" />
                        </svg>
                        Registered at:{" "}
                        {new Date(queueEntry.created_at).toLocaleString()}
                      </div>
                      {(!queueEntry.queue_status ||
                        queueEntry.queue_status === "waiting") && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsUpdateOpen(true);
                              setTimeout(() => {
                                setUpdatedReason(queueEntry.reason);
                                const textarea =
                                  document.querySelector("textarea");
                                if (textarea) {
                                  textarea.selectionStart =
                                    textarea.selectionEnd =
                                      queueEntry.reason.length;
                                }
                              }, 100);
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded-md transition-colors hover:cursor-pointer"
                          >
                            Update Reason
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCancelOpen(true);
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-md transition-colors hover:cursor-pointer"
                          >
                            Cancel Queue Entry
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
                  >
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                      <div className="w-20 h-20 bg-[#D4F4E6] rounded-full flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-10 h-10 text-[#4ad294]"
                          aria-hidden="true"
                        >
                          <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
                        </svg>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold text-[#25323A] mb-3">
                      Join the Queue
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
                      You're not currently in the queue. Register now to get
                      your spot and receive real-time updates.
                    </p>

                    {/* Steps */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      <div className="bg-[#F0FDF4] rounded-lg p-4 border border-[#4ad294]/20">
                        <div className="w-10 h-10 bg-[#4ad294] text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-semibold">
                          1
                        </div>
                        <p className="text-xs font-medium text-[#25323A]">
                          Click Join Queue
                        </p>
                      </div>
                      <div className="bg-[#F0FDF4] rounded-lg p-4 border border-[#4ad294]/20">
                        <div className="w-10 h-10 bg-[#4ad294] text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-semibold">
                          2
                        </div>
                        <p className="text-xs font-medium text-[#25323A]">
                          State your purpose
                        </p>
                      </div>
                      <div className="bg-[#F0FDF4] rounded-lg p-4 border border-[#4ad294]/20">
                        <div className="w-10 h-10 bg-[#4ad294] text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-semibold">
                          3
                        </div>
                        <p className="text-xs font-medium text-[#25323A]">
                          Get SMS updates
                        </p>
                      </div>
                    </div>

                    {/* Button */}
                    <button
                      type="button"
                      className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#4ad294] hover:bg-[#3bb882] text-white px-8 py-3.5 rounded-lg shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md font-medium"
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
                        <path d="M6.25 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM3.25 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM19.75 7.5a.75.75 0 00-1.5 0v2.25H16a.75.75 0 000 1.5h2.25v2.25a.75.75 0 001.5 0v-2.25H22a.75.75 0 000-1.5h-2.25V7.5z" />
                      </svg>
                      <span>Join Queue Now</span>
                    </button>
                  </motion.div>
                )}

                {/* What to do next? card - shows skeleton while loading; actual content when queueEntry exists */}
                {isQueueLoading ? (
                  <motion.div
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.06 }}
                  >
                    <div className="animate-pulse space-y-4">
                      <div className="h-6 w-40 bg-gray-100 rounded" />
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-gray-100 rounded-full" />
                          <div className="h-4 w-64 bg-gray-100 rounded" />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-gray-100 rounded-full" />
                          <div className="h-4 w-72 bg-gray-100 rounded" />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-gray-100 rounded-full" />
                          <div className="h-4 w-56 bg-gray-100 rounded" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  queueEntry && (
                    <motion.div
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        ease: "easeOut",
                        delay: 0.06,
                      }}
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
                  )
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
                        const localDate = getTodayDateString();
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
                              date: localDate,
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

      {/* Cancel Queue Dialog */}
      <AnimatePresence mode="wait" initial={false}>
        {isCancelOpen && (
          <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
            <DialogContent
              asChild
              className="sm:max-w-lg p-0 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-lg"
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
                      Cancel Queue Entry
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                      Are you sure you want to cancel your queue entry? This
                      action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>

                  <DialogFooter className="mt-6">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => setIsCancelOpen(false)}
                      disabled={isCancelling}
                    >
                      No, Keep My Entry
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-semibold text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-md transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                      onClick={handleCancelQueue}
                      disabled={isCancelling}
                    >
                      {isCancelling ? "Cancelling..." : "Yes, Cancel Entry"}
                    </button>
                  </DialogFooter>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Update Reason Dialog */}
      <AnimatePresence mode="wait" initial={false}>
        {isUpdateOpen && (
          <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
            <DialogContent
              asChild
              className="sm:max-w-lg p-0 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-lg"
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
                      Update Queue Reason
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                      Please update the purpose of your visit below
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-4">
                    <label className="block text-[13px] font-medium text-[#25323A] mb-2">
                      Purpose of Visit
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g., Medical Consultation, Medical Certificate, Follow-up Checkup, First Aid"
                      className="w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 text-[14px] p-3 placeholder:text-gray-400"
                      value={updatedReason}
                      onChange={(e) => setUpdatedReason(e.target.value)}
                    />
                  </div>

                  <DialogFooter className="mt-6">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => setIsUpdateOpen(false)}
                      disabled={isUpdating}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded-md transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                      onClick={handleUpdateReason}
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Updating..." : "Update Reason"}
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
