"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

/** Compact wall (4+ doctors): max waiting rows in the left column before spilling to the right. */
const COMPACT_WAITING_LEFT_MAX = 3;
/** Single row of cards (≤3 doctors): max waiting rows in the left column on md+ before spilling right. */
const LOOSE_WAITING_LEFT_MAX = 5;

function WaitingQueueEntry({
  patient,
  compact,
  formatQueueNumber,
  formatTime,
}) {
  const isNoShow = patient.queueStatus === "no_show";
  const isCalled = patient.queueStatus === "called";

  return (
    <div
      className={`break-inside-avoid rounded-lg hover:shadow-sm transition-all ${compact ? "p-1.5" : "p-2.5"} ${
        isNoShow
          ? "border border-orange-200 bg-orange-50/60"
          : isCalled
            ? "border border-blue-200 bg-blue-50/70"
            : "border border-slate-200 bg-gradient-to-r from-slate-50 to-transparent"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div
          className={`flex min-w-0 flex-1 items-center ${compact ? "gap-2" : "gap-3"}`}
        >
          <div
            className={`flex flex-shrink-0 items-center justify-center rounded-lg border font-black tabular-nums leading-none tracking-tight shadow-sm ${compact ? "w-8 h-8 text-[15px]" : "w-10 h-10 text-lg"}`}
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
              color: isNoShow ? "#9a3412" : isCalled ? "#1e3a8a" : "#374D6C",
            }}
          >
            {formatQueueNumber(patient.number)}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={`max-md:whitespace-normal max-md:break-words md:truncate font-medium text-gray-600 ${compact ? "text-[10px]" : "text-xs"}`}
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
  const waitingOuterRef = useRef(null);
  const waitingInnerRef = useRef(null);

  const waitingCount = useMemo(
    () => waitingPatients?.length || 0,
    [waitingPatients],
  );

  const initials = useMemo(() => getDoctorInitials(doctorName), [doctorName]);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const onChange = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /**
   * Ping-pong vertical reveal when the waiting list is taller than its viewport.
   * Uses translateY on an inner wrapper (reliable with CSS columns); outer is overflow-hidden
   * so the list auto-plays instead of relying on scrollHeight quirks + scroll wheel.
   */
  useEffect(() => {
    if (isLoading || prefersReducedMotion) return;
    const outer = waitingOuterRef.current;
    const inner = waitingInnerRef.current;
    if (!outer || !inner) return;

    let rafId = 0;
    let cancelled = false;
    let running = false;
    let last = performance.now();
    /** 1 = toward end of list (more negative translate), -1 = back to start */
    let direction = 1;
    let pauseUntil = 0;
    let translate = 0;
    const speed = compact ? 22 : 32;
    const pauseMs = 2600;

    const stop = () => {
      running = false;
      cancelAnimationFrame(rafId);
    };

    const maxTranslate = () => {
      const cap = outer.clientHeight;
      const h = inner.scrollHeight;
      return Math.max(0, h - cap);
    };

    const applyTransform = () => {
      inner.style.transform = `translateY(${translate}px)`;
    };

    const tick = (now) => {
      if (cancelled || !running) return;

      const maxT = maxTranslate();
      if (maxT <= 1) {
        translate = 0;
        applyTransform();
        stop();
        return;
      }

      translate = Math.max(-maxT, Math.min(0, translate));

      if (now < pauseUntil) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const dt = Math.min(now - last, 120);
      last = now;
      translate -= (direction * speed * dt) / 1000;

      if (direction === 1 && translate <= -maxT + 0.5) {
        translate = -maxT;
        direction = -1;
        pauseUntil = now + pauseMs;
      } else if (direction === -1 && translate >= -0.5) {
        translate = 0;
        direction = 1;
        pauseUntil = now + pauseMs;
      }

      applyTransform();
      rafId = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      if (maxTranslate() <= 1) return;
      running = true;
      last = performance.now();
      direction = 1;
      pauseUntil = 0;
      translate = 0;
      applyTransform();
      rafId = requestAnimationFrame(tick);
    };

    const onResize = () => {
      const maxT = maxTranslate();
      if (maxT <= 1) {
        translate = 0;
        applyTransform();
        if (running) stop();
        return;
      }
      translate = Math.max(-maxT, Math.min(0, translate));
      applyTransform();
      if (!running) start();
    };

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => requestAnimationFrame(onResize));
    });
    ro.observe(outer);
    ro.observe(inner);

    requestAnimationFrame(() => requestAnimationFrame(onResize));

    return () => {
      cancelled = true;
      stop();
      ro.disconnect();
      inner.style.transform = "";
    };
  }, [isLoading, prefersReducedMotion, compact, waitingPatients, waitingCount]);

  /** On narrow screens, cap list height so overflow + auto-scroll can kick in when the queue is long. */
  const mobileListMaxClass =
    waitingCount >= 4 ? "max-md:max-h-[min(58svh,26rem)]" : "";

  if (isLoading) {
    return (
      <div className="bg-white/95 rounded-xl border border-slate-300/70 shadow-sm overflow-hidden flex flex-col max-md:h-auto md:h-full min-h-0">
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
          <div
            className={`flex items-center justify-center ${compact ? "gap-2 px-2 py-2.5" : "gap-3 px-3 py-4"}`}
          >
            <div
              className={`${compact ? "h-9 w-9" : "h-12 w-12"} shrink-0 rounded-lg bg-slate-200 animate-pulse`}
            ></div>
            <div className="w-28 shrink-0 space-y-1.5 sm:w-36">
              <div
                className={`${compact ? "h-3 w-12" : "h-4 w-16"} bg-slate-200 rounded animate-pulse`}
              ></div>
              <div
                className={`${compact ? "h-2.5 w-16" : "h-3 w-20"} bg-slate-100 rounded animate-pulse`}
              ></div>
            </div>
          </div>
        </div>

        {/* Waiting skeleton — compact: 3|rest; loose: single col mobile, md: 5|rest */}
        <div
          className={`${compact ? "px-2.5 py-2" : "px-4 py-3"} md:flex-1 md:min-h-0 md:overflow-y-auto`}
        >
          {compact ? (
            <div className="grid grid-cols-2 gap-x-1">
              <div className="flex flex-col gap-0.5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg bg-slate-50 p-1.5"
                  >
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-slate-200 animate-pulse" />
                    <div className="flex-1 space-y-1">
                      <div className="h-2.5 w-12 rounded bg-slate-200 animate-pulse" />
                      <div className="h-2 w-10 rounded bg-slate-100 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-0.5">
                {[4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg bg-slate-50 p-1.5"
                  >
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-slate-200 animate-pulse" />
                    <div className="flex-1 space-y-1">
                      <div className="h-2.5 w-12 rounded bg-slate-200 animate-pulse" />
                      <div className="h-2 w-10 rounded bg-slate-100 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5 md:hidden">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg bg-slate-50 p-2"
                  >
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-200 animate-pulse" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 w-16 rounded bg-slate-200 animate-pulse" />
                      <div className="h-2 w-12 rounded bg-slate-100 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden grid-cols-2 gap-x-1.5 md:grid">
                <div className="flex flex-col gap-1.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg bg-slate-50 p-2"
                    >
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-200 animate-pulse" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 w-16 rounded bg-slate-200 animate-pulse" />
                        <div className="h-2 w-12 rounded bg-slate-100 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5">
                  {[6].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg bg-slate-50 p-2"
                    >
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-200 animate-pulse" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 w-16 rounded bg-slate-200 animate-pulse" />
                        <div className="h-2 w-12 rounded bg-slate-100 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 rounded-xl border border-slate-300/70 shadow-sm overflow-hidden flex flex-col max-md:h-auto md:h-full min-h-0">
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
            className={`flex items-center justify-center rounded-lg bg-gradient-to-br from-[#374D6C] to-[#4A6280] ${compact ? "min-h-[3.5rem] gap-2 px-2 py-2.5" : "min-h-[5rem] gap-3 px-3 py-4"}`}
          >
            <div
              className={`grid shrink-0 place-items-center rounded-lg border text-center font-black tabular-nums leading-none tracking-tight text-white whitespace-nowrap shadow-sm ${
                compact
                  ? "h-9 w-9 text-[17px]"
                  : "h-12 w-12 text-xl md:text-2xl"
              }`}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                borderColor: "rgba(255, 255, 255, 0.3)",
              }}
            >
              <span className="block text-center leading-none">
                {formatQueueNumber(nowServingPatient.number)}
              </span>
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
            className={`flex items-center justify-center rounded-lg bg-gray-50 ${compact ? "min-h-[3.5rem] px-2 py-2.5" : "min-h-[5rem] px-3 py-4"}`}
          >
            <p
              className={`text-center leading-tight text-gray-400 ${compact ? "text-[10px]" : "text-xs"}`}
            >
              No patient being served
            </p>
          </div>
        )}
      </div>

      {/* Waiting: label fixed; list scrolls (auto ping-pong when overflow; scrollbar hidden unless reduced-motion) */}
      <div
        className={`flex min-h-0 flex-col ${compact ? "px-2.5 py-2" : "px-4 py-3"} md:min-h-0 md:flex-1`}
      >
        <p
          className={`shrink-0 font-semibold text-gray-500 uppercase tracking-wide ${compact ? "text-[10px] mb-1" : "text-xs mb-2"}`}
        >
          Waiting ({waitingCount})
        </p>
        {waitingPatients && waitingPatients.length > 0 ? (
          <div
            ref={waitingOuterRef}
            tabIndex={-1}
            aria-label={`Waiting queue for ${doctorName}`}
            className={`min-h-0 md:flex-1 ${mobileListMaxClass} ${
              prefersReducedMotion
                ? "overflow-y-auto"
                : "overflow-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            }`}
          >
            <div
              ref={waitingInnerRef}
              className={
                compact
                  ? "will-change-transform grid grid-cols-2 items-start gap-x-1 gap-y-0"
                  : "will-change-transform"
              }
            >
              {compact ? (
                <>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    {waitingPatients
                      .slice(0, COMPACT_WAITING_LEFT_MAX)
                      .map((patient) => (
                        <WaitingQueueEntry
                          key={`${patient.number}-${patient.queueStatus ?? "waiting"}`}
                          patient={patient}
                          compact={compact}
                          formatQueueNumber={formatQueueNumber}
                          formatTime={formatTime}
                        />
                      ))}
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    {waitingPatients
                      .slice(COMPACT_WAITING_LEFT_MAX)
                      .map((patient) => (
                        <WaitingQueueEntry
                          key={`${patient.number}-${patient.queueStatus ?? "waiting"}`}
                          patient={patient}
                          compact={compact}
                          formatQueueNumber={formatQueueNumber}
                          formatTime={formatTime}
                        />
                      ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1.5 md:hidden">
                    {waitingPatients.map((patient) => (
                      <WaitingQueueEntry
                        key={`${patient.number}-${patient.queueStatus ?? "waiting"}`}
                        patient={patient}
                        compact={compact}
                        formatQueueNumber={formatQueueNumber}
                        formatTime={formatTime}
                      />
                    ))}
                  </div>
                  <div className="hidden min-w-0 grid-cols-2 gap-x-1.5 md:grid md:items-start">
                    <div className="flex min-w-0 flex-col gap-1.5">
                      {waitingPatients
                        .slice(0, LOOSE_WAITING_LEFT_MAX)
                        .map((patient) => (
                          <WaitingQueueEntry
                            key={`${patient.number}-${patient.queueStatus ?? "waiting"}`}
                            patient={patient}
                            compact={compact}
                            formatQueueNumber={formatQueueNumber}
                            formatTime={formatTime}
                          />
                        ))}
                    </div>
                    <div className="flex min-w-0 flex-col gap-1.5">
                      {waitingPatients
                        .slice(LOOSE_WAITING_LEFT_MAX)
                        .map((patient) => (
                          <WaitingQueueEntry
                            key={`${patient.number}-${patient.queueStatus ?? "waiting"}`}
                            patient={patient}
                            compact={compact}
                            formatQueueNumber={formatQueueNumber}
                            formatTime={formatTime}
                          />
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>
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
