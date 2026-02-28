"use client";

import { motion } from "framer-motion";

export default function WhatToDoNextCard({ queueEntry, isLoading }) {
  if (isLoading) {
    return (
      <motion.div
        className="relative overflow-hidden bg-white/95 rounded-2xl shadow-sm border border-[#4ad294]/20 p-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.06 }}
      >
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#4ad294] via-[#64dca6] to-[#4ad294]" />
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
    );
  }

  if (!queueEntry) {
    return null;
  }

  return (
    <motion.div
      className="relative overflow-hidden bg-white/95 rounded-2xl shadow-sm border border-[#4ad294]/20 p-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
        delay: 0.06,
      }}
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#4ad294] via-[#64dca6] to-[#4ad294]" />
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
            Monitor the queue display screen for real-time queue updates
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
  );
}
