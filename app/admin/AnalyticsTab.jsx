"use client";

import { motion } from "framer-motion";

export default function AnalyticsTab({ stats }) {
  return (
    <motion.div
      key="analytics"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Analytics Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6 text-[#00968a]"
          >
            <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
          </svg>
          <h2 className="text-xl font-semibold text-[#25323A]">
            Analytics Overview
          </h2>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Track queue performance metrics and patient flow patterns
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <p className="text-xs font-medium text-blue-600 mb-1">
              Total Patients (Today)
            </p>
            <p className="text-3xl font-bold text-blue-900">
              {stats.todayTotal}
            </p>
            <p className="text-xs text-blue-600 mt-2">
              {stats.completed} completed
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <p className="text-xs font-medium text-green-600 mb-1">
              Average Wait Time
            </p>
            <p className="text-3xl font-bold text-green-900">{stats.avgWait}</p>
            <p className="text-xs text-green-600 mt-2">Estimated</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <p className="text-xs font-medium text-purple-600 mb-1">
              Currently Waiting
            </p>
            <p className="text-3xl font-bold text-purple-900">
              {stats.activeQueue}
            </p>
            <p className="text-xs text-purple-600 mt-2">In queue</p>
          </div>
        </div>
      </div>

      {/* Reports Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6 text-[#00968a]"
          >
            <path
              fillRule="evenodd"
              d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z"
              clipRule="evenodd"
            />
            <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
          </svg>
          <h2 className="text-xl font-semibold text-[#25323A]">
            Reports & Insights
          </h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Comprehensive reports for queue management analysis
        </p>

        <div className="space-y-3">
          <div className="p-4 border border-gray-200 rounded-lg hover:border-[#00968a] hover:bg-gray-50 transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-[#25323A]">
                  Daily Summary Report
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Overview of today's queue activity
                </p>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-gray-400"
              >
                <path
                  fillRule="evenodd"
                  d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg hover:border-[#00968a] hover:bg-gray-50 transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-[#25323A]">
                  Weekly Performance
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  7-day queue trends and patterns
                </p>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-gray-400"
              >
                <path
                  fillRule="evenodd"
                  d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg hover:border-[#00968a] hover:bg-gray-50 transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-[#25323A]">
                  Patient Statistics
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Detailed patient flow analytics
                </p>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-gray-400"
              >
                <path
                  fillRule="evenodd"
                  d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
