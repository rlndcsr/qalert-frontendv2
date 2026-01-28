"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  History,
  RefreshCw,
  Hash,
  FileText,
  Calendar,
  Clock,
  Tag,
} from "lucide-react";
import { getAuthToken, toYMD } from "../patientUtils";

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
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-24 bg-gray-200 rounded" />
            <div className="h-6 w-20 bg-gray-200 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-12 bg-gray-200 rounded-lg" />
            <div className="h-12 bg-gray-200 rounded-lg" />
            <div className="h-12 bg-gray-200 rounded-lg" />
            <div className="h-12 bg-gray-200 rounded-lg" />
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
      case "now_serving":
        return {
          label: "Now Serving",
          className: "bg-green-100 text-green-700",
        };
      case "called":
        return { label: "Called", className: "bg-blue-100 text-blue-700" };
      case "completed":
        return {
          label: "Completed",
          className: "bg-gray-100 text-gray-700 border border-gray-300",
        };
      case "cancelled":
        return { label: "Cancelled", className: "bg-red-100 text-red-700" };
      case "waiting":
      default:
        return { label: "Waiting", className: "bg-amber-100 text-amber-700" };
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

// History item info component
function HistoryInfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 bg-[#4ad294]/10 text-[#4ad294] rounded-full flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">
          {label}
        </p>
        <p className="text-sm font-medium text-gray-700 truncate">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

// History card component for individual queue entry
function HistoryCard({ entry, reasonCategories }) {
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
    const category = reasonCategories.find(
      (cat) => cat.reason_category_id === categoryId
    );
    return category?.name || "—";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition-shadow duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-[#4ad294]">
            #{formattedQueueNumber}
          </span>
          <span className="text-xs text-gray-400">
            {formatDate(entry.date || entry.created_at)}
          </span>
        </div>
        <StatusBadge status={entry.queue_status} />
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3">
        <HistoryInfoItem
          icon={Tag}
          label="Reason"
          value={getReasonCategoryName(entry.reason_category_id)}
        />
        <HistoryInfoItem
          icon={FileText}
          label="Description"
          value={entry.reason}
        />
        <HistoryInfoItem
          icon={Calendar}
          label="Date"
          value={formatDate(entry.date || entry.created_at)}
        />
        <HistoryInfoItem
          icon={Clock}
          label="Est. Wait"
          value={entry.estimated_time_wait || "N/A"}
        />
      </div>
    </motion.div>
  );
}

// Service to fetch reason categories
const fetchReasonCategories = async () => {
  const token = getAuthToken();
  const headers = {
    Accept: "application/json",
    "ngrok-skip-browser-warning": "true",
    ...(token && { Authorization: `Bearer ${token}` }),
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

  // Fetch queues and reason categories in parallel
  const [queueResponse, reasonCategories] = await Promise.all([
    fetch(`${API_BASE_URL}/queues`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
    }),
    fetchReasonCategories(),
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

  // Sort by date descending (most recent first)
  const sortedEntries = userEntries.sort((a, b) => {
    const aDate = a?.date || a?.created_at;
    const bDate = b?.date || b?.created_at;
    const aTime = aDate ? new Date(aDate).getTime() : 0;
    const bTime = bDate ? new Date(bDate).getTime() : 0;
    return bTime - aTime;
  });

  return { history: sortedEntries, reasonCategories };
};

export default function MyHistoryView() {
  const [history, setHistory] = useState([]);
  const [reasonCategories, setReasonCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { history, reasonCategories } = await fetchUserHistory();
      setHistory(history);
      setReasonCategories(reasonCategories);
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
              View your past queue entries
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
            No Queue History Yet
          </h3>
          <p className="text-gray-500 text-sm">
            You haven't joined any queues yet. Your queue history will appear
            here once you start using the service.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((entry, index) => (
            <HistoryCard
              key={entry.queue_entry_id || index}
              entry={entry}
              reasonCategories={reasonCategories}
            />
          ))}

          {/* Stats footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Showing {history.length} queue{history.length !== 1 ? "s" : ""} in
              your history
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
