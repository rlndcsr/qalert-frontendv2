"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import LoginForm from "./patientComponents/LoginForm";
import RegisterForm from "./patientComponents/RegisterForm";
import PatientHeader from "./patientComponents/PatientHeader";
import WelcomeCard from "./patientComponents/WelcomeCard";
import QueueStatusCard from "./patientComponents/QueueStatusCard";
import JoinQueueCard from "./patientComponents/JoinQueueCard";
import CompletedQueueCard from "./patientComponents/CompletedQueueCard";
import WhatToDoNextCard from "./patientComponents/WhatToDoNextCard";
import JoinQueueDialog from "./patientComponents/JoinQueueDialog";
import CancelQueueDialog from "./patientComponents/CancelQueueDialog";
import UpdateReasonDialog from "./patientComponents/UpdateReasonDialog";
import {
  getTodayDateString,
  getOrdinalPosition,
  toYMD,
  daysBetween,
  getAuthToken,
} from "./patientComponents/patientUtils";
import { useAuth } from "../hooks/useAuth";
import { useSystemStatus } from "../hooks/useSystemStatus";
import { SyncLoader } from "react-spinners";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_APP_BASE_URL ||
  "https://intercarpellary-rosana-indivisibly.ngrok-free.dev/api";

export default function PatientPage() {
  const router = useRouter();
  const { isOnline, isLoading: isStatusLoading } = useSystemStatus();

  useEffect(() => {
    if (!isStatusLoading && !isOnline) {
      router.replace("/");
    }
  }, [isStatusLoading, isOnline, router]);

  const {
    isAuthenticated,
    user,
    isLoading,
    isLoggingIn,
    loginWithAPI,
    logout,
  } = useAuth();

  const [activeTab, setActiveTab] = useState("login");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinReason, setJoinReason] = useState("");
  const [joinReasonCategory, setJoinReasonCategory] = useState("");
  const [joinReasonError, setJoinReasonError] = useState("");
  const [joinReasonCategoryError, setJoinReasonCategoryError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [queueEntry, setQueueEntry] = useState(null);
  const [completedEntry, setCompletedEntry] = useState(null);
  const [completedEntries, setCompletedEntries] = useState([]);
  const [queuePosition, setQueuePosition] = useState(null);
  const [isQueueLoading, setIsQueueLoading] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [updatedReason, setUpdatedReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLogin = async (formData) => {
    if (isLoggingIn) return;

    try {
      const result = await loginWithAPI(formData.login, formData.password);
      if (result.success) {
        toast.success("Login successful! Welcome back.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred during login");
    }
  };

  const handleRegister = (formData) => {
    setActiveTab("login");
    toast.success(
      "Registration successful! Please log in with your credentials."
    );
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    logout();
    setIsLoggingOut(false);
  };

  const handleJoinQueue = async () => {
    const localDate = getTodayDateString();

    // Clear previous errors
    setJoinReasonCategoryError("");
    setJoinReasonError("");

    // Validate fields
    let hasError = false;

    if (!joinReasonCategory) {
      setJoinReasonCategoryError("Please select a purpose of visit.");
      hasError = true;
    }

    if (!joinReason.trim()) {
      setJoinReasonError("Please enter a description.");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error("You are not authenticated. Please log in again.");
      return;
    }

    const userId = user?.id || user?.user_id || user?.uid;
    if (!userId) {
      toast.error("Unable to determine your user ID.");
      return;
    }

    setIsJoining(true);
    try {
      // Fetch current queue to calculate wait time
      const queueResponse = await fetch(`${API_BASE_URL}/queues`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        method: "GET",
      });

      let estimatedWaitTime = "10 mins";

      if (queueResponse.ok) {
        const queueData = await queueResponse.json();
        const list = Array.isArray(queueData)
          ? queueData
          : queueData?.data || queueData?.queues || queueData?.items || [];
        const today = getTodayDateString();

        // Count today's waiting entries
        const todaysWaitingCount = list.filter((q) => {
          const entryDate = toYMD(q?.date ?? q?.created_at);
          if (!entryDate) return false;
          const diff = daysBetween(entryDate, today);
          const isToday = diff === 0;
          const isWaiting = !q?.queue_status || q.queue_status === "waiting";
          return isToday && isWaiting;
        }).length;

        // Calculate wait time: (position + 1) * 10 minutes
        const waitMinutes = (todaysWaitingCount + 1) * 10;
        estimatedWaitTime = `${waitMinutes} mins`;
      }

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
          reason_category_id: parseInt(joinReasonCategory),
          date: localDate,
          estimated_time_wait: estimatedWaitTime,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        let message = data?.message || "Failed to join the queue.";
        // Map database errors to field-specific error states
        if (
          message.toLowerCase().includes("invalid reason category") ||
          message.toLowerCase().includes("reason_category")
        ) {
          setJoinReasonCategoryError("Invalid Purpose of Visit.");
          return;
        } else if (
          message.toLowerCase().includes("reason") &&
          !message.toLowerCase().includes("category")
        ) {
          setJoinReasonError(message);
          return;
        } else {
          toast.error(message);
          return;
        }
      }

      setIsJoinOpen(false);
      setJoinReason("");
      setJoinReasonCategory("");
      setJoinReasonError("");
      setJoinReasonCategoryError("");
      toast.success("You've joined the queue.");
      fetchUserQueue();
      fetchQueuePosition();
    } catch (err) {
      let errorMessage =
        err.message || "An error occurred while joining the queue.";
      toast.error(errorMessage);
    } finally {
      setIsJoining(false);
    }
  };

  const handleCancelQueue = async () => {
    if (!queueEntry?.queue_entry_id || isCancelling) return;

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
          body: JSON.stringify({ queue_status: "cancelled" }),
        }
      );

      if (!response.ok) throw new Error("Failed to cancel queue entry");

      setIsCancelOpen(false);
      toast.success("Queue entry cancelled successfully");
      setQueueEntry(null);
      setQueuePosition(null);
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
    if (!queueEntry?.queue_entry_id || isUpdating) return;

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
          body: JSON.stringify({ reason: updatedReason.trim() }),
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

      const forUser = list
        .filter((q) => {
          const qUserId = q?.user_id ?? q?.user?.id;
          return qUserId == userId;
        })
        .map((q) => {
          const entryDate = toYMD(q?.date ?? q?.created_at);
          const diff = entryDate ? daysBetween(entryDate, today) : null;
          return { q, entryDate, diff };
        });

      const activeStatuses = new Set([
        "waiting",
        "called",
        "now_serving",
        undefined,
        null,
        "",
      ]);

      const todayEntries = forUser
        .filter((x) => x.entryDate && x.diff === 0)
        .map((x) => x.q);

      const activeEntries = todayEntries.filter((q) =>
        activeStatuses.has(q?.queue_status)
      );
      const completedEntries = todayEntries.filter(
        (q) => q?.queue_status === "completed"
      );

      const sortedActive = activeEntries.sort((a, b) => {
        const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });

      const sortedCompleted = completedEntries.sort((a, b) => {
        const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });

      const selectedActive = sortedActive[0] || null;

      if (selectedActive) {
        setQueueEntry(selectedActive);
        setCompletedEntry(null);
        setCompletedEntries([]);
      } else {
        setQueueEntry(null);
        setQueuePosition(null);
        if (sortedCompleted && sortedCompleted.length > 0) {
          setCompletedEntry(sortedCompleted[0]);
          setCompletedEntries(sortedCompleted);
        } else {
          setCompletedEntry(null);
          setCompletedEntries([]);
        }
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

      const todays = list
        .filter((q) => {
          const entryDate = toYMD(q?.date ?? q?.created_at);
          if (!entryDate) return false;
          const diff = daysBetween(entryDate, today);
          const isToday = diff === 0;
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

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      fetchUserQueue();
      fetchQueuePosition();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, user?.user_id, user?.id_number]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 font-sans flex flex-col">
      <PatientHeader
        isAuthenticated={isAuthenticated}
        user={user}
        isLoggingOut={isLoggingOut}
        onLogout={handleLogout}
      />

      <main className="flex-1 w-full flex items-start justify-center px-8 py-16">
        <div className="max-w-6xl mx-auto w-full flex justify-center items-start">
          {isLoading ? (
            <motion.div
              className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 w-full max-w-md text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex flex-col gap-6">
                <div className="animate-pulse bg-gray-100 rounded-xl h-32 w-full mb-2" />
                <div className="animate-pulse bg-gray-100 rounded-xl h-40 w-full mb-2" />
                <div className="animate-pulse bg-gray-100 rounded-xl h-32 w-full" />
              </div>
            </motion.div>
          ) : !isAuthenticated ? (
            <motion.div
              className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 w-full max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              key="guest"
            >
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

              <AnimatePresence mode="wait" initial={false}>
                {activeTab === "login" ? (
                  <LoginForm onSubmit={handleLogin} isLoading={isLoggingIn} />
                ) : (
                  <RegisterForm onSubmit={handleRegister} />
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              className="w-full max-w-5xl -mt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              key="authed"
            >
              <div className="space-y-6">
                <WelcomeCard user={user} isLoading={isQueueLoading} />

                {isQueueLoading ? (
                  <QueueStatusCard isLoading={true} />
                ) : queueEntry ? (
                  <QueueStatusCard
                    queueEntry={queueEntry}
                    queuePosition={queuePosition}
                    user={user}
                    getOrdinalPosition={getOrdinalPosition}
                    onCancelClick={() => setIsCancelOpen(true)}
                    onUpdateClick={() => {
                      setIsUpdateOpen(true);
                      setTimeout(() => {
                        setUpdatedReason(queueEntry.reason);
                      }, 100);
                    }}
                    isLoading={false}
                  />
                ) : (
                  <JoinQueueCard
                    onJoinClick={() => {
                      setJoinReason("");
                      setJoinReasonCategory("");
                      setJoinReasonError("");
                      setJoinReasonCategoryError("");
                      setIsJoinOpen(true);
                    }}
                  />
                )}

                <CompletedQueueCard completedEntries={completedEntries} />

                <WhatToDoNextCard
                  queueEntry={queueEntry}
                  isLoading={isQueueLoading}
                />
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

      <JoinQueueDialog
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        joinReason={joinReason}
        setJoinReason={setJoinReason}
        joinReasonCategory={joinReasonCategory}
        setJoinReasonCategory={setJoinReasonCategory}
        joinReasonError={joinReasonError}
        setJoinReasonError={setJoinReasonError}
        joinReasonCategoryError={joinReasonCategoryError}
        setJoinReasonCategoryError={setJoinReasonCategoryError}
        isJoining={isJoining}
        onSubmit={handleJoinQueue}
        user={user}
      />

      <CancelQueueDialog
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        queueEntry={queueEntry}
        queuePosition={queuePosition}
        isCancelling={isCancelling}
        onConfirm={handleCancelQueue}
      />

      <UpdateReasonDialog
        isOpen={isUpdateOpen}
        onClose={() => setIsUpdateOpen(false)}
        updatedReason={updatedReason}
        setUpdatedReason={setUpdatedReason}
        isUpdating={isUpdating}
        onSubmit={handleUpdateReason}
      />
    </div>
  );
}
