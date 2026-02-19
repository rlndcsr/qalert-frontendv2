"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSystemStatus } from "../hooks/useSystemStatus";
import Image from "next/image";

// Constants
const POLLING_INTERVAL = 3000; // 3 seconds
const API_BASE_URL =
  "https://intercarpellary-rosana-indivisibly.ngrok-free.dev";

export default function QueueDisplay() {
  const router = useRouter();
  const { isOnline, isLoading: isStatusLoading } = useSystemStatus();
  useEffect(() => {
    if (!isStatusLoading && !isOnline) {
      router.replace("/");
    }
  }, [isStatusLoading, isOnline, router]);

  // State for client-side time to avoid hydration mismatch
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  // State for queue data
  const [queueEntries, setQueueEntries] = useState([]);
  const [users, setUsers] = useState({});
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Refs for comparing data to avoid unnecessary re-renders
  const previousQueueDataRef = useRef(null);
  const previousUsersDataRef = useRef(null);

  // Helper to format queue numbers as 3 digits (e.g., 002)
  const formatQueueNumber = (n) => String(n).padStart(3, "0");

  // Helper to get auth token from localStorage
  const getAuthToken = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  }, []);

  // Helper to compare arrays/objects for equality
  const isDataEqual = useCallback((newData, oldData) => {
    if (!oldData) return false;
    return JSON.stringify(newData) === JSON.stringify(oldData);
  }, []);

  // Fetch queue entries and users with optimized state updates
  const fetchQueueData = useCallback(
    async (isInitial = false) => {
      try {
        const token = getAuthToken();
        const headers = {
          Accept: "application/json",
          "ngrok-skip-browser-warning": "true",
          ...(token && { Authorization: `Bearer ${token}` }),
        };

        // Fetch queues and users in parallel
        const [queuesResponse, usersResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/queues`, { headers }),
          fetch(`${API_BASE_URL}/api/users`, { headers }),
        ]);

        if (queuesResponse.ok && usersResponse.ok) {
          const queuesData = await queuesResponse.json();
          const usersData = await usersResponse.json();

          // Filter queue entries for today only
          const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD format in local timezone
          const todayQueues = queuesData.filter(
            (entry) => entry.date === today,
          );

          // Create a user map for quick lookup
          const userMap = {};
          usersData.forEach((user) => {
            userMap[user.user_id] = user;
          });

          // Only update state if data has changed (prevents unnecessary re-renders)
          if (!isDataEqual(todayQueues, previousQueueDataRef.current)) {
            previousQueueDataRef.current = todayQueues;
            setQueueEntries(todayQueues);
          }

          if (!isDataEqual(userMap, previousUsersDataRef.current)) {
            previousUsersDataRef.current = userMap;
            setUsers(userMap);
          }
        } else {
          console.error("Failed to fetch data:", {
            queues: queuesResponse.status,
            users: usersResponse.status,
          });
        }
      } catch (error) {
        console.error("Error fetching queue data:", error);
      } finally {
        if (isInitial) {
          setIsLoadingData(false);
          setIsInitialLoad(false);
        }
      }
    },
    [getAuthToken, isDataEqual],
  );

  // Initial fetch and polling setup
  useEffect(() => {
    // Perform initial fetch
    fetchQueueData(true);

    // Set up polling interval (every 3 seconds)
    const intervalId = setInterval(() => {
      fetchQueueData(false);
    }, POLLING_INTERVAL);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchQueueData]);

  // Process queue data
  const { nowServing, ready, waiting, totalInQueue } = useMemo(() => {
    if (isLoadingData || queueEntries.length === 0) {
      return {
        nowServing: [],
        ready: [],
        waiting: [],
        totalInQueue: 0,
      };
    }

    // Filter by status and sort by queue number
    const nowServingEntries = queueEntries
      .filter((entry) => entry.queue_status === "now_serving")
      .sort((a, b) => a.queue_number - b.queue_number);

    const calledEntries = queueEntries
      .filter((entry) => entry.queue_status === "called")
      .sort((a, b) => a.queue_number - b.queue_number);

    const waitingEntries = queueEntries
      .filter((entry) => entry.queue_status === "waiting")
      .sort((a, b) => a.queue_number - b.queue_number);

    // Now serving: all "now_serving" entries
    const nowServingData = nowServingEntries.map((entry) => ({
      number: entry.queue_number,
      name: users[entry.user_id]?.name || "Unknown",
      id_number: users[entry.user_id]?.id_number || "",
    }));

    // Ready (Please Proceed): all "called" entries
    const readyData = calledEntries.map((entry) => ({
      number: entry.queue_number,
      name: users[entry.user_id]?.name || "Unknown",
      id_number: users[entry.user_id]?.id_number || "",
    }));

    // Waiting: all "waiting" entries
    const waitingData = waitingEntries.map((entry, index) => ({
      number: entry.queue_number,
      name: users[entry.user_id]?.name || "Unknown",
      id_number: users[entry.user_id]?.id_number || "",
      wait: entry.estimated_time_wait || `~${(index + 1) * 10}m`, // Use stored value or fallback
    }));

    // Total in queue (now_serving + called + waiting)
    const total =
      nowServingEntries.length + calledEntries.length + waitingEntries.length;

    return {
      nowServing: nowServingData,
      ready: readyData,
      waiting: waitingData,
      totalInQueue: total,
    };
  }, [queueEntries, users, isLoadingData]);

  // Update time only on client side after mount
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(
        d.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      );
      const day = d.getDate();
      const month = d.toLocaleDateString("en-US", { month: "short" });
      setCurrentDate(`${day} ${month}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-3 md:p-4 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 md:mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center overflow-hidden">
              <Image
                src="/images/csuuchw-nobg.png"
                alt="CSU-UCHW Logo"
                width={48}
                height={48}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900">
                CSU-UCHW Live Queue
              </h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 bg-white px-3 md:px-4 py-1.5 md:py-2 rounded-xl shadow-sm border border-slate-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4 md:w-5 md:h-5"
            style={{ color: "#374D6C" }}
          >
            <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
          </svg>
          <div>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium">
              Total
            </p>
            {isLoadingData ? (
              <div className="h-[28px] md:h-[32px] w-8 bg-slate-200 rounded animate-pulse"></div>
            ) : (
              <p
                className="text-lg md:text-xl font-bold"
                style={{ color: "#374D6C" }}
              >
                {totalInQueue}
              </p>
            )}
          </div>
          <div className="ml-2 md:ml-3 text-right">
            {isLoadingData ? (
              <div className="animate-pulse space-y-1">
                <div className="h-[16px] md:h-[20px] w-12 bg-slate-200 rounded ml-auto"></div>
                <div className="h-[12px] md:h-[14px] w-16 bg-slate-200 rounded ml-auto"></div>
              </div>
            ) : (
              <>
                <p className="text-xs md:text-sm font-semibold text-gray-700">
                  {currentTime}
                </p>
                <p className="text-[10px] md:text-xs text-gray-500">
                  {currentDate}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 min-h-0 overflow-hidden">
        {/* Left Column - Now Serving & Please Proceed */}
        <div className="col-span-1 md:col-span-5 flex flex-col gap-3 md:gap-4 min-h-0">
          {/* Now Serving */}
          <div
            className="rounded-2xl shadow-xl p-5 md:p-6 flex flex-col justify-center items-center relative overflow-hidden"
            style={{
              background:
                "linear-gradient(to bottom right, #374D6C, #4A6280, #374D6C)",
            }}
          >
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full"></div>
              <div className="absolute bottom-10 right-10 w-24 h-24 bg-white rounded-full"></div>
            </div>
            <div className="relative z-10 text-center w-full">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full mb-3">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                <span className="text-white text-[10px] md:text-xs font-medium tracking-wide uppercase">
                  Now Serving
                </span>
              </div>
              {isLoadingData ? (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-white/20">
                  <div className="animate-pulse">
                    <div className="h-[36px] md:h-[48px] bg-white/20 rounded w-16 mx-auto mb-2.5"></div>
                    <div className="h-[28px] md:h-[32px] bg-white/20 rounded w-32 mx-auto mb-1.5"></div>
                    <div className="h-[16px] md:h-[20px] bg-white/20 rounded w-20 mx-auto"></div>
                  </div>
                </div>
              ) : nowServing.length > 0 ? (
                <div
                  className={`grid gap-2 ${nowServing.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
                >
                  {nowServing.map((patient, index) => (
                    <div
                      key={index}
                      className="bg-white/10 backdrop-blur-md rounded-xl p-3 md:p-4 border border-white/20"
                    >
                      <div
                        className={`font-black text-white leading-none mb-1 ${nowServing.length === 1 ? "text-[36px] md:text-[48px]" : "text-[24px] md:text-[32px]"}`}
                      >
                        {formatQueueNumber(patient.number)}
                      </div>
                      <div
                        className={`font-bold text-white mb-0.5 truncate ${nowServing.length === 1 ? "text-lg md:text-xl" : "text-sm md:text-base"}`}
                      >
                        {patient.name}
                      </div>
                      <div
                        className={`text-white/90 ${nowServing.length === 1 ? "text-xs md:text-sm" : "text-[10px] md:text-xs"}`}
                      >
                        {patient.id_number}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-white/20">
                  <div className="text-white/80 text-base md:text-lg"></div>
                </div>
              )}
            </div>
          </div>

          {/* Please Proceed */}
          <div
            className="rounded-2xl shadow-lg p-3 relative overflow-hidden flex-shrink-0"
            style={{
              background: "linear-gradient(to bottom right, #5A7A9A, #6B8CAC)",
            }}
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <div className="relative z-10 flex items-center gap-3">
              <div className="bg-white rounded-xl p-2 md:p-3 shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5 md:w-6 md:h-6"
                  style={{ color: "#374D6C" }}
                >
                  <path d="M5.85 3.5a.75.75 0 00-1.117-1 9.719 9.719 0 00-2.348 4.876.75.75 0 001.479.248A8.219 8.219 0 015.85 3.5zM19.267 2.5a.75.75 0 10-1.118 1 8.22 8.22 0 011.987 4.124.75.75 0 001.48-.248A9.72 9.72 0 0019.266 2.5z" />
                  <path
                    fillRule="evenodd"
                    d="M12 2.25A6.75 6.75 0 005.25 9v.75a8.217 8.217 0 01-2.119 5.52.75.75 0 00.298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 107.48 0 24.583 24.583 0 004.83-1.244.75.75 0 00.298-1.205 8.217 8.217 0 01-2.118-5.52V9A6.75 6.75 0 0012 2.25zM9.75 18c0-.034 0-.067.002-.1a25.05 25.05 0 004.496 0l.002.1a2.25 2.25 0 11-4.5 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-white text-xs md:text-sm font-bold mb-0.5">
                  Please Proceed (called)
                </p>
                {isLoadingData ? (
                  <div className="flex items-center justify-between animate-pulse">
                    <div className="h-[20px] md:h-[28px] bg-white/20 rounded w-10"></div>
                    <div className="space-y-1">
                      <div className="h-[14px] md:h-[16px] bg-white/20 rounded w-20"></div>
                      <div className="h-[12px] md:h-[14px] bg-white/20 rounded w-16"></div>
                    </div>
                  </div>
                ) : ready.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {ready.map((patient, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="text-white text-base md:text-lg font-black">
                            {formatQueueNumber(patient.number)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white text-xs md:text-sm font-semibold">
                            {patient.name}
                          </p>
                          <p className="text-white/80 text-[10px] md:text-xs">
                            {patient.id_number}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/80 text-xs md:text-sm">
                    Next in Queue
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Waiting Queue */}
        <div className="col-span-1 md:col-span-7 bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col overflow-hidden min-h-0">
          <div
            className="px-3 md:px-4 py-2 md:py-2.5 border-b border-slate-200 flex items-center justify-between flex-shrink-0"
            style={{
              background: "linear-gradient(to right, #EFF3F7, transparent)",
            }}
          >
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4 md:w-5 md:h-5"
                style={{ color: "#374D6C" }}
              >
                <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
              </svg>
              <h2 className="text-sm md:text-base font-bold text-gray-900">
                Waiting Queue
              </h2>
            </div>
            {isLoadingData ? (
              <div className="h-[20px] md:h-[24px] w-16 bg-slate-200 rounded-full animate-pulse"></div>
            ) : (
              <div
                className="px-2.5 md:px-3 py-1 md:py-1.5 rounded-full font-semibold text-[10px] md:text-xs border-1"
                style={{
                  borderColor: "#374D6C",
                  color: "#374D6C",
                  backgroundColor: "#E8EDF2",
                }}
              >
                {`${waiting.length} waiting`}
              </div>
            )}
          </div>

          <div className="flex-1 p-2.5 md:p-3 columns-1 md:columns-2 gap-x-2.5 md:gap-x-3 overflow-y-auto min-h-0">
            {isLoadingData ? (
              <div className="space-y-2.5 md:space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl p-2.5 md:p-3 border border-slate-200 animate-pulse break-inside-avoid"
                    style={{
                      background:
                        "linear-gradient(to right, #F1F5F9, transparent)",
                    }}
                  >
                    <div className="flex items-center gap-2.5 md:gap-3">
                      <div className="rounded-xl w-10 h-10 md:w-12 md:h-12 bg-slate-300"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-slate-300 rounded w-3/4"></div>
                        <div className="h-2 bg-slate-300 rounded w-1/2"></div>
                      </div>
                      <div className="w-10 h-2 bg-slate-300 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : waiting.length > 0 ? (
              waiting.map((w, index) => (
                <div
                  key={w.number}
                  className="rounded-xl p-2.5 md:p-3 border border-slate-200 hover:shadow-md transition-all break-inside-avoid mb-2.5 md:mb-3"
                  style={{
                    background:
                      "linear-gradient(to right, #F1F5F9, transparent)",
                  }}
                >
                  <div className="flex items-center gap-2.5 md:gap-3">
                    <div
                      className="rounded-xl w-10 h-10 md:w-12 md:h-12 flex items-center justify-center flex-shrink-0 shadow-sm border-1"
                      style={{
                        backgroundColor: "#E8EDF2",
                        borderColor: "#374D6C",
                        color: "#374D6C",
                      }}
                    >
                      <span className="text-base md:text-lg font-black">
                        {formatQueueNumber(w.number)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-bold text-gray-900 truncate">
                        {w.name}
                      </p>
                      <p className="text-[10px] md:text-xs text-gray-500">
                        {w.id_number}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-left text-gray-500 p-2">
                <p className="text-sm md:text-base font-medium">
                  No one's in the queue right now.
                </p>
              </div>
            )}
          </div>

          {/* Bottom Info Section */}
          <div
            className="px-3 md:px-4 py-2 md:py-2.5 border-t border-slate-200 flex-shrink-0"
            style={{ backgroundColor: "#EFF3F7" }}
          >
            <div className="flex items-center gap-2">
              <div
                className="rounded-lg p-1.5 md:p-2"
                style={{ backgroundColor: "#374D6C" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-3.5 h-3.5 md:w-4 md:h-4 text-white"
                >
                  <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                  <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[10px] md:text-xs font-semibold text-gray-900">
                  SMS Notifications
                </p>
                <p className="text-[9px] md:text-[10px] text-gray-600">
                  You'll receive alerts when ready
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
