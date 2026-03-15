"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";

const API_BASE_URL = "/api/proxy";

const STATUS = {
  LOADING: "loading",
  SUCCESS: "success",
  INVALID: "invalid",
  EXPIRED: "expired",
  ALREADY_CONFIRMED: "already_confirmed",
  NO_TOKEN: "no_token",
  ERROR: "error",
};

function ConfirmAppointmentContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState(
    token ? STATUS.LOADING : STATUS.NO_TOKEN,
  );

  useEffect(() => {
    if (!token) {
      setStatus(STATUS.NO_TOKEN);
      return;
    }

    const confirmAppointment = async () => {
      try {
        const resp = await fetch(
          `${API_BASE_URL}/appointments/confirm/${encodeURIComponent(token)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "ngrok-skip-browser-warning": "true",
            },
          },
        );

        if (resp.ok) {
          setStatus(STATUS.SUCCESS);
          return;
        }

        const data = await resp.json().catch(() => ({}));
        const message = (data?.message || "").toLowerCase();

        if (resp.status === 404) {
          setStatus(STATUS.INVALID);
        } else if (resp.status === 422 && message.includes("expired")) {
          setStatus(STATUS.EXPIRED);
        } else if (resp.status === 422) {
          setStatus(STATUS.ALREADY_CONFIRMED);
        } else {
          setStatus(STATUS.ERROR);
        }
      } catch {
        setStatus(STATUS.ERROR);
      }
    };

    confirmAppointment();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0fdf9] via-white to-[#e6f7f4] flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00968a] to-[#11b3a6] px-6 py-5 flex items-center gap-3">
          <Image
            src="/images/csuuchw-nobg.png"
            alt="QAlert"
            width={40}
            height={40}
            className="rounded-full bg-white/20 p-1"
          />
          <div>
            <h1 className="text-white font-semibold text-lg">QAlert</h1>
            <p className="text-white/80 text-xs">Appointment Confirmation</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          {status === STATUS.LOADING && <LoadingState />}
          {status === STATUS.SUCCESS && <SuccessState />}
          {status === STATUS.INVALID && <InvalidState />}
          {status === STATUS.EXPIRED && <ExpiredState />}
          {status === STATUS.ALREADY_CONFIRMED && <AlreadyConfirmedState />}
          {status === STATUS.NO_TOKEN && <NoTokenState />}
          {status === STATUS.ERROR && <ErrorState />}
        </div>
      </motion.div>
    </div>
  );
}

export default function ConfirmAppointmentPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ConfirmAppointmentContent />
    </Suspense>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="w-12 h-12 border-4 border-[#00968a]/30 border-t-[#00968a] rounded-full animate-spin" />
      <p className="text-gray-600 font-medium">
        Confirming your appointment...
      </p>
      <p className="text-gray-400 text-sm">Please wait a moment.</p>
    </div>
  );
}

function SuccessState() {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-emerald-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-800">
        Appointment Confirmed!
      </h2>
      <p className="text-gray-500 text-sm leading-relaxed">
        Your appointment has been confirmed and you are now in the queue. You
        will receive an SMS notification when it's your turn.
      </p>
      <a
        href="/patient"
        className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-[#00968a] hover:bg-[#007d73] text-white text-sm font-medium rounded-lg transition-colors"
      >
        Go to Patient Portal
      </a>
    </div>
  );
}

function InvalidState() {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-800">Invalid Link</h2>
      <p className="text-gray-500 text-sm leading-relaxed">
        This confirmation link is invalid. It may have already been used or does
        not exist.
      </p>
      <a
        href="/"
        className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Go to Home
      </a>
    </div>
  );
}

function ExpiredState() {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-amber-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-800">Link Expired</h2>
      <p className="text-gray-500 text-sm leading-relaxed">
        This confirmation link has expired. Please book a new appointment.
      </p>
      <a
        href="/patient"
        className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-[#00968a] hover:bg-[#007d73] text-white text-sm font-medium rounded-lg transition-colors"
      >
        Book New Appointment
      </a>
    </div>
  );
}

function AlreadyConfirmedState() {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-800">Already Confirmed</h2>
      <p className="text-gray-500 text-sm leading-relaxed">
        This appointment has already been confirmed. No further action is
        needed.
      </p>
      <a
        href="/patient"
        className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-[#00968a] hover:bg-[#007d73] text-white text-sm font-medium rounded-lg transition-colors"
      >
        Go to Dashboard
      </a>
    </div>
  );
}

function NoTokenState() {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-800">No Token Provided</h2>
      <p className="text-gray-500 text-sm leading-relaxed">
        No confirmation token was found. Please check your email for the correct
        confirmation link.
      </p>
      <a
        href="/"
        className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Go to Home
      </a>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-800">
        Something Went Wrong
      </h2>
      <p className="text-gray-500 text-sm leading-relaxed">
        An unexpected error occurred while confirming your appointment. Please
        try again later.
      </p>
      <a
        href="/"
        className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Go to Home
      </a>
    </div>
  );
}
