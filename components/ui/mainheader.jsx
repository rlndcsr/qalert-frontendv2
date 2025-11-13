"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "../../app/hooks/useAuth";
import { useSystemStatus } from "../../app/hooks/useSystemStatus";

export default function MainHeader() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { isOnline, isLoading } = useSystemStatus();

  return (
    <>
      {/* Offline Banner */}
      {!isOnline && !isLoading && (
        <motion.div
          className="bg-red-600 text-white text-sm py-2"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="max-w-6xl mx-auto px-6 md:px-8 flex items-center justify-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mt-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="font-medium">
              Clinic services are currently unavailable. Please contact the
              University Center for Health and Wellness at (085) 123-4567 for
              assistance.
            </span>
          </div>
        </motion.div>
      )}

      <motion.header
        className="bg-white py-4 border-b shadow-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 -ml-2">
            {/* Back icon only when NOT authenticated */}
            {!isAuthenticated && (
              <button
                onClick={() => router.back()}
                className="inline-flex items-center mr-2"
                aria-label="Go Back"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Image
                src="/images/qalert-icon.png"
                alt="QAlert Logo"
                width={48}
                height={48}
                priority
              />
            </motion.div>

            <div>
              <h1 className="text-xl font-bold text-[#25323A]">QAlert</h1>
              <p className="text-sm text-[#6C757D]">Digital Queue System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* System Status pill - dynamic based on system status */}
            {isLoading ? (
              /* Skeleton loader while fetching status */
              <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-gray-200 bg-gray-50">
                <div className="relative flex items-center justify-center w-4 h-4">
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-gray-300 animate-pulse"></span>
                </div>
                <div className="hidden md:block h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : (
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
                  isOnline
                    ? "border-green-300 bg-green-50 text-green-700"
                    : "border-red-300 bg-red-50 text-red-700"
                }`}
              >
                <div
                  className="relative flex items-center justify-center w-4 h-4"
                  aria-hidden
                >
                  {isOnline ? (
                    <>
                      <span className="absolute inline-flex h-3 w-3 rounded-full bg-green-300 opacity-60 animate-ping"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                  )}
                </div>
                <span className="hidden md:inline text-xs pb-1">
                  {isOnline ? "System Online" : "System Offline"}
                </span>
              </div>
            )}

            {/* <button
            onClick={() => router.push("/patient")}
            className="inline-flex items-center gap-2 border border-[#e6f7f0] bg-white text-[#007b6b] px-4 py-2 rounded-md hover:bg-[#f3fff8]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5h12M9 3v2m-6 4h6m-6 4h6m-6 4h6"
              />
            </svg>
            <span className="text-sm font-medium">Contact Us</span>
          </button> */}
          </div>
        </div>
      </motion.header>
    </>
  );
}
