"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminHeader({
  isAuthenticated,
  adminUser,
  isUserMenuOpen,
  setIsUserMenuOpen,
  handleLogout,
  isLoggingOut,
  isSidebarExpanded = false,
}) {
  const router = useRouter();
  const userMenuRef = useRef(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isUserMenuOpen, setIsUserMenuOpen]);

  return (
    <header
      className={`bg-white/80 backdrop-blur-md h-16 border-b border-gray-200/50 fixed top-0 right-0 z-30 shadow-sm transition-all duration-200 hidden lg:block ${
        isAuthenticated
          ? isSidebarExpanded
            ? "lg:left-60"
            : "lg:left-16"
          : "left-0"
      }`}
    >
      <div className="w-full px-8 h-full">
        <div className="flex items-center justify-between select-none h-full">
          {/* Left group: back button + portal icon + title */}
          <div className="flex items-center gap-3">
            <AnimatePresence mode="wait">
              {!isAuthenticated && (
                <motion.button
                  key="back-button"
                  onClick={() => router.push("/")}
                  aria-label="Back to home"
                  className="p-1 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                  initial={{ opacity: 0, x: -10, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -10, scale: 0.9 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Image
                    src="/icons/back.png"
                    alt="Back"
                    width={28}
                    height={28}
                  />
                </motion.button>
              )}
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.div
                key={isAuthenticated ? "logo-auth" : "logo-guest"}
                className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{
                  duration: 0.45,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.02,
                }}
              >
                <Image
                  src="/images/csuuchw-nobg.png"
                  alt="CSU-UCHW Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </motion.div>
            </AnimatePresence>
            <motion.h1
              key={isAuthenticated ? "dashboard" : "portal"}
              className="text-lg font-bold text-[#25323A]"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.2,
              }}
            >
              {isAuthenticated ? "Staff Dashboard" : "Staff Portal"}
            </motion.h1>
          </div>

          {/* Right group: user avatar dropdown */}
          <AnimatePresence mode="wait">
            {isAuthenticated && adminUser && (
              <motion.div
                key="user-menu"
                ref={userMenuRef}
                className="relative"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.45,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.16,
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 bg-[#00968a] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {adminUser?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "A"}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-medium text-gray-900">
                      {adminUser?.name || "Admin"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {adminUser?.role || "Staff"}
                    </p>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      isUserMenuOpen ? "rotate-180" : ""
                    }`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
                    >
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          handleLogout();
                        }}
                        disabled={isLoggingOut}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-4 h-4 text-gray-500"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z"
                            clipRule="evenodd"
                          />
                          <path
                            fillRule="evenodd"
                            d="M6 10a.75.75 0 01.75-.75h9.546l-1.048-.943a.75.75 0 111.004-1.114l2.5 2.25a.75.75 0 010 1.114l-2.5 2.25a.75.75 0 11-1.004-1.114l1.048-.943H6.75A.75.75 0 016 10z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>
                          {isLoggingOut ? "Logging out..." : "Logout"}
                        </span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
