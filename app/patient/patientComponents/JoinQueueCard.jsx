"use client";

import { motion } from "framer-motion";
import { Calendar } from "lucide-react";

export default function JoinQueueCard({ onJoinClick }) {
  return (
    <motion.div
      className="relative overflow-hidden bg-white/95 rounded-2xl shadow-sm border border-[#4ad294]/20 p-6 text-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#4ad294] via-[#64dca6] to-[#4ad294]" />

      {/* Icon */}
      <div className="flex justify-center mb-5">
        <div className="w-16 h-16 bg-[#D4F4E6] rounded-2xl border border-[#4ad294]/30 flex items-center justify-center shadow-sm">
          <Calendar className="w-8 h-8 text-[#4ad294]" />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-[#25323A] mb-2">
        Book an Appointment
      </h3>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-5 max-w-md mx-auto">
        You don't have an appointment yet. Book one to automatically join the
        queue on your appointment day.
      </p>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 max-w-2xl mx-auto">
        <div className="bg-[#F0FDF4] rounded-xl p-2.5 border border-[#4ad294]/20 shadow-sm">
          <div className="w-7 h-7 bg-[#D4F4E6] text-[#4ad294] rounded-full flex items-center justify-center mx-auto mb-1.5 text-xs font-semibold">
            1
          </div>
          <p className="text-[11px] font-medium text-[#25323A]">
            Book Appointment
          </p>
        </div>
        <div className="bg-[#F0FDF4] rounded-xl p-2.5 border border-[#4ad294]/20 shadow-sm">
          <div className="w-7 h-7 bg-[#D4F4E6] text-[#4ad294] rounded-full flex items-center justify-center mx-auto mb-1.5 text-xs font-semibold">
            2
          </div>
          <p className="text-[11px] font-medium text-[#25323A]">
            Auto-join Queue
          </p>
        </div>
        <div className="bg-[#F0FDF4] rounded-xl p-2.5 border border-[#4ad294]/20 shadow-sm">
          <div className="w-7 h-7 bg-[#D4F4E6] text-[#4ad294] rounded-full flex items-center justify-center mx-auto mb-1.5 text-xs font-semibold">
            3
          </div>
          <p className="text-[11px] font-medium text-[#25323A]">
            Get SMS Updates
          </p>
        </div>
      </div>

      {/* Button */}
      <button
        type="button"
        className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#4ad294] hover:bg-[#3bb882] text-white px-6 py-2.5 rounded-xl shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md text-sm font-medium"
        onClick={onJoinClick}
      >
        <Calendar className="w-5 h-5" />
        <span>Book Appointment</span>
      </button>
    </motion.div>
  );
}
