"use client";

import { motion } from "framer-motion";

export default function CompletedQueueCard({ completedEntries }) {
  if (!completedEntries || completedEntries.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
        delay: 0.1,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 w-8 h-8 bg-green-50 rounded-md border border-green-200 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 text-green-600"
            >
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#25323A]">
              Today's Completed Visits
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              {completedEntries.length} completed{" "}
              {completedEntries.length === 1 ? "entry" : "entries"} today
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white text-gray-700 border border-gray-300">
          completed
        </span>
      </div>

      {/* List of Completed Entries */}
      <div className="space-y-3">
        {completedEntries.map((ce) => (
          <div
            key={ce.queue_entry_id || ce.id || ce.created_at}
            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-medium text-[#25323A] line-clamp-2">
                {ce.reason || "—"}
              </p>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white text-gray-700 border border-gray-300">
                completed
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-1">Queue Number</p>
                <p className="font-semibold text-gray-900">
                  #{ce.queue_number || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Completed At</p>
                <p className="font-semibold text-gray-900">
                  {ce.updated_at
                    ? new Date(ce.updated_at).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <div className="mt-4 text-xs text-gray-600 bg-green-50 border border-green-200 rounded-lg p-3">
        <span className="font-medium text-green-700">✓ Visit Complete</span>
        <p className="mt-1">
          Thank you for using our queueing system. Feel free to join the queue
          again if needed.
        </p>
      </div>
    </motion.div>
  );
}
