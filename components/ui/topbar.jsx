"use client";

import React from "react";
import { motion } from "framer-motion";

export default function TopBar() {
  return (
    <motion.div
      className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-sm"
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-2 flex items-center justify-between">
        {/* Left: clinic name */}
        <div className="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 21s8-4.5 8-10a8 8 0 10-16 0c0 5.5 8 10 8 10z"
            />
          </svg>
          <span className="font-medium">CSU-UCHW Clinic</span>
        </div>

        {/* Center: hours (small on mobile) */}
        <div className="hidden sm:flex items-center gap-6 text-xs md:text-sm">
          <div className="flex items-center gap-2 opacity-95">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6l4 2"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3a9 9 0 100 18 9 9 0 000-18z"
              />
            </svg>
            <span>Mon-Fri: 8AM-5PM</span>
          </div>
          <div className="flex items-center gap-2 opacity-95">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-green-200"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>No Walk-ins Required</span>
          </div>
        </div>

        {/* Right: emergency contact */}
        <div className="flex items-center gap-2 text-xs md:text-sm">
          <span className="hidden md:inline">Emergency:</span>
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
              d="M22 16.92V20a2 2 0 01-2.18 2 19.86 19.86 0 01-8.63-3.07A19.5 19.5 0 013.07 10.81 19.86 19.86 0 010 2.18 2 2 0 012 0h3.09a2 2 0 012 1.72c.12 1.06.34 2.09.66 3.05a2 2 0 01-.45 2.11L5.4 8.91a16 16 0 007.69 7.69l1.03-1.03a2 2 0 012.11-.45c.96.32 1.99.54 3.05.66A2 2 0 0122 16.92z"
            />
          </svg>
          <a href="tel:+0851234567" className="font-medium hover:underline">
            (085) 123-4567
          </a>
        </div>
      </div>
    </motion.div>
  );
}
