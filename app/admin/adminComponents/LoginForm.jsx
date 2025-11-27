"use client";

import { motion } from "framer-motion";

export default function LoginForm({
  email_address,
  setEmail_address,
  password,
  setPassword,
  handleLogin,
  isLoggingIn,
}) {
  return (
    <motion.div
      className="max-w-6xl mx-auto w-full flex justify-center items-center min-h-[calc(100vh-200px)]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-[#25323A] mb-2">
            Staff Login
          </h2>
          <p className="text-gray-600 text-sm">
            Access the clinic management dashboard
          </p>
        </motion.div>

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
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00968a] focus:border-[#00968a] transition-all text-sm"
              required
            />
          </motion.div>

          <motion.button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-[#00968a] hover:bg-[#007d73] text-white font-semibold py-3 px-4 rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoggingIn ? "Logging in..." : "Login"}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}
