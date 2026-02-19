"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { SyncLoader } from "react-spinners";
import { Menu } from "lucide-react";
import AdminHeader from "./adminComponents/AdminHeader";
import AdminSidebar from "./adminComponents/AdminSidebar";
import LoginForm from "./adminComponents/LoginForm";
import StatisticsCards from "./adminComponents/StatisticsCards";
import CalledPatientDisplay from "./adminComponents/CalledPatientDisplay";
import QueueManagementTable from "./adminComponents/QueueManagementTable";
import AnalyticsTab from "./adminComponents/AnalyticsTab";
import PatientRecordView from "./adminComponents/PatientRecordView";
import EmergencyEncountersView from "./adminComponents/EmergencyEncountersView";
import QueueHistoryView from "./adminComponents/QueueHistoryView";
import { mockMonthlyQueues } from "./adminComponents/mockMonthlyData";
import MonthSelector from "./adminComponents/MonthSelector";

const API_BASE_URL =
  "https://intercarpellary-rosana-indivisibly.ngrok-free.dev/api";

export default function AdminPortal() {
  const [email_address, setEmail_address] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Sidebar state
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Initialize activeView from localStorage or default to "home"
  const [activeView, setActiveView] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("adminActiveView") || "home";
    }
    return "home";
  });

  // Persist activeView to localStorage whenever it changes
  const handleViewChange = (view) => {
    setActiveView(view);
    if (typeof window !== "undefined") {
      localStorage.setItem("adminActiveView", view);
    }
  };

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

  // Called patients state (supports multiple called patients)
  const [calledPatients, setCalledPatients] = useState([]);

  // Month selector state for analytics
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    String(currentDate.getMonth() + 1).padStart(2, "0"),
  );
  const [selectedYear, setSelectedYear] = useState(
    String(currentDate.getFullYear()),
  );

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

  // Fetch queues and users when authenticated with live polling
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    const fetchData = async (isInitialLoad = false) => {
      const token = localStorage.getItem("adminToken");
      if (!token || !isMounted) return;

      // Only show loading state on initial load
      if (isInitialLoad) {
        setIsFetchingData(true);
      }
      try {
        const headers = {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": true,
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

        if (isMounted) {
          setQueues(queuesData);
          setUsers(usersData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        // Only show error toast on initial load to avoid spamming
        if (isInitialLoad && isMounted) {
          toast.error("Failed to load queue data");
        }
      } finally {
        if (isInitialLoad && isMounted) {
          setIsFetchingData(false);
        }
      }
    };

    // Initial fetch
    fetchData(true);

    // Set up polling interval (every 3 seconds for faster updates)
    const pollInterval = setInterval(() => {
      fetchData(false);
    }, 3000);

    // Cleanup interval on unmount or when authentication changes
    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [isAuthenticated]);

  // Fetch system status when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchSystemStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/system-status`, {
          headers: {
            Accept: "application/json",
            "ngrok-skip-browser-warning": true,
          },
        });
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
        queue.queue_status.toLowerCase() !== "completed",
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

  // Restore called/now_serving patients from queue data on refresh
  useEffect(() => {
    if (queues.length > 0) {
      const calledOrServingPatients = queues.filter(
        (queue) =>
          queue.date === todayDate &&
          (queue.queue_status.toLowerCase() === "called" ||
            queue.queue_status.toLowerCase() === "now_serving"),
      );
      setCalledPatients(calledOrServingPatients);
    }
  }, [queues, todayDate]);

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
          "ngrok-skip-browser-warning": true,
        },
        body: JSON.stringify({ is_online: newStatus ? 1 : 0 }),
      });

      if (!response.ok) throw new Error("Failed to update system status");

      setSystemStatus(newStatus);
      toast.success(
        newStatus
          ? "System is now online. Patients can register and join the queue."
          : "System is now offline. New registrations are temporarily disabled.",
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
        "https://intercarpellary-rosana-indivisibly.ngrok-free.dev/api/adminLogin",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": true,
          },
          body: JSON.stringify({
            email_address: email_address.trim(),
            password: password.trim(),
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(
          data?.message || "Login failed. Please check your credentials.",
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
        await fetch(
          "https://intercarpellary-rosana-indivisibly.ngrok-free.dev/api/logout",
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${adminToken}`,
              "ngrok-skip-browser-warning": true,
            },
          },
        );
      }
    } catch (error) {
      console.error("Logout API error:", error);
      // Continue with local logout even if API call fails
    } finally {
      // Always clear local state regardless of API call success
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      localStorage.removeItem("adminActiveView");
      setIsAuthenticated(false);
      setAdminUser(null);
      setEmail_address("");
      setPassword("");
      setActiveView("home");
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
        q.queue_status.toLowerCase(),
      ),
    ).length;
    // Count all queues for today with status 'completed'
    const completed = allTodayQueues.filter(
      (q) => q.queue_status.toLowerCase() === "completed",
    ).length;
    const todayTotal = allTodayQueues.length;
    const totalPatients = new Set(todayQueues.map((q) => q.user_id)).size;
    const avgWait = todayTotal > 0 ? "~15m" : "—";

    return { activeQueue, completed, avgWait, todayTotal, totalPatients };
  }, [todayQueues, allTodayQueues]);

  // Render the Home view (existing dashboard content)
  const renderHomeView = () => (
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
        className="flex items-center justify-between mb-6 gap-4 flex-wrap"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1.5 inline-flex gap-1">
          <button
            onClick={() => setActiveTab("queue-management")}
            className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
              activeTab === "queue-management"
                ? "bg-[#00968a] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Queue Management
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
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
            <p className="font-medium">System is offline</p>
            <p>
              Patients cannot register or join the queue until it is turned back
              online.
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
            <StatisticsCards stats={stats} isFetchingData={isFetchingData} />

            <CalledPatientDisplay
              calledPatients={calledPatients}
              userMap={userMap}
              setQueues={setQueues}
              setCalledPatients={setCalledPatients}
            />

            <QueueManagementTable
              todayQueues={todayQueues}
              todayDate={todayDate}
              userMap={userMap}
              isFetchingData={isFetchingData}
              setQueues={setQueues}
              setCalledPatients={setCalledPatients}
            />
          </motion.div>
        ) : (
          <AnalyticsTab
            stats={stats}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
            queues={
              mockMonthlyQueues[parseInt(selectedMonth)]?.[
                parseInt(selectedYear)
              ]
                ? mockMonthlyQueues[parseInt(selectedMonth)][
                    parseInt(selectedYear)
                  ]
                : queues
            }
            todayDate={todayDate}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );

  // Render placeholder views
  const renderPlaceholderView = (title) => (
    <motion.div
      key={title}
      className="max-w-7xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500">This feature is coming soon.</p>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-teal-50 font-sans flex flex-col overflow-x-hidden">
      {/* Admin Sidebar - only show when authenticated */}
      {isAuthenticated && (
        <AdminSidebar
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
          activeView={activeView}
          onViewChange={handleViewChange}
          isExpanded={isSidebarExpanded}
          onExpandedChange={setIsSidebarExpanded}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Header with Hamburger - only show when authenticated */}
      {isAuthenticated && (
        <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-sm border-b border-gray-200/50 z-30 flex items-center px-4">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-sm font-semibold text-[#25323A]">
              QAlert Admin
            </span>
          </div>
          <div className="w-10" /> {/* Spacer for balance */}
        </header>
      )}

      {/* AdminHeader - always show */}
      <AdminHeader
        isAuthenticated={isAuthenticated}
        adminUser={adminUser}
        isUserMenuOpen={isUserMenuOpen}
        setIsUserMenuOpen={setIsUserMenuOpen}
        handleLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        isSidebarExpanded={isSidebarExpanded}
      />

      {/* Main Content */}
      <main
        className={`flex-1 w-full px-4 sm:px-6 md:px-8 py-8 overflow-y-auto transition-all duration-200 ${
          isAuthenticated
            ? `pt-20 lg:pt-24 ${
                isSidebarExpanded ? "lg:pl-[272px]" : "lg:pl-[80px]"
              }`
            : ""
        }`}
      >
        <AnimatePresence mode="wait">
          {!isAuthenticated ? (
            <LoginForm
              key="login-form"
              email_address={email_address}
              setEmail_address={setEmail_address}
              password={password}
              setPassword={setPassword}
              handleLogin={handleLogin}
              isLoggingIn={isLoggingIn}
            />
          ) : (
            <AnimatePresence mode="wait">
              {activeView === "home" ? (
                renderHomeView()
              ) : activeView === "queue-history" ? (
                <QueueHistoryView key="queue-history" />
              ) : activeView === "patient-record" ? (
                <PatientRecordView key="patient-record" />
              ) : activeView === "emergency-encounters" ? (
                <EmergencyEncountersView key="emergency-encounters" />
              ) : activeView === "current-queue" ? (
                renderPlaceholderView("Current Queue")
              ) : null}
            </AnimatePresence>
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
