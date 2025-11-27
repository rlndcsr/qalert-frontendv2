"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { SyncLoader } from "react-spinners";

const API_BASE_URL = "http://qalert-backend.test/api";

export default function AdminPortal() {
  const router = useRouter();
  const [email_address, setEmail_address] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState("queue-management");

  // System status state
  const [systemStatus, setSystemStatus] = useState(true);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isFetchingSystemStatus, setIsFetchingSystemStatus] = useState(true);

  // Queue data state
  const [queues, setQueues] = useState([]);
  const [users, setUsers] = useState([]);
  const [isFetchingData, setIsFetchingData] = useState(false);

  // User menu state
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Called patient state
  const [calledPatient, setCalledPatient] = useState(null);

  // Check for adminToken on mount
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("adminToken");
        const storedUser = localStorage.getItem("adminUser");
        if (token) {
          setIsAuthenticated(true);
          if (storedUser) {
            try {
              setAdminUser(JSON.parse(storedUser));
            } catch (error) {
              console.error("Error parsing stored user data:", error);
            }
          }
        }
      }
    };

    checkAuth();
  }, []);

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
  }, [isUserMenuOpen]);

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

  // Fetch system status when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchSystemStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/system-status`);
        const data = await response.json();
        setSystemStatus(data.is_online === 1);
      } catch (error) {
        console.error("Failed to fetch system status:", error);
      } finally {
        setIsFetchingSystemStatus(false);
      }
    };

    fetchSystemStatus();
  }, [isAuthenticated]);

  // Get today's date in YYYY-MM-DD format
  const todayDate = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Filter queues for today only and exclude cancelled, called, now_serving, and completed queues
  const todayQueues = useMemo(() => {
    return queues.filter(
      (queue) =>
        queue.date === todayDate &&
        queue.queue_status.toLowerCase() !== "cancelled" &&
        queue.queue_status.toLowerCase() !== "called" &&
        queue.queue_status.toLowerCase() !== "now_serving" &&
        queue.queue_status.toLowerCase() !== "completed"
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

  // Restore called/now_serving patient from queue data on refresh
  useEffect(() => {
    if (queues.length > 0 && !calledPatient) {
      const calledOrServing = queues.find(
        (queue) =>
          queue.date === todayDate &&
          (queue.queue_status.toLowerCase() === "called" ||
            queue.queue_status.toLowerCase() === "now_serving")
      );
      if (calledOrServing) {
        setCalledPatient(calledOrServing);
      }
    }
  }, [queues, todayDate, calledPatient]);

  // Action handlers
  const handleCallPatient = async (queue) => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/queues/status/${queue.queue_entry_id}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ queue_status: "called" }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update queue status");
      }

      // Update local state
      setQueues((prevQueues) =>
        prevQueues.map((q) =>
          q.queue_entry_id === queue.queue_entry_id
            ? { ...q, queue_status: "called" }
            : q
        )
      );

      // Set as called patient
      setCalledPatient({ ...queue, queue_status: "called" });
      // Send SMS notification via Mocean API
      try {
        const patient = userMap[queue.user_id] || {};
        const rawPhone = patient.phone_number || "";
        const moceanTo = rawPhone.replace(/^0/, "63");

        const text = `CSU-UCHW: You are now called for queue #${String(
          queue.queue_number
        ).padStart(3, "0")}. Please proceed to the clinic. Thank you.`;

        await fetch("/api/sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from: "QAlert", to: moceanTo, text }),
        });

        toast.success("SMS sent to patient");
      } catch (smsError) {
        console.error("SMS send error:", smsError);
        toast.error("Failed to send SMS notification");
      }

      toast.success(`Called patient at queue #${queue.queue_number}`);
    } catch (error) {
      console.error("Error calling patient:", error);
      toast.error("Failed to call patient");
    }
  };

  const handleCompletePatient = (queue) => {
    console.log("Complete patient:", queue);
    toast.success(`Completed queue #${queue.queue_number}`);
  };

  const handleCancelQueue = (queue) => {
    console.log("Cancel queue:", queue);
    toast("Queue cancelled", { description: `Queue #${queue.queue_number}` });
  };

  const handleToggleSystemStatus = async () => {
    if (isTogglingStatus) return;

    setIsTogglingStatus(true);
    const newStatus = !systemStatus;

    try {
      const response = await fetch(`${API_BASE_URL}/system-status`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_online: newStatus ? 1 : 0 }),
      });

      if (!response.ok) throw new Error("Failed to update system status");

      setSystemStatus(newStatus);
      toast.success(
        newStatus
          ? "System is now online. Patients can register and join the queue."
          : "System is now offline. New registrations are temporarily disabled."
      );
    } catch (error) {
      toast.error("Failed to update system status");
    } finally {
      setIsTogglingStatus(false);
    }
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
        toast.error(
          data?.message || "Login failed. Please check your credentials."
        );
        setIsLoggingIn(false);
        return;
      }

      // Store admin token in localStorage (API returns "adminToken" field)
      if (data?.adminToken) {
        localStorage.setItem("adminToken", data.adminToken);
        setIsAuthenticated(true);

        // Store admin user info if provided by API
        if (data?.user) {
          const userData = {
            name: data.user.name,
            role: data.user.role,
            email: data.user.email_address,
            phone: data.user.phone_number,
            userId: data.user.user_id,
          };
          setAdminUser(userData);
          localStorage.setItem("adminUser", JSON.stringify(userData));
        } else {
          // Fallback if API doesn't return user data
          const fallbackData = {
            name: "Admin User",
            role: "Staff",
          };
          setAdminUser(fallbackData);
          localStorage.setItem("adminUser", JSON.stringify(fallbackData));
        }
      } else {
        setIsLoggingIn(false);
        return;
      }
    } catch (error) {
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
      localStorage.removeItem("adminUser");
      setIsAuthenticated(false);
      setAdminUser(null);
      setEmail_address("");
      setPassword("");
      setIsLoggingOut(false);
    }
  };

  // Calculate statistics from today's queue
  // Today total should count all queues for today, regardless of status
  const allTodayQueues = useMemo(() => {
    return queues.filter((queue) => queue.date === todayDate);
  }, [queues, todayDate]);

  const stats = useMemo(() => {
    // Count all queues for today with status: waiting, called, now_serving (not completed/cancelled)
    const activeQueue = allTodayQueues.filter((q) =>
      ["waiting", "called", "now_serving"].includes(
        q.queue_status.toLowerCase()
      )
    ).length;
    // Count all queues for today with status 'completed'
    const completed = allTodayQueues.filter(
      (q) => q.queue_status.toLowerCase() === "completed"
    ).length;
    const todayTotal = allTodayQueues.length;
    const totalPatients = new Set(todayQueues.map((q) => q.user_id)).size;
    const avgWait = todayTotal > 0 ? "~15m" : "—";

    return { activeQueue, completed, avgWait, todayTotal, totalPatients };
  }, [todayQueues, allTodayQueues]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-teal-50 font-sans flex flex-col overflow-x-hidden">
      {/* Header (aligned & styled consistently with PatientPortal) */}
      <header className="bg-white/80 backdrop-blur-md h-16 border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
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

      {/* Main Content */}
      <main className="flex-1 w-full px-8 py-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!isAuthenticated ? (
            // Login Form
            <motion.div
              key="login-form"
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
                {/* Login Form */}
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
                  {/* Email Address Field */}
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

                  {/* Password Field */}
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

                  {/* Login Button */}
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
          ) : (
            // Admin Dashboard
            <motion.div
              key="admin-dashboard"
              className="max-w-7xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Tabs + System Toggle Row */}
              <motion.div
                className="flex items-center justify-between mb-6 gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1.5 inline-flex gap-1">
                  <button
                    onClick={() => setActiveTab("queue-management")}
                    className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                      activeTab === "queue-management"
                        ? "bg-[#00968a] text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Queue Management
                  </button>
                  <button
                    onClick={() => setActiveTab("analytics")}
                    className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                      activeTab === "analytics"
                        ? "bg-[#00968a] text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Analytics & Reports
                  </button>
                </div>
                {/* Compact System Status Toggle */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-2 flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      systemStatus ? "bg-green-500" : "bg-gray-400"
                    }`}
                  ></div>
                  <span className="text-xs font-medium text-[#25323A]">
                    {systemStatus ? "Online" : "Offline"}
                  </span>
                  <button
                    onClick={handleToggleSystemStatus}
                    disabled={isTogglingStatus || isFetchingSystemStatus}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#00968a] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      systemStatus ? "bg-[#00968a]" : "bg-gray-300"
                    }`}
                    aria-label="Toggle system status"
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        systemStatus ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </motion.div>

              {/* Global Offline Banner */}
              {!systemStatus && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-300 text-red-700 rounded-lg p-4 mb-6 flex items-start gap-3"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-sm leading-relaxed">
                    <p className="font-medium">System Offline</p>
                    <p>
                      Patients cannot register or join the queue until it is
                      turned back online.
                    </p>
                  </div>
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                {activeTab === "queue-management" ? (
                  <motion.div
                    key="queue-management"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Statistics Cards */}
                    <motion.div
                      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      {/* Active Queue */}
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-2">
                          <Image
                            src="/icons/active-queue.png"
                            alt="Active Queue"
                            width={20}
                            height={20}
                            className="w-5 h-5 flex-shrink-0 mt-1"
                          />
                          <div>
                            <p className="text-xs text-gray-600">
                              Active Queue
                            </p>
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
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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

                    {/* Called Patient Display */}
                    <motion.div
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-5 h-5 text-blue-600"
                        >
                          <path d="M16.881 4.345A23.112 23.112 0 018.25 6H7.5a5.25 5.25 0 00-.88 10.427 21.593 21.593 0 001.378 3.94c.464 1.004 1.674 1.32 2.582.796l.657-.379c.88-.508 1.165-1.593.772-2.468a17.116 17.116 0 01-.628-1.607c1.918.258 3.76.75 5.5 1.446A21.727 21.727 0 0018 11.25c0-2.414-.393-4.735-1.119-6.905zM18.26 3.74a23.22 23.22 0 011.24 7.51 23.22 23.22 0 01-1.24 7.51c-.055.161-.111.322-.17.482a.75.75 0 101.409.516 24.555 24.555 0 001.415-6.43 2.992 2.992 0 00.836-2.078c0-.806-.319-1.54-.836-2.078a24.65 24.65 0 00-1.415-6.43.75.75 0 10-1.409.516c.059.16.116.321.17.482z" />
                        </svg>
                        <h2 className="text-lg font-semibold text-[#25323A]">
                          Called Patient
                        </h2>
                      </div>
                      {calledPatient ? (
                        <div className="flex gap-4">
                          {/* Patient Info - wider */}
                          <div
                            className={`flex-1 p-4 rounded-lg ${
                              calledPatient.queue_status === "now_serving"
                                ? "bg-green-50 border border-green-200"
                                : "bg-blue-50 border border-blue-200"
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="text-sm font-semibold text-[#25323A]">
                                  {userMap[calledPatient.user_id]?.name ||
                                    "Unknown Patient"}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Queue #
                                  {String(calledPatient.queue_number).padStart(
                                    3,
                                    "0"
                                  )}
                                </p>
                              </div>
                              <span
                                className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                  calledPatient.queue_status === "now_serving"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {calledPatient.queue_status === "now_serving"
                                  ? "Now Serving"
                                  : "Called"}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-3">
                              {calledPatient.reason}
                            </p>
                            <div className="flex items-center gap-2">
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
                              <span className="text-xs text-gray-600">
                                {userMap[calledPatient.user_id]?.phone_number ||
                                  "N/A"}
                              </span>
                            </div>
                          </div>

                          {/* Update Status - smaller fixed width */}
                          <div className="w-56 flex flex-col shrink-0">
                            <label className="block text-sm font-medium text-[#25323A] mb-2">
                              Status
                            </label>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00968a] text-sm h-fit bg-white"
                              value=""
                              onChange={async (e) => {
                                const newStatus = e.target.value;
                                if (!newStatus) return;

                                const token =
                                  localStorage.getItem("adminToken");
                                if (!token) {
                                  toast.error("Authentication required");
                                  e.target.value = "";
                                  return;
                                }

                                try {
                                  const response = await fetch(
                                    `${API_BASE_URL}/queues/status/${calledPatient.queue_entry_id}`,
                                    {
                                      method: "PUT",
                                      headers: {
                                        Accept: "application/json",
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${token}`,
                                      },
                                      body: JSON.stringify({
                                        queue_status: newStatus,
                                      }),
                                    }
                                  );

                                  if (!response.ok) {
                                    throw new Error(
                                      "Failed to update queue status"
                                    );
                                  }

                                  // Update local state
                                  setQueues((prevQueues) =>
                                    prevQueues.map((q) =>
                                      q.queue_entry_id ===
                                      calledPatient.queue_entry_id
                                        ? { ...q, queue_status: newStatus }
                                        : q
                                    )
                                  );

                                  if (newStatus === "now_serving") {
                                    toast.success(
                                      "Patient is now being served"
                                    );
                                    setCalledPatient({
                                      ...calledPatient,
                                      queue_status: "now_serving",
                                    });
                                  } else if (newStatus === "completed") {
                                    toast.success("Patient service completed");
                                    setCalledPatient(null);
                                  }
                                } catch (error) {
                                  console.error(
                                    "Error updating status:",
                                    error
                                  );
                                  toast.error(
                                    "Failed to update patient status"
                                  );
                                }

                                e.target.value = "";
                              }}
                            >
                              <option value="" disabled>
                                {calledPatient.queue_status === "now_serving"
                                  ? "Now Serving"
                                  : "Called"}
                              </option>
                              {calledPatient.queue_status !== "now_serving" && (
                                <option value="now_serving">Now Serving</option>
                              )}
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-8 h-8 text-gray-400"
                            >
                              <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-500">
                            No patient has been called yet
                          </p>
                        </div>
                      )}
                    </motion.div>

                    {/* Queue Management Table */}
                    <motion.div
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
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
                                  No queue entries for today (
                                  {new Date(todayDate).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "2-digit",
                                      day: "2-digit",
                                      year: "numeric",
                                    }
                                  )}
                                  )
                                </td>
                              </tr>
                            ) : (
                              (() => {
                                const sorted = todayQueues.sort(
                                  (a, b) => a.queue_number - b.queue_number
                                );
                                const firstWaitingId = sorted.find(
                                  (q) =>
                                    q.queue_status.toLowerCase() === "waiting"
                                )?.queue_entry_id;

                                return sorted.map((queue, index) => {
                                  const patient = userMap[queue.user_id] || {};
                                  const statusLower =
                                    queue.queue_status.toLowerCase();
                                  const isFirstWaiting =
                                    queue.queue_entry_id === firstWaitingId;

                                  // Determine status badge color
                                  let statusClass = "bg-gray-100 text-gray-700";
                                  let statusLabel = queue.queue_status;

                                  if (statusLower === "waiting") {
                                    statusClass =
                                      "bg-yellow-100 text-yellow-700";
                                    statusLabel = "Waiting";
                                  } else if (
                                    statusLower === "called" ||
                                    statusLower === "serving"
                                  ) {
                                    statusClass = "bg-blue-100 text-blue-700";
                                    statusLabel =
                                      statusLower === "called"
                                        ? "Called"
                                        : "Serving";
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
                                          <span>
                                            {patient.phone_number || "N/A"}
                                          </span>
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
                                          {statusLower === "waiting" &&
                                            isFirstWaiting && (
                                              <button
                                                onClick={() =>
                                                  handleCallPatient(queue)
                                                }
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
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                });
                              })()
                            )}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  </motion.div>
                ) : (
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
                        Track queue performance metrics and patient flow
                        patterns
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
                          <p className="text-3xl font-bold text-green-900">
                            {stats.avgWait}
                          </p>
                          <p className="text-xs text-green-600 mt-2">
                            Estimated
                          </p>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                          <p className="text-xs font-medium text-purple-600 mb-1">
                            Currently Waiting
                          </p>
                          <p className="text-3xl font-bold text-purple-900">
                            {stats.activeQueue}
                          </p>
                          <p className="text-xs text-purple-600 mt-2">
                            In queue
                          </p>
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
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      {isLoggingOut && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
          <SyncLoader size={10} color="#00968a" speedMultiplier={0.9} />
        </div>
      )}
    </div>
  );
}
