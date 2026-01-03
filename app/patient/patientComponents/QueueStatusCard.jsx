"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function QueueStatusCard({
  queueEntry,
  queuePosition,
  user,
  getOrdinalPosition,
  onCancelClick,
  onUpdateClick,
  isLoading,
  doctorName,
}) {
  if (isLoading) {
    return (
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
    );
  }

  if (!queueEntry) {
    return null;
  }

  return (
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
              fill="currentColor"
              className="w-5 h-5 text-[#4ad294]"
            >
              <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
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
            queueEntry.queue_status === "now_serving"
              ? "bg-green-100 text-green-700"
              : queueEntry.queue_status === "called"
              ? "bg-blue-100 text-blue-700"
              : queueEntry.queue_status === "completed"
              ? "bg-white text-gray-700 border border-gray-300"
              : queueEntry.queue_status === "cancelled"
              ? "bg-red-100 text-red-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {queueEntry.queue_status === "now_serving"
            ? "now serving"
            : queueEntry.queue_status === "called"
            ? "called"
            : queueEntry.queue_status || "waiting"}
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="rounded-lg border border-[#4ad294]/30 bg-[#f5fdf8] p-4 flex items-start gap-3">
          <div className="mt-1 w-8 h-8 bg-[#4ad294] text-white rounded-full flex items-center justify-center text-xs font-semibold">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" />
              <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
              Queue Number
            </p>
            <p className="text-xs font-semibold text-[#25323A] mt-1">
              {queueEntry.queue_number
                ? String(queueEntry.queue_number).padStart(3, "0")
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
                d="M2.625 6.75a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875 0A.75.75 0 0 1 8.25 6h12a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1-.75-.75ZM2.625 12a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0ZM7.5 12a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-12A.75.75 0 0 1 7.5 12Zm-4.875 5.25a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875 0a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1-.75-.75Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
              Queue Position
            </p>
            <p className="text-xs font-semibold text-[#25323A] mt-1">
              {queueEntry.queue_status === "now_serving"
                ? "Now Serving"
                : !queueEntry.queue_status ||
                  queueEntry.queue_status === "waiting"
                ? queuePosition !== null
                  ? getOrdinalPosition(queuePosition)
                  : ""
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
              <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
              Doctor on Duty
            </p>
            <p className="text-xs font-semibold text-[#25323A] mt-1">
              {doctorName || "—"}
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
          {new Date(queueEntry.created_at).toLocaleString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        {(!queueEntry.queue_status ||
          queueEntry.queue_status === "waiting") && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onUpdateClick}
              className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded-md transition-colors hover:cursor-pointer"
            >
              Update Reason
            </button>
            <button
              type="button"
              onClick={onCancelClick}
              className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-md transition-colors hover:cursor-pointer"
            >
              Cancel Queue Entry
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
