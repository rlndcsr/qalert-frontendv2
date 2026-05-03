"use client";

import { useMemo } from "react";

/** First letter of first two name parts (e.g. "Doc Don" → DD, "Doc Martinez Santos" → DM). */
function getDoctorInitials(name) {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length >= 2) {
    const a = parts[0].charAt(0);
    const b = parts[1].charAt(0);
    return `${a}${b}`.toUpperCase();
  }
  const word = parts[0];
  if (word.length >= 2) return word.slice(0, 2).toUpperCase();
  return word.charAt(0).toUpperCase();
}

export default function DoctorQueueCard({
  doctorName,
  doctorId,
  shift,
  nowServingPatient,
  waitingPatients,
  formatQueueNumber,
  formatTime,
  isLoading,
  /** Tighter padding and type when many cards are on screen (e.g. live display). */
  compact = false,
}) {
  const waitingCount = useMemo(
    () => waitingPatients?.length || 0,
    [waitingPatients],
  );

  const initials = useMemo(() => getDoctorInitials(doctorName), [doctorName]);

  if (isLoading) {
    return (
      <div className="bg-white/95 rounded-xl border border-slate-300/70 shadow-sm overflow-hidden flex flex-col h-full min-h-0">
        {/* Header skeleton */}
        <div
          className={`border-b border-slate-200 bg-gradient-to-r from-slate-100 to-transparent ${compact ? "px-2.5 py-2" : "px-4 py-3"}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div
                className={`${compact ? "h-7 w-7" : "h-9 w-9"} shrink-0 rounded-full bg-slate-300 animate-pulse`}
              />
              <div
                className={`${compact ? "h-4 w-28" : "h-5 w-32"} bg-slate-300 rounded animate-pulse`}
              ></div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`${compact ? "h-4 w-7" : "h-5 w-8"} bg-slate-200 rounded animate-pulse`}
              />
              <div
                className={`${compact ? "h-6 w-6" : "h-7 w-7"} rounded-full bg-slate-200 animate-pulse`}
              />
            </div>
          </div>
        </div>

        {/* Now Serving skeleton */}
        <div
          className={`border-b border-slate-200 ${compact ? "px-2.5 py-2" : "px-4 py-3"}`}
        >
          <div
            className={`bg-slate-300 rounded animate-pulse ${compact ? "h-2.5 w-20 mb-2" : "h-3 w-24 mb-3"}`}
          ></div>
          <div className={`flex items-center ${compact ? "gap-2" : "gap-2.5"}`}>
            <div
              className={`${compact ? "w-8 h-8" : "w-10 h-10"} bg-slate-200 rounded-lg animate-pulse`}
            ></div>
            <div className="flex-1 space-y-1.5">
              <div
                className={`${compact ? "h-3 w-12" : "h-4 w-16"} bg-slate-200 rounded animate-pulse`}
              ></div>
              <div
                className={`${compact ? "h-2.5 w-16" : "h-3 w-20"} bg-slate-100 rounded animate-pulse`}
              ></div>
            </div>
          </div>
        </div>

        {/* Waiting skeleton — two columns, same as loaded state */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto ${compact ? "px-2.5 py-2" : "px-4 py-3"}`}
        >
          <div
            className={`columns-2 [column-fill:auto] ${compact ? "gap-x-1 gap-y-1" : "gap-x-2 gap-y-2"}`}
          >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`break-inside-avoid flex items-center rounded-lg bg-slate-50 ${compact ? "mb-1 gap-2 p-1.5" : "mb-2 gap-3 p-2"}`}
            >
              <div
                className={`${compact ? "w-8 h-8" : "w-10 h-10"} bg-slate-200 rounded-lg animate-pulse`}
              ></div>
              <div className="flex-1 space-y-1">
                <div
                  className={`${compact ? "h-2.5 w-12" : "h-3 w-16"} bg-slate-200 rounded animate-pulse`}
                ></div>
                <div
                  className={`${compact ? "h-2 w-10" : "h-2 w-12"} bg-slate-100 rounded animate-pulse`}
                ></div>
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 rounded-xl border border-slate-300/70 shadow-sm overflow-hidden flex flex-col h-full min-h-0">
      {/* Header */}
      <div
        className={`border-b border-slate-200 flex items-center justify-between gap-2 ${compact ? "px-2.5 py-2" : "px-4 py-3"}`}
        style={{
          background: "linear-gradient(to right, #EFF3F7, transparent)",
        }}
      >
        <div
          className={`flex items-center min-w-0 flex-1 ${compact ? "gap-2" : "gap-2.5"}`}
        >
          <div
            className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-sm ${compact ? "h-7 w-7 text-[9px] ring-1 ring-white/80" : "h-9 w-9 text-[11px] ring-2 ring-white/80"}`}
            style={{ backgroundColor: "#374D6C" }}
            aria-hidden
          >
            {initials}
          </div>
          <h3
            className={`font-bold text-[#374D6C] truncate min-w-0 ${compact ? "text-xs" : "text-sm"}`}
          >
            {doctorName}
          </h3>
        </div>
        <div
          className={`flex items-center shrink-0 ${compact ? "gap-1.5" : "gap-2"}`}
        >
          {shift && (
            <span
              className={`inline-block bg-slate-100 rounded font-medium text-[#374D6C] ${compact ? "px-1.5 py-0 text-[9px]" : "px-2 py-0.5 text-[10px]"}`}
            >
              {shift}
            </span>
          )}
          {waitingCount > 0 && (
            <div
              className={`flex items-center justify-center rounded-full bg-[#00968a] text-white font-bold ${compact ? "w-6 h-6 text-[10px]" : "w-7 h-7 text-xs"}`}
            >
              {waitingCount}
            </div>
          )}
        </div>
      </div>

      {/* Now Serving Section */}
      <div
        className={`border-b border-slate-200 ${compact ? "px-2.5 py-2" : "px-4 py-3"}`}
      >
        <p
          className={`font-semibold text-gray-500 uppercase tracking-wide ${compact ? "text-[10px] mb-1" : "text-xs mb-2"}`}
        >
          Now Serving
        </p>
        {nowServingPatient ? (
          <div
            className={`flex items-center rounded-lg bg-gradient-to-br from-[#374D6C] to-[#4A6280] ${compact ? "min-h-[3.25rem] gap-2 p-2.5" : "min-h-[4.75rem] gap-2.5 p-4"}`}
          >
            <div
              className={`flex shrink-0 items-center justify-center rounded-lg border font-black text-white shadow-sm ${compact ? "h-8 w-8 text-sm" : "h-10 w-10 text-base"}`}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                borderColor: "rgba(255, 255, 255, 0.3)",
              }}
            >
              {formatQueueNumber(nowServingPatient.number)}
            </div>
            <div className="min-w-0 flex-1 text-white">
              <p
                className={`opacity-90 leading-tight ${compact ? "text-[10px]" : "text-xs"}`}
              >
                {nowServingPatient.id_number}
              </p>
              {nowServingPatient.scheduledTime && (
                <p
                  className={`leading-tight opacity-90 ${compact ? "mt-0.5 text-[10px]" : "mt-0.5 text-xs"}`}
                >
                  {formatTime(nowServingPatient.scheduledTime)}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div
            className={`flex items-center rounded-lg bg-gray-50 ${compact ? "min-h-[3.25rem] gap-2 p-2.5" : "min-h-[4.75rem] gap-2.5 p-4"}`}
          >
            <div
              className={`shrink-0 ${compact ? "h-8 w-8" : "h-10 w-10"}`}
              aria-hidden
            />
            <p
              className={`min-w-0 flex-1 text-left leading-tight text-gray-400 ${compact ? "text-[10px]" : "text-xs"}`}
            >
              No patient being served
            </p>
          </div>
        )}
      </div>

      {/* Waiting Queue Section */}
      <div
        className={`flex-1 min-h-0 overflow-y-auto ${compact ? "px-2.5 py-2" : "px-4 py-3"}`}
      >
        <p
          className={`font-semibold text-gray-500 uppercase tracking-wide ${compact ? "text-[10px] mb-1" : "text-xs mb-2"}`}
        >
          Waiting ({waitingCount})
        </p>
        {waitingPatients && waitingPatients.length > 0 ? (
          <div
            className={`columns-2 [column-fill:auto] ${compact ? "gap-x-1 gap-y-1" : "gap-x-2 gap-y-2"}`}
          >
            {waitingPatients.map((patient) => {
              const isNoShow = patient.queueStatus === "no_show";
              const isCalled = patient.queueStatus === "called";
              return (
                <div
                  key={`${patient.number}-${patient.queueStatus ?? "waiting"}`}
                  className={`break-inside-avoid rounded-lg hover:shadow-sm transition-all ${compact ? "mb-1 p-1.5" : "mb-2 p-2.5"} ${
                    isNoShow
                      ? "ring-2 ring-orange-400 border border-orange-400 bg-orange-50/60"
                      : isCalled
                        ? "ring-2 ring-blue-400 border border-blue-400 bg-blue-50/70"
                        : "border border-slate-200 bg-gradient-to-r from-slate-50 to-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`flex min-w-0 flex-1 items-center ${compact ? "gap-2" : "gap-3"}`}
                    >
                      <div
                        className={`flex flex-shrink-0 items-center justify-center rounded-lg border font-black shadow-sm ${compact ? "w-8 h-8 text-sm" : "w-10 h-10 text-base"}`}
                        style={{
                          backgroundColor: isNoShow
                            ? "#ffedd5"
                            : isCalled
                              ? "#dbeafe"
                              : "#E8EDF2",
                          borderColor: isNoShow
                            ? "#ea580c"
                            : isCalled
                              ? "#2563eb"
                              : "#374D6C",
                          color: isNoShow
                            ? "#9a3412"
                            : isCalled
                              ? "#1e3a8a"
                              : "#374D6C",
                        }}
                      >
                        {formatQueueNumber(patient.number)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate font-medium text-gray-600 ${compact ? "text-[10px]" : "text-xs"}`}
                        >
                          {patient.id_number}
                        </p>
                        {patient.scheduledTime && (
                          <p
                            className={`font-medium text-[#374D6C] ${compact ? "text-[10px]" : "text-xs"}`}
                          >
                            {formatTime(patient.scheduledTime)}
                          </p>
                        )}
                      </div>
                    </div>
                    {isNoShow && (
                      <span
                        className={`flex-shrink-0 font-semibold uppercase tracking-wide text-orange-700 ${compact ? "text-[9px]" : "text-[10px]"}`}
                      >
                        No show
                      </span>
                    )}
                    {isCalled && (
                      <span
                        className={`flex-shrink-0 font-semibold uppercase tracking-wide text-blue-800 ${compact ? "text-[9px]" : "text-[10px]"}`}
                      >
                        Called
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`text-center ${compact ? "py-3" : "py-6"}`}>
            <p
              className={`text-gray-400 ${compact ? "text-[10px]" : "text-xs"}`}
            >
              No patients waiting
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
