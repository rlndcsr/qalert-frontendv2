"use client";

import { motion } from "framer-motion";
import { useAppointment } from "./useAppointment";
import AppointmentForm from "./AppointmentForm";
import AppointmentCard from "./AppointmentCard";

// Skeleton UI for the appointment card
function AppointmentCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 max-w-lg mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4" />
        <div className="h-6 w-48 bg-gray-200 rounded mx-auto" />
      </div>

      {/* Details Skeleton */}
      <div className="space-y-4 mb-6">
        {/* Doctor */}
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
          <div className="flex-1">
            <div className="h-3 w-12 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
          </div>
        </div>

        {/* Schedule */}
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
          <div className="flex-1">
            <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-44 bg-gray-200 rounded" />
          </div>
        </div>

        {/* Date */}
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
          <div className="flex-1">
            <div className="h-3 w-10 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-36 bg-gray-200 rounded" />
          </div>
        </div>

        {/* Time */}
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
          <div className="flex-1">
            <div className="h-3 w-10 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </div>
        </div>

        {/* Status Badge Skeleton */}
        <div className="flex items-center justify-center pt-2">
          <div className="h-8 w-36 bg-gray-200 rounded-full" />
        </div>
      </div>

      {/* Button Skeleton */}
      <div className="h-12 w-full bg-gray-200 rounded-md" />
    </div>
  );
}

// Skeleton UI for the booking form
function AppointmentFormSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 max-w-lg mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4" />
        <div className="h-6 w-44 bg-gray-200 rounded mx-auto mb-2" />
        <div className="h-4 w-56 bg-gray-200 rounded mx-auto" />
      </div>

      {/* Form Fields Skeleton */}
      <div className="space-y-5">
        {/* Date Field */}
        <div>
          <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
          <div className="h-10 w-full bg-gray-200 rounded-md" />
        </div>

        {/* Doctor Field */}
        <div>
          <div className="h-4 w-28 bg-gray-200 rounded mb-2" />
          <div className="h-10 w-full bg-gray-200 rounded-md" />
        </div>

        {/* Purpose Field */}
        <div>
          <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
          <div className="h-10 w-full bg-gray-200 rounded-md" />
        </div>

        {/* Time Field */}
        <div>
          <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
          <div className="h-10 w-full bg-gray-200 rounded-md" />
        </div>

        {/* Button Skeleton */}
        <div className="h-12 w-full bg-gray-200 rounded-md" />
      </div>
    </div>
  );
}

export default function AppointmentView() {
  const {
    schedules,
    reasonCategories,
    activeAppointment,
    isLoadingAppointments,
    isLoadingSchedules,
    isLoadingReasonCategories,
    isBooking,
    isCancelling,
    error,
    bookAppointment,
    cancelAppointment,
    getSchedulesForDate,
    isWeekday,
  } = useAppointment();

  // Determine if we're still loading critical data
  // For appointment card: we need appointments AND schedules to be loaded
  // For booking form: we need appointments to know there's no active appointment
  const isLoading = isLoadingAppointments || isLoadingSchedules;

  // Show loading state with skeleton UI while fetching data
  if (isLoading) {
    return (
      <motion.div
        className="w-full max-w-5xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
      >
        {/* Show card skeleton by default since we don't know yet if user has appointment */}
        <AppointmentCardSkeleton />
      </motion.div>
    );
  }

  // Show error state
  if (error) {
    return (
      <motion.div
        className="w-full max-w-5xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
      >
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 sm:p-8 max-w-lg mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#25323A] mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </motion.div>
    );
  }

  // Find the schedule associated with the active appointment
  const appointmentSchedule = activeAppointment
    ? schedules.find((s) => s.schedule_id === activeAppointment.schedule_id)
    : null;

  return (
    <motion.div
      className="w-full max-w-5xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      key="appointment"
    >
      {activeAppointment ? (
        // Case B: Active appointment exists - show appointment card
        <AppointmentCard
          appointment={activeAppointment}
          schedule={appointmentSchedule}
          isCancelling={isCancelling}
          onCancel={cancelAppointment}
        />
      ) : (
        // Case A: No active appointment - show booking form
        <AppointmentForm
          schedules={schedules}
          reasonCategories={reasonCategories}
          isLoadingSchedules={isLoadingSchedules}
          isLoadingReasonCategories={isLoadingReasonCategories}
          isBooking={isBooking}
          onSubmit={bookAppointment}
          getSchedulesForDate={getSchedulesForDate}
          isWeekday={isWeekday}
        />
      )}
    </motion.div>
  );
}
