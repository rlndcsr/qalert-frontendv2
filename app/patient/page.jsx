"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Menu, ArrowLeft } from "lucide-react";
import LoginForm from "./patientComponents/LoginForm";
import RegisterForm from "./patientComponents/RegisterForm";
import VerifyEmailForm from "./patientComponents/VerifyEmailForm";
import WelcomeCard from "./patientComponents/WelcomeCard";
import QueueStatusCard from "./patientComponents/QueueStatusCard";
import JoinQueueCard from "./patientComponents/JoinQueueCard";
import CompletedQueueCard from "./patientComponents/CompletedQueueCard";
import WhatToDoNextCard from "./patientComponents/WhatToDoNextCard";
import JoinQueueDialog from "./patientComponents/JoinQueueDialog";
import CancelQueueDialog from "./patientComponents/CancelQueueDialog";
import UpdateReasonDialog from "./patientComponents/UpdateReasonDialog";
import PatientSidebar from "./patientComponents/PatientSidebar";
import PlaceholderView from "./patientComponents/views/PlaceholderView";
import MyDoctorsView from "./patientComponents/views/MyDoctorsView";
import AppointmentQueueView from "./patientComponents/views/AppointmentQueueView";
import MyHistoryView from "./patientComponents/views/MyHistoryView";
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

  // Initialize activeView from localStorage or default to "home"
  const [activeView, setActiveView] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("patientActiveView") || "home";
    }
    return "home";
  });

  // Persist activeView to localStorage whenever it changes
  const handleViewChange = (view) => {
    setActiveView(view);
    if (typeof window !== "undefined") {
      localStorage.setItem("patientActiveView", view);
    }
  };

  const [activeTab, setActiveTab] = useState("login");
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
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
  const [onDutyDoctor, setOnDutyDoctor] = useState(null);
  const [isLoadingDoctor, setIsLoadingDoctor] = useState(false);
  const [isFetchingDoctor, setIsFetchingDoctor] = useState(false);
  const [doctorsData, setDoctorsData] = useState([]);
  const [doctorSchedulesData, setDoctorSchedulesData] = useState([]);

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
    // This is now called after registration success
    // The switch to verify tab is handled by handleRegistrationSuccess
  };

  const handleRegistrationSuccess = (email) => {
    setPendingVerificationEmail(email);
    setActiveTab("verify");
    toast.success(
      "Registration successful! Please verify your email to continue.",
    );
  };

  const handleVerificationSuccess = () => {
    setPendingVerificationEmail("");
    setActiveTab("login");
  };

  const handleBackToRegister = () => {
    setPendingVerificationEmail("");
    setActiveTab("register");
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
          "ngrok-skip-browser-warning": true,
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
          "ngrok-skip-browser-warning": true,
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
            "ngrok-skip-browser-warning": true,
          },
          body: JSON.stringify({ queue_status: "cancelled" }),
        },
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
        error.message || "An error occurred while cancelling the queue entry",
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
            "ngrok-skip-browser-warning": true,
          },
          body: JSON.stringify({ reason: updatedReason.trim() }),
        },
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
        error.message || "An error occurred while updating the reason",
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
          "ngrok-skip-browser-warning": true,
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
        activeStatuses.has(q?.queue_status),
      );
      const completedEntries = todayEntries.filter(
        (q) => q?.queue_status === "completed",
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
          "ngrok-skip-browser-warning": true,
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
        (q) => (q?.user_id ?? q?.user?.id) === userId,
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

  const fetchOnDutyDoctor = async () => {
    // Prevent multiple simultaneous calls
    if (isFetchingDoctor) {
      console.log("[fetchOnDutyDoctor] Already fetching, skipping...");
      return;
    }

    setIsFetchingDoctor(true);
    setIsLoadingDoctor(true);
    try {
      // Get current day and shift
      const now = new Date();
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const currentDay = dayNames[now.getDay()];

      // Determine shift: AM if before 12:00 PM, PM if after 12:00 PM
      const currentHour = now.getHours();
      const currentShift = currentHour < 12 ? "AM" : "PM";

      console.log(
        "[fetchOnDutyDoctor] Current day:",
        currentDay,
        "Shift:",
        currentShift,
      );

      // Use the backend URL
      const backendBaseUrl =
        "https://intercarpellary-rosana-indivisibly.ngrok-free.dev/api";

      // Fetch all three APIs in parallel
      const [doctorsResponse, schedulesResponse, doctorSchedulesResponse] =
        await Promise.all([
          fetch(`${backendBaseUrl}/doctors`, {
            headers: {
              Accept: "application/json",
              "ngrok-skip-browser-warning": true,
            },
          }),
          fetch(`${backendBaseUrl}/schedules`, {
            headers: {
              Accept: "application/json",
              "ngrok-skip-browser-warning": true,
            },
          }),
          fetch(`${backendBaseUrl}/doctor-schedule`, {
            headers: {
              Accept: "application/json",
              "ngrok-skip-browser-warning": true,
            },
          }),
        ]);

      // Check each response individually and handle errors gracefully
      if (!doctorsResponse.ok) {
        const errorText = await doctorsResponse.text().catch(() => "");
        console.warn("[fetchOnDutyDoctor] Doctors API failed:", {
          status: doctorsResponse.status,
          statusText: doctorsResponse.statusText,
          error: errorText,
        });
        setOnDutyDoctor(null);
        setIsLoadingDoctor(false);
        setIsFetchingDoctor(false);
        return;
      }

      if (!schedulesResponse.ok) {
        const errorText = await schedulesResponse.text().catch(() => "");
        console.warn("[fetchOnDutyDoctor] Schedules API failed:", {
          status: schedulesResponse.status,
          statusText: schedulesResponse.statusText,
          error: errorText,
        });
        setOnDutyDoctor(null);
        setIsLoadingDoctor(false);
        setIsFetchingDoctor(false);
        return;
      }

      let doctorSchedules;
      if (!doctorSchedulesResponse.ok) {
        const errorText = await doctorSchedulesResponse.text().catch(() => "");
        console.warn(
          "[fetchOnDutyDoctor] Doctor-schedule API failed, trying alternative:",
          {
            status: doctorSchedulesResponse.status,
            statusText: doctorSchedulesResponse.statusText,
            error: errorText,
            url: `${backendBaseUrl}/doctor-schedule`,
          },
        );

        // Try alternative endpoint name (doctor_schedules with underscore)
        console.log(
          "[fetchOnDutyDoctor] Trying alternative endpoint: doctor_schedules",
        );
        const altResponse = await fetch(`${backendBaseUrl}/doctor_schedules`, {
          headers: {
            Accept: "application/json",
            "ngrok-skip-browser-warning": true,
          },
        });

        if (!altResponse.ok) {
          const altErrorText = await altResponse.text().catch(() => "");
          console.warn(
            "[fetchOnDutyDoctor] Alternative endpoint also failed:",
            {
              status: altResponse.status,
              statusText: altResponse.statusText,
              error: altErrorText,
            },
          );
          setOnDutyDoctor(null);
          setIsLoadingDoctor(false);
          setIsFetchingDoctor(false);
          return;
        }

        doctorSchedules = await altResponse.json();
      } else {
        doctorSchedules = await doctorSchedulesResponse.json();
      }

      const doctors = await doctorsResponse.json();
      const schedules = await schedulesResponse.json();

      // Store doctors and doctorSchedules for later use
      setDoctorsData(doctors || []);
      setDoctorSchedulesData(doctorSchedules || []);

      console.log("[fetchOnDutyDoctor] Data fetched:", {
        doctorsCount: doctors?.length,
        schedulesCount: schedules?.length,
        doctorSchedulesCount: doctorSchedules?.length,
      });

      // Find the schedule that matches current day and shift
      const matchingSchedule = schedules.find(
        (schedule) =>
          schedule.day === currentDay && schedule.shift === currentShift,
      );

      console.log("[fetchOnDutyDoctor] Matching schedule:", matchingSchedule);

      if (!matchingSchedule) {
        console.log("[fetchOnDutyDoctor] No matching schedule found");
        setOnDutyDoctor(null);
        setIsLoadingDoctor(false);
        setIsFetchingDoctor(false);
        return;
      }

      // Find the doctor_schedule that matches the schedule_id
      const matchingDoctorSchedule = doctorSchedules.find(
        (ds) => ds.schedule_id === matchingSchedule.schedule_id,
      );

      console.log(
        "[fetchOnDutyDoctor] Matching doctor schedule:",
        matchingDoctorSchedule,
      );

      if (!matchingDoctorSchedule) {
        console.log("[fetchOnDutyDoctor] No matching doctor schedule found");
        setOnDutyDoctor(null);
        setIsLoadingDoctor(false);
        setIsFetchingDoctor(false);
        return;
      }

      // Find the doctor that matches the doctor_id
      const doctor = doctors.find(
        (doc) =>
          doc.doctor_id === matchingDoctorSchedule.doctor_id &&
          doc.is_active === 1,
      );

      console.log("[fetchOnDutyDoctor] Found doctor:", doctor);

      if (doctor) {
        // Convert day abbreviation to full day name
        const dayNameMap = {
          Mon: "Monday",
          Tue: "Tuesday",
          Wed: "Wednesday",
          Thu: "Thursday",
          Fri: "Friday",
          Sat: "Saturday",
          Sun: "Sunday",
        };
        const fullDayName = dayNameMap[currentDay] || currentDay;

        setOnDutyDoctor({
          name: doctor.doctor_name,
          shift: currentShift,
          day: fullDayName,
        });
        console.log("[fetchOnDutyDoctor] Doctor set:", doctor.doctor_name);
      } else {
        console.log("[fetchOnDutyDoctor] No active doctor found");
        setOnDutyDoctor(null);
      }
    } catch (error) {
      console.warn("[fetchOnDutyDoctor] Error:", error);
      setOnDutyDoctor(null);
    } finally {
      setIsLoadingDoctor(false);
      setIsFetchingDoctor(false);
    }
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      fetchUserQueue();
      fetchQueuePosition();
      fetchOnDutyDoctor();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, user?.user_id, user?.id_number]);

  // Refresh doctor info when dialog opens
  useEffect(() => {
    if (isJoinOpen && isAuthenticated) {
      fetchOnDutyDoctor();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isJoinOpen, isAuthenticated]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 font-sans flex flex-col overflow-x-hidden">
      {isAuthenticated && (
        <PatientSidebar
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
          activeView={activeView}
          onViewChange={handleViewChange}
          isExpanded={isSidebarExpanded}
          onExpandedChange={setIsSidebarExpanded}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Header with Hamburger */}
      {isAuthenticated && (
        <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-sm border-b border-gray-200/50 z-30 flex items-center px-4">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-sm font-semibold text-[#25323A]">QAlert</span>
          </div>
          <div className="w-10" /> {/* Spacer for balance */}
        </header>
      )}

      <main
        className={`flex-1 w-full flex items-start justify-center px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 transition-all duration-200 overflow-x-hidden ${
          isAuthenticated
            ? `pt-20 lg:pt-16 lg:pl-16 ${
                isSidebarExpanded ? "lg:pl-60" : "lg:pl-16"
              }`
            : ""
        }`}
      >
        <div className="max-w-5xl w-full flex justify-center items-start">
          {isLoading ? (
            <motion.div
              className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 sm:p-8 w-full max-w-md text-center"
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
              className={`bg-white rounded-lg shadow-lg border border-gray-200 p-6 sm:p-8 w-full ${
                activeTab === "register" ? "max-w-md lg:max-w-4xl" : "max-w-md"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              key="guest"
            >
              {activeTab !== "verify" && (
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-gray-600 hover:text-[#25323A] mb-4 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Back</span>
                </button>
              )}
              {activeTab !== "verify" && (
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
              )}

              <AnimatePresence mode="wait" initial={false}>
                {activeTab === "login" ? (
                  <LoginForm onSubmit={handleLogin} isLoading={isLoggingIn} />
                ) : activeTab === "register" ? (
                  <RegisterForm
                    onSubmit={handleRegister}
                    onRegistrationSuccess={handleRegistrationSuccess}
                  />
                ) : activeTab === "verify" ? (
                  <VerifyEmailForm
                    email={pendingVerificationEmail}
                    onVerified={handleVerificationSuccess}
                    onBack={handleBackToRegister}
                  />
                ) : null}
              </AnimatePresence>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              {activeView === "home" ? (
                <motion.div
                  className="w-full max-w-5xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  key="home"
                >
                  <div className="space-y-4 sm:space-y-6">
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
                        doctorName={(() => {
                          if (!queueEntry?.schedule_id) return null;
                          const doctorSchedule = doctorSchedulesData.find(
                            (ds) => ds.schedule_id === queueEntry.schedule_id,
                          );
                          if (!doctorSchedule) return null;
                          const doctor = doctorsData.find(
                            (doc) => doc.doctor_id === doctorSchedule.doctor_id,
                          );
                          return doctor?.doctor_name || null;
                        })()}
                      />
                    ) : (
                      <JoinQueueCard
                        onJoinClick={() => {
                          setJoinReason("");
                          setJoinReasonCategory("");
                          setJoinReasonError("");
                          setJoinReasonCategoryError("");
                          // Fetch doctor info before opening dialog
                          fetchOnDutyDoctor();
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
              ) : activeView === "doctors" ? (
                <MyDoctorsView key="doctors" />
              ) : activeView === "queue" ? (
                <AppointmentQueueView key="queue" />
              ) : activeView === "history" ? (
                <MyHistoryView key="history" />
              ) : null}
            </AnimatePresence>
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
        onDutyDoctor={onDutyDoctor}
        isLoadingDoctor={isLoadingDoctor}
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
