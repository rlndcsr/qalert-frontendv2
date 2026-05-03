"use client";

import { motion } from "framer-motion";
import { CalendarOff, ListOrdered } from "lucide-react";

export default function CancelledQueueTodayCard({ onViewQueueTab }) {
  return (
    <motion.div
      className="relative overflow-hidden bg-white/95 rounded-2xl shadow-sm border border-amber-200/80 p-6 text-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400" />

      <div className="flex justify-center mb-5">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-center shadow-sm">
          <CalendarOff className="w-8 h-8 text-amber-700" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-[#25323A] mb-2">
        No more visits for today
      </h3>
      <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto leading-relaxed">
        You cancelled your queue entry for today. Another appointment or queue
        slot can&apos;t be booked for the current day. You can book again
        starting tomorrow, or open Appointment Queue to review your entry.
      </p>

      <button
        type="button"
        className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#25323A] hover:bg-[#1a2429] text-white px-6 py-2.5 rounded-xl shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md text-sm font-medium"
        onClick={onViewQueueTab}
      >
        <ListOrdered className="w-5 h-5" />
        <span>View Appointment Queue</span>
      </button>
    </motion.div>
  );
}
