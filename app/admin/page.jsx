"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";

export default function AdminPortal() {
  const router = useRouter();
  const [email_address, setEmail_address] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);

    // Functionality will be implemented later
    setTimeout(() => {
      setIsLoggingIn(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-teal-50 font-sans flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="bg-white py-4 border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex items-center justify-between select-none">
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => router.push("/")}
                aria-label="Back to home"
                className="p-1 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <Image
                  src="/icons/back.png"
                  alt="Back"
                  width={28}
                  height={28}
                />
              </motion.button>
              <motion.div
                className="w-8 h-8 bg-white border-2 border-[#00968a] rounded-md flex items-center justify-center"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.45,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.02,
                }}
              >
                <Image
                  src="/icons/staff-dashboard-feature.png"
                  alt="Staff Portal"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
              </motion.div>
              <motion.h1
                className="text-lg font-bold text-[#25323A]"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.45,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.04,
                }}
              >
                Staff Portal
              </motion.h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full flex items-center justify-center px-8 py-16 overflow-y-auto min-h-0">
        <div className="max-w-6xl mx-auto w-full flex justify-center items-center">
          <motion.div
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Login Form */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#25323A] mb-2">
                Staff Login
              </h2>
              <p className="text-gray-600 text-sm">
                Access the clinic management dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Address Field */}
              <div>
                <label
                  htmlFor="email_address"
                  className="block text-sm font-medium text-[#25323A] mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email_address"
                  name="email_address"
                  value={email_address}
                  onChange={(e) => setEmail_address(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00968a] focus:border-[#00968a] transition-all text-sm"
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#25323A] mb-2"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00968a] focus:border-[#00968a] transition-all text-sm"
                  required
                />
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-[#00968a] hover:bg-[#007d73] text-white font-semibold py-2 px-2 rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? "Logging in..." : "Login"}
              </button>
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
