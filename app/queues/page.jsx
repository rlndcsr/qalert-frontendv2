"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSystemStatus } from "../hooks/useSystemStatus";
import Image from "next/image";

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

  // Static mock data for the UI
  const nowServing = useMemo(
    () => ({ number: 1, name: "Pedro Garcia", id_number: "2020-00789" }),
    []
  );

  const ready = useMemo(
    () => ({ number: 2, name: "Ana Reyes", id_number: "2021-00234" }),
    []
  );

  const waiting = useMemo(
    () => [
      {
        number: 3,
        name: "Carlos Lopez",
        id_number: "2022-00111",
        wait: "~20m",
      },
      {
        number: 4,
        name: "Sofia Martinez",
        id_number: "2022-00222",
        wait: "~35m",
      },
    ],
    []
  );

  const totalInQueue = 4; // Total count

  // Update time only on client side after mount
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(
        d.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
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
            <p
              className="text-lg md:text-xl font-bold"
              style={{ color: "#374D6C" }}
            >
              {totalInQueue}
            </p>
          </div>
          <div className="ml-2 md:ml-3 text-right">
            <p className="text-xs md:text-sm font-semibold text-gray-700">
              {currentTime}
            </p>
            <p className="text-[10px] md:text-xs text-gray-500">
              {currentDate}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 min-h-0 overflow-hidden">
        {/* Left Column - Now Serving & Please Proceed */}
        <div className="col-span-1 md:col-span-5 flex flex-col gap-3 md:gap-4 min-h-0">
          {/* Now Serving */}
          <div
            className="rounded-2xl shadow-xl p-3 md:p-4 flex flex-col justify-center items-center relative overflow-hidden"
            style={{
              background:
                "linear-gradient(to bottom right, #374D6C, #4A6280, #374D6C)",
            }}
          >
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full"></div>
              <div className="absolute bottom-10 right-10 w-24 h-24 bg-white rounded-full"></div>
            </div>
            <div className="relative z-10 text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full mb-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                <span className="text-white text-[9px] md:text-[10px] font-medium tracking-wide uppercase">
                  Now Serving
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 md:p-4 border border-white/20">
                <div className="text-[32px] md:text-[44px] font-black text-white leading-none mb-1.5">
                  #{nowServing.number}
                </div>
                <div className="text-base md:text-lg font-bold text-white mb-0.5">
                  {nowServing.name}
                </div>
                <div className="text-[10px] md:text-xs text-white/90">
                  {nowServing.id_number}
                </div>
              </div>
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
                  Please Proceed
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-base md:text-lg font-black">
                      #{ready.number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-xs md:text-sm font-semibold">
                      {ready.name}
                    </p>
                    <p className="text-white/80 text-[10px] md:text-xs">
                      {ready.id_number}
                    </p>
                  </div>
                </div>
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
            <div
              className="px-2.5 md:px-3 py-1 md:py-1.5 rounded-full font-semibold text-[10px] md:text-xs text-white"
              style={{ backgroundColor: "#374D6C" }}
            >
              {waiting.length} waiting
            </div>
          </div>

          <div className="flex-1 p-2.5 md:p-3 columns-1 md:columns-2 gap-x-2.5 md:gap-x-3 overflow-y-auto min-h-0">
            {waiting.map((w, index) => (
              <div
                key={w.number}
                className="rounded-xl p-2.5 md:p-3 border border-slate-200 hover:shadow-md transition-all break-inside-avoid mb-2.5 md:mb-3"
                style={{
                  background: "linear-gradient(to right, #F1F5F9, transparent)",
                }}
              >
                <div className="flex items-center gap-2.5 md:gap-3">
                  <div
                    className="text-white rounded-xl w-10 h-10 md:w-12 md:h-12 flex items-center justify-center flex-shrink-0 shadow-md"
                    style={{ backgroundColor: "#374D6C" }}
                  >
                    <span className="text-base md:text-lg font-black">
                      #{w.number}
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
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-gray-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-3 h-3 md:w-3.5 md:h-3.5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-[10px] md:text-xs font-medium">
                        {w.wait}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
