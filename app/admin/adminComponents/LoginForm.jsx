"use client";

import { motion } from "framer-motion";
import { Loader2, User, Lock, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginForm({
  email_address,
  setEmail_address,
  password,
  setPassword,
  handleLogin,
  isLoggingIn,
}) {
  const router = useRouter();

  return (
    <motion.div
      className="w-full flex justify-center items-center py-16"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] w-full max-w-md overflow-hidden mt-14"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="h-1 bg-gradient-to-r from-[#00968a] to-[#007d73]" />

        {/* Back button */}
        <div className="px-8 pt-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#25323A] transition-colors cursor-pointer text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>

        {/* Header */}
        <div className="px-8 pt-4 pb-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-[#25323A] mb-1">
            Sign In to Admin Portal
          </h2>
          <p className="text-gray-500 text-sm">
            Access the clinic management dashboard
          </p>
        </div>

        {/* Form Body */}
        <div className="px-8 py-6">
          <form onSubmit={handleLogin} className="space-y-5">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <label
                htmlFor="email_address"
                className="block text-sm font-medium text-[#25323A] mb-2"
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email_address"
                  name="email_address"
                  value={email_address}
                  onChange={(e) => setEmail_address(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00968a] focus:border-transparent transition-all text-sm bg-gray-50 focus:bg-white"
                  required
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#25323A] mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00968a] focus:border-transparent transition-all text-sm bg-gray-50 focus:bg-white"
                  required
                />
              </div>
            </motion.div>

            <motion.button
              type="submit"
              disabled={isLoggingIn}
              className={`w-full text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                isLoggingIn
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#00968a] hover:bg-[#007d73] cursor-pointer"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              whileHover={isLoggingIn ? {} : { scale: 1.02 }}
              whileTap={isLoggingIn ? {} : { scale: 0.98 }}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Sign In"
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
