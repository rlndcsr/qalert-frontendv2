"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  History,
  RefreshCw,
  FileText,
  Calendar,
  Tag,
  Stethoscope,
} from "lucide-react";
import { getAuthToken } from "../patientUtils";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_APP_BASE_URL ||
  "https://intercarpellary-rosana-indivisibly.ngrok-free.dev/api";

// Skeleton card component for loading state
function HistoryCardSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 animate-pulse"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 w-32 bg-gray-200 rounded" />
            <div className="h-6 w-20 bg-gray-200 rounded-full" />
          </div>
          <div className="h-4 w-3/4 bg-gray-200 rounded mb-4" />
          <div className="flex items-center gap-4">
            <div className="h-4 w-28 bg-gray-200 rounded" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Status badge component
function StatusBadge({ status }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case "completed":
        return {
          label: "Completed",
          className: "bg-green-100 text-green-700",
        };
      case "cancelled":
        return { label: "Cancelled", className: "bg-red-100 text-red-700" };
      default:
        return {
          label: status || "Unknown",
          className: "bg-gray-100 text-gray-700",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`text-xs font-semibold px-3 py-1 rounded-full ${config.className}`}
    >
      {config.label}
    </span>
  );
}

// History card component for individual queue entry
function HistoryCard({ entry, reasonCategories, doctorName }) {
  const formattedQueueNumber = entry.queue_number
    ? String(entry.queue_number).padStart(3, "0")
    : "—";

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    if (isNaN(date)) return "—";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get reason category name from ID
  const getReasonCategoryName = (categoryId) => {
    if (!categoryId || !reasonCategories || reasonCategories.length === 0) {
      return "—";
    }
    // Handle both string and number comparison
    const category = reasonCategories.find(
      (cat) => String(cat.reason_category_id) === String(categoryId)
    );
    return category?.name || category?.category_name || "—";
  };

  // Get the reason category ID - check multiple possible field names
  const reasonCategoryId =
    entry.reason_category_id || entry.reason_id || entry.category_id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition-shadow duration-200"
    >
      {/* Header with Queue Number and Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-[#4ad294]">
            #{formattedQueueNumber}
          </span>
        </div>
        <StatusBadge status={entry.queue_status} />
      </div>

      {/* Reason Category (Main Label) */}
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-1">
          <Tag className="w-4 h-4 text-[#4ad294]" />
          <span className="text-base font-semibold text-gray-900">
            {getReasonCategoryName(reasonCategoryId)}
          </span>
        </div>
      </div>

      {/* Reason Description (Secondary Text) */}
      {entry.reason && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 pl-6">{entry.reason}</p>
        </div>
      )}

      {/* Metadata Row: Doctor and Date */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
        {doctorName && (
          <div className="flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-gray-400" />
            <span>{doctorName}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span>{formatDate(entry.date || entry.created_at)}</span>
        </div>
      </div>
    </motion.div>
  );
}

// Service to fetch reason categories
const fetchReasonCategories = async () => {
  const headers = {
    Accept: "application/json",
    "ngrok-skip-browser-warning": "true",
  };

  try {
    const response = await fetch(`${API_BASE_URL}/reason-categories`, {
      headers,
    });

    if (!response.ok) {
      console.warn("Failed to fetch reason categories");
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data?.data || [];
  } catch (err) {
    console.warn("Error fetching reason categories:", err);
    return [];
  }
};

// Service to fetch doctors
const fetchDoctors = async () => {
  const headers = {
    Accept: "application/json",
    "ngrok-skip-browser-warning": "true",
  };

  try {
    const response = await fetch(`${API_BASE_URL}/doctors`, { headers });

    if (!response.ok) {
      console.warn("Failed to fetch doctors");
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data?.data || [];
  } catch (err) {
    console.warn("Error fetching doctors:", err);
    return [];
  }
};

// Service to fetch doctor schedules
const fetchDoctorSchedules = async () => {
  const headers = {
    Accept: "application/json",
    "ngrok-skip-browser-warning": "true",
  };

  try {
    const response = await fetch(`${API_BASE_URL}/doctor-schedule`, {
      headers,
    });

    if (!response.ok) {
      console.warn("Failed to fetch doctor schedules");
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data?.data || [];
  } catch (err) {
    console.warn("Error fetching doctor schedules:", err);
    return [];
  }
};

// Helper function to resolve doctor name from schedule_id
const resolveDoctorName = (scheduleId, doctorSchedules, doctors) => {
  if (!scheduleId || !doctorSchedules || !doctors) return null;

  // Find the doctor-schedule entry that matches this schedule_id
  const doctorSchedule = doctorSchedules.find(
    (ds) => ds.schedule_id === scheduleId
  );

  if (!doctorSchedule) return null;

  // Find the doctor that matches the doctor_id
  const doctor = doctors.find(
    (doc) => doc.doctor_id === doctorSchedule.doctor_id
  );

  return doctor?.doctor_name || null;
};

// Service to fetch user's queue history
const fetchUserHistory = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  // Get user data from localStorage
  const userDataStr = localStorage.getItem("userData");
  if (!userDataStr) {
    throw new Error("User data not found");
  }

  const userData = JSON.parse(userDataStr);
  const userId = userData?.id || userData?.user_id || userData?.uid;
  if (!userId) {
    throw new Error("User ID not found");
  }

  // Fetch all required data in parallel
  const [queueResponse, reasonCategories, doctors, doctorSchedules] =
    await Promise.all([
      fetch(`${API_BASE_URL}/queues`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      }),
      fetchReasonCategories(),
      fetchDoctors(),
      fetchDoctorSchedules(),
    ]);

  if (!queueResponse.ok) {
    throw new Error("Failed to fetch queue history");
  }

  const data = await queueResponse.json();
  const list = Array.isArray(data)
    ? data
    : data?.data || data?.queues || data?.items || [];

  // Filter for current user's entries only
  const userEntries = list.filter((q) => {
    const qUserId = q?.user_id ?? q?.user?.id;
    return qUserId == userId;
  });

  // Filter to only show completed or cancelled entries
  const finishedEntries = userEntries.filter((q) => {
    const status = q?.queue_status?.toLowerCase();
    return status === "completed" || status === "cancelled";
  });

  // Sort by date descending (most recent first)
  const sortedEntries = finishedEntries.sort((a, b) => {
    const aDate = a?.date || a?.created_at;
    const bDate = b?.date || b?.created_at;
    const aTime = aDate ? new Date(aDate).getTime() : 0;
    const bTime = bDate ? new Date(bDate).getTime() : 0;
    return bTime - aTime;
  });

  return { history: sortedEntries, reasonCategories, doctors, doctorSchedules };
};

export default function MyHistoryView() {
  const [history, setHistory] = useState([]);
  const [reasonCategories, setReasonCategories] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doctorSchedules, setDoctorSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { history, reasonCategories, doctors, doctorSchedules } =
        await fetchUserHistory();
      setHistory(history);
      setReasonCategories(reasonCategories);
      setDoctors(doctors);
      setDoctorSchedules(doctorSchedules);
    } catch (err) {
      console.error("Error fetching history:", err);
      setError(err.message || "Failed to load history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <motion.div
      key="history"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#4ad294]/10 flex items-center justify-center">
            <History className="w-5 h-5 text-[#4ad294]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My History</h1>
            <p className="text-sm text-gray-500">
              View your completed and cancelled visits
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
          title="Refresh"
        >
          <RefreshCw
            className={`w-5 h-5 text-gray-500 ${
              isLoading ? "animate-spin" : ""
            }`}
          />
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <HistoryCardSkeleton />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-medium mb-2">Error loading history</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <History className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No Visit History Yet
          </h3>
          <p className="text-gray-500 text-sm">
            Your completed and cancelled visits will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((entry, index) => (
            <HistoryCard
              key={entry.queue_entry_id || index}
              entry={entry}
              reasonCategories={reasonCategories}
              doctorName={resolveDoctorName(
                entry.schedule_id,
                doctorSchedules,
                doctors
              )}
            />
          ))}

          {/* Stats footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Showing {history.length} visit{history.length !== 1 ? "s" : ""} in
              your history
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
