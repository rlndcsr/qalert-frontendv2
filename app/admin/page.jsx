"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { SyncLoader } from "react-spinners";

const API_BASE_URL = "http://qalert-backend.test/api";

export default function AdminPortal() {
  const router = useRouter();
  const [email_address, setEmail_address] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Queue data state
  const [queues, setQueues] = useState([]);
  const [users, setUsers] = useState([]);
  const [isFetchingData, setIsFetchingData] = useState(false);

  // Check for adminToken on mount
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("adminToken");
        if (token) {
          setIsAuthenticated(true);
          // Mock admin user data - will be replaced with actual API call later
          setAdminUser({
            name: "Nurse Admin",
            role: "Nurse",
          });
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Fetch queues and users when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      setIsFetchingData(true);
      try {
        const headers = {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        };

        const [queuesResponse, usersResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/queues`, { headers }),
          fetch(`${API_BASE_URL}/users`, { headers }),
        ]);

        if (!queuesResponse.ok || !usersResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const queuesData = await queuesResponse.json();
        const usersData = await usersResponse.json();

        setQueues(queuesData);
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load queue data");
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  // Get today's date in YYYY-MM-DD format
  const todayDate = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Filter queues for today only and exclude cancelled queues
  const todayQueues = useMemo(() => {
    return queues.filter(
      (queue) =>
        queue.date === todayDate &&
        queue.queue_status.toLowerCase() !== "cancelled"
    );
  }, [queues, todayDate]);

  // Create a user lookup map
  const userMap = useMemo(() => {
    const map = {};
    users.forEach((user) => {
      map[user.user_id] = user;
    });
    return map;
  }, [users]);

  // Action handlers
  const handleCallPatient = (queue) => {
    console.log("Call patient:", queue);
    toast.info(`Calling patient at queue #${queue.queue_number}`);
  };

  const handleCompletePatient = (queue) => {
    console.log("Complete patient:", queue);
    toast.success(`Completed queue #${queue.queue_number}`);
  };

  const handleCancelQueue = (queue) => {
    console.log("Cancel queue:", queue);
    toast("Queue cancelled", { description: `Queue #${queue.queue_number}` });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email_address.trim() || !password.trim()) {
      toast.error("Please enter both email and password.");
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await fetch(
        "http://qalert-backend.test/api/adminLogin",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email_address: email_address.trim(),
            password: password.trim(),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message || "Login failed. Please check your credentials."
        );
      }

      // Store admin token in localStorage (API returns "adminToken" field)
      if (data?.adminToken) {
        localStorage.setItem("adminToken", data.adminToken);
        setIsAuthenticated(true);

        // Store admin user info if provided by API
        if (data?.user) {
          setAdminUser({
            name: data.user.name,
            role: data.user.role,
            email: data.user.email_address,
            phone: data.user.phone_number,
            userId: data.user.user_id,
          });
        } else {
          // Fallback if API doesn't return user data
          setAdminUser({
            name: "Admin User",
            role: "Staff",
          });
        }

        toast.success("Login successful! Welcome back.");
      } else {
        throw new Error("No token received from server.");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred during login.");
      console.error("Admin login error:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    if (typeof window === "undefined") return;

    const adminToken = localStorage.getItem("adminToken");

    setIsLoggingOut(true);
    // brief delay so the spinner is visible
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      // Call the same logout API endpoint used by patient portal
      if (adminToken) {
        await fetch("http://qalert-backend.test/api/logout", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout API error:", error);
      // Continue with local logout even if API call fails
    } finally {
      // Always clear local state regardless of API call success
      localStorage.removeItem("adminToken");
      setIsAuthenticated(false);
      setAdminUser(null);
      toast.success("Logged out successfully.");
      setIsLoggingOut(false);
    }
  };

  // Calculate statistics from today's queue
  // Today total should count all queues for today, regardless of status
  const allTodayQueues = useMemo(() => {
    return queues.filter((queue) => queue.date === todayDate);
  }, [queues, todayDate]);

  const stats = useMemo(() => {
    const activeQueue = todayQueues.filter(
      (q) => !["completed", "cancelled"].includes(q.queue_status.toLowerCase())
    ).length;
    const completed = todayQueues.filter(
      (q) => q.queue_status.toLowerCase() === "completed"
    ).length;
    const todayTotal = allTodayQueues.length;
    const totalPatients = new Set(todayQueues.map((q) => q.user_id)).size;
    const avgWait = todayTotal > 0 ? "~15m" : "—";

    return { activeQueue, completed, avgWait, todayTotal, totalPatients };
  }, [todayQueues, allTodayQueues]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-teal-50 font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00968a] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-teal-50 font-sans flex flex-col overflow-x-hidden">
      {/* Header (aligned & styled consistently with PatientPortal) */}
      <header className="bg-white/80 backdrop-blur-md h-16 border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="w-full px-8 h-full">
          <div className="flex items-center justify-between select-none h-full">
            {/* Left group: back button + portal icon + title */}
            <div className="flex items-center gap-3">
              {!isAuthenticated && (
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
              )}
              <motion.div
                className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
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
                {isAuthenticated ? "Staff Dashboard" : "Staff Portal"}
              </motion.h1>
            </div>

            {/* Right group: user meta + logout */}
            {isAuthenticated && adminUser ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-gray-600 font-medium">
                    {adminUser.name}
                  </p>
                  <p className="text-[11px] text-gray-500">{adminUser.role}</p>
                </div>
                <motion.button
                  onClick={handleLogout}
                  className="p-2 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                    delay: 0.16,
                  }}
                  title="Logout"
                >
                  <svg
                    viewBox="0 0 512 512"
                    className="w-5 h-5"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      className="text-gray-600"
                      d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"
                    ></path>
                  </svg>
                </motion.button>
              </div>
            ) : (
              isAuthenticated && (
                <motion.button
                  onClick={handleLogout}
                  className="p-2 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                    delay: 0.16,
                  }}
                  title="Logout"
                >
                  <svg
                    viewBox="0 0 512 512"
                    className="w-5 h-5"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      className="text-gray-600"
                      d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"
                    ></path>
                  </svg>
                </motion.button>
              )
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full px-8 py-8 overflow-y-auto">
        {!isAuthenticated ? (
          // Login Form
          <div className="max-w-6xl mx-auto w-full flex justify-center items-center min-h-[calc(100vh-200px)]">
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
                  className="w-full bg-[#00968a] hover:bg-[#007d73] text-white font-semibold py-3 px-4 rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoggingIn ? "Logging in..." : "Login"}
                </button>
              </form>
            </motion.div>
          </div>
        ) : (
          // Admin Dashboard
          <div className="max-w-7xl mx-auto">
            {/* Statistics Cards */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Active Queue */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2">
                  <Image
                    src="/icons/active-queue.png"
                    alt="Active Queue"
                    width={20}
                    height={20}
                    className="w-5 h-5 flex-shrink-0 mt-1"
                  />
                  <div>
                    <p className="text-xs text-gray-600">Active Queue</p>
                    {isFetchingData ? (
                      <div className="h-5 w-8 bg-gray-200 rounded animate-pulse mt-1"></div>
                    ) : (
                      <p className="text-md font-semibold text-[#25323A]">
                        {stats.activeQueue}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {/* Completed */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2">
                  <Image
                    src="/icons/completed.png"
                    alt="Completed"
                    width={20}
                    height={20}
                    className="w-4 h-4 flex-shrink-0 mr-1"
                  />
                  <div>
                    <p className="text-xs text-gray-600">Completed</p>
                    {isFetchingData ? (
                      <div className="h-5 w-8 bg-gray-200 rounded animate-pulse mt-1"></div>
                    ) : (
                      <p className="text-md font-semibold text-[#25323A]">
                        {stats.completed}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {/* Avg Wait */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2">
                  <Image
                    src="/icons/avg-wait.png"
                    alt="Avg Wait"
                    width={20}
                    height={20}
                    className="w-4 h-4 flex-shrink-0 mr-1"
                  />
                  <div>
                    <p className="text-xs text-gray-600">Avg Wait</p>
                    {isFetchingData ? (
                      <div className="h-5 w-12 bg-gray-200 rounded animate-pulse mt-1"></div>
                    ) : (
                      <p className="text-md font-semibold text-[#25323A]">
                        {stats.avgWait}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {/* Today Total */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2">
                  <Image
                    src="/icons/total-today.png"
                    alt="Today Total"
                    width={20}
                    height={20}
                    className="w-5 h-5 flex-shrink-0 mt-1"
                  />
                  <div>
                    <p className="text-xs text-gray-600">Today Total</p>
                    {isFetchingData ? (
                      <div className="h-5 w-8 bg-gray-200 rounded animate-pulse mt-1"></div>
                    ) : (
                      <p className="text-md font-semibold text-[#25323A]">
                        {stats.todayTotal}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5 text-gray-700"
                >
                  <path d="M5.85 3.5a.75.75 0 00-1.117-1 9.719 9.719 0 00-2.348 4.876.75.75 0 001.479.248A8.219 8.219 0 015.85 3.5zM19.267 2.5a.75.75 0 10-1.118 1 8.22 8.22 0 011.987 4.124.75.75 0 001.48-.248A9.72 9.72 0 0019.266 2.5z" />
                  <path
                    fillRule="evenodd"
                    d="M12 2.25A6.75 6.75 0 005.25 9v.75a8.217 8.217 0 01-2.119 5.52.75.75 0 00.298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 107.48 0 24.583 24.583 0 004.83-1.244.75.75 0 00.298-1.205 8.217 8.217 0 01-2.118-5.52V9A6.75 6.75 0 0012 2.25zM9.75 18c0-.034 0-.067.002-.1a25.05 25.05 0 004.496 0l.002.1a2.25 2.25 0 11-4.5 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <h2 className="text-lg font-semibold text-[#25323A]">
                  Quick Actions
                </h2>
              </div>
              <button
                onClick={() => {
                  const nextWaiting = todayQueues
                    .filter((q) => q.queue_status.toLowerCase() === "waiting")
                    .sort((a, b) => a.queue_number - b.queue_number)[0];

                  if (nextWaiting) {
                    handleCallPatient(nextWaiting);
                  } else {
                    toast.info("No waiting patients in queue");
                  }
                }}
                className="w-full text-sm bg-[#00968a] hover:bg-[#007d73] text-white font-semibold py-2 px-2 rounded-lg transition-colors flex items-center justify-center gap-2 hover:cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M16.881 4.345A23.112 23.112 0 018.25 6H7.5a5.25 5.25 0 00-.88 10.427 21.593 21.593 0 001.378 3.94c.464 1.004 1.674 1.32 2.582.796l.657-.379c.88-.508 1.165-1.593.772-2.468a17.116 17.116 0 01-.628-1.607c1.918.258 3.76.75 5.5 1.446A21.727 21.727 0 0018 11.25c0-2.414-.393-4.735-1.119-6.905zM18.26 3.74a23.22 23.22 0 011.24 7.51 23.22 23.22 0 01-1.24 7.51c-.055.161-.111.322-.17.482a.75.75 0 101.409.516 24.555 24.555 0 001.415-6.43 2.992 2.992 0 00.836-2.078c0-.806-.319-1.54-.836-2.078a24.65 24.65 0 00-1.415-6.43.75.75 0 10-1.409.516c.059.16.116.321.17.482z" />
                </svg>
                Call Next Patient
              </button>
            </motion.div>

            {/* Queue Management Table */}
            <motion.div
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-[#25323A] mb-1">
                  Queue Management
                </h2>
                <p className="text-sm text-gray-600">
                  Manage patient flow and service status
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Wait Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isFetchingData ? (
                      <>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 w-8 bg-gray-200 rounded"></div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="space-y-2">
                                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                <div className="h-3 w-20 bg-gray-200 rounded"></div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 w-28 bg-gray-200 rounded"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-4 w-40 bg-gray-200 rounded"></div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 w-12 bg-gray-200 rounded"></div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-16 bg-gray-200 rounded-md"></div>
                                <div className="h-7 w-16 bg-gray-200 rounded-md"></div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </>
                    ) : todayQueues.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-8 text-center text-sm text-gray-500"
                        >
                          No queue entries for today ({todayDate})
                        </td>
                      </tr>
                    ) : (
                      todayQueues
                        .sort((a, b) => a.queue_number - b.queue_number)
                        .map((queue, index) => {
                          const patient = userMap[queue.user_id] || {};
                          const statusLower = queue.queue_status.toLowerCase();

                          // Determine status badge color
                          let statusClass = "bg-gray-100 text-gray-700";
                          let statusLabel = queue.queue_status;

                          if (statusLower === "waiting") {
                            statusClass = "bg-yellow-100 text-yellow-700";
                            statusLabel = "Waiting";
                          } else if (
                            statusLower === "called" ||
                            statusLower === "serving"
                          ) {
                            statusClass = "bg-blue-100 text-blue-700";
                            statusLabel =
                              statusLower === "called" ? "Called" : "Serving";
                          } else if (statusLower === "now_serving") {
                            statusClass = "bg-green-100 text-green-700";
                            statusLabel = "now serving";
                          } else if (statusLower === "completed") {
                            statusClass =
                              "bg-white text-gray-700 border border-gray-300";
                            statusLabel = "Completed";
                          } else if (statusLower === "cancelled") {
                            statusClass = "bg-red-100 text-red-700";
                            statusLabel = "Cancelled";
                          }

                          // Calculate wait time (static for now)
                          const waitTime =
                            statusLower === "serving" ||
                            statusLower === "called"
                              ? "Now"
                              : `~${(index + 1) * 5}m`;

                          return (
                            <tr
                              key={queue.queue_entry_id}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#25323A]">
                                {index + 1}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <p className="text-sm font-medium text-[#25323A]">
                                    {patient.name || "Unknown Patient"}
                                  </p>
                                  {patient.id_number && (
                                    <p className="text-xs text-gray-500">
                                      {patient.id_number}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-1 text-sm text-gray-700">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="w-4 h-4 text-gray-400"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <span>{patient.phone_number || "N/A"}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                                {queue.reason || "—"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${statusClass}`}
                                >
                                  {statusLabel}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {waitTime}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div className="flex items-center gap-2">
                                  {statusLower === "waiting" && (
                                    <button
                                      onClick={() => handleCallPatient(queue)}
                                      className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-md transition-colors"
                                    >
                                      Call
                                    </button>
                                  )}
                                  {(statusLower === "called" ||
                                    statusLower === "serving") && (
                                    <button
                                      onClick={() =>
                                        handleCompletePatient(queue)
                                      }
                                      className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-md transition-colors"
                                    >
                                      Complete
                                    </button>
                                  )}
                                  {statusLower !== "cancelled" &&
                                    statusLower !== "completed" && (
                                      <button
                                        onClick={() => handleCancelQueue(queue)}
                                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-md transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </main>
      {isLoggingOut && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
          <SyncLoader size={10} color="#00968a" speedMultiplier={0.9} />
        </div>
      )}
    </div>
  );
}
