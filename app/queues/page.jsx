"use client";

import { useState, useEffect, useMemo } from "react";

import { useRouter } from "next/navigation";
import { useSystemStatus } from "../hooks/useSystemStatus";

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
      { number: 5, name: "Luis Cruz", id_number: "2023-00456", wait: "~40m" },
    ],
    []
  );

  // Update time only on client side after mount
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(
        d.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setCurrentDate(d.toLocaleDateString());
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen bg-gray-50 p-3 overflow-hidden">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-lg font-semibold text-[#25323A]">
              Queue Display
            </h1>
            <p className="text-xs text-gray-600">CSU-UCHW Clinic</p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <div>{currentTime || "Loading..."}</div>
            <div className="text-[10px]">{currentDate || "Loading..."}</div>
          </div>
        </div>

        {/* Now Serving (Large Banner) */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-400 text-white rounded-lg p-6 mb-2 shadow-md">
          <div className="text-center">
            <div className="text-xs uppercase opacity-90">Now Serving</div>
            <div className="text-5xl font-extrabold mt-1">
              #{nowServing.number}
            </div>
            <div className="text-base mt-2 font-medium">{nowServing.name}</div>
            <div className="text-xs opacity-90 mt-0.5">
              University ID: {nowServing.id_number}
            </div>
          </div>
        </div>

        {/* Ready Card */}
        <div className="bg-gradient-to-r from-green-500 to-green-400 text-white rounded-lg p-3 mb-2 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold">
                Ready - Please Proceed to Clinic
              </div>
              <div className="bg-white/20 rounded px-4 py-2">
                <div className="text-xl font-semibold">#{ready.number}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-sm">{ready.name}</div>
              <div className="text-xs opacity-90">{ready.id_number}</div>
            </div>
          </div>
        </div>

        {/* Waiting Queue */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-2 flex-1 min-h-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-sm text-[#25323A]">
              Waiting Queue
            </h2>
            <div className="text-xs text-gray-500 rounded-full bg-gray-100 px-2 py-1">
              {waiting.length} waiting
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {waiting.map((w) => (
              <div
                key={w.number}
                className="border border-gray-100 rounded-lg p-3 relative bg-white"
              >
                <div className="absolute top-3 left-3 bg-indigo-50 text-indigo-700 rounded-full w-7 h-7 flex items-center justify-center font-semibold text-xs">
                  #{w.number}
                </div>
                <div className="ml-10">
                  <div className="text-xs text-gray-500 absolute right-3 top-3 bg-gray-100 px-2 py-0.5 rounded">
                    {w.wait}
                  </div>
                  <div className="text-sm font-medium">{w.name}</div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {w.id_number}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
            <h3 className="font-medium text-xs">📱 SMS Notifications</h3>
            <p className="text-[10px] text-gray-500 mt-1">
              You'll receive an SMS when it's your turn.
            </p>
          </div>
          <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
            <h3 className="font-medium text-xs">👀 Monitor Your Position</h3>
            <p className="text-[10px] text-gray-500 mt-1">
              Watch this display for real-time updates.
            </p>
          </div>
          <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
            <h3 className="font-medium text-xs">✅ Proceed When Called</h3>
            <p className="text-[10px] text-gray-500 mt-1">
              When your number appears in "Ready", proceed immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
