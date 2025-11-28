"use client";

import { motion } from "framer-motion";

export default function JoinQueueCard({ onJoinClick }) {
  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
    >
      {/* Icon */}
      <div className="flex justify-center mb-5">
        <div className="w-16 h-16 bg-[#D4F4E6] rounded-full flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-8 h-8 text-[#4ad294]"
            aria-hidden="true"
          >
            <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-[#25323A] mb-2">
        Join the Queue
      </h3>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-5 max-w-md mx-auto">
        You're not currently in the queue. Register now to get your spot and
        receive real-time updates.
      </p>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 max-w-2xl mx-auto">
        <div className="bg-[#F0FDF4] rounded-lg p-2.5 border border-[#4ad294]/20">
          <div className="w-7 h-7 bg-[#D4F4E6] text-[#4ad294] rounded-full flex items-center justify-center mx-auto mb-1.5 text-xs font-semibold">
            1
          </div>
          <p className="text-[11px] font-medium text-[#25323A]">
            Click Join Queue
          </p>
        </div>
        <div className="bg-[#F0FDF4] rounded-lg p-2.5 border border-[#4ad294]/20">
          <div className="w-7 h-7 bg-[#D4F4E6] text-[#4ad294] rounded-full flex items-center justify-center mx-auto mb-1.5 text-xs font-semibold">
            2
          </div>
          <p className="text-[11px] font-medium text-[#25323A]">
            State your purpose
          </p>
        </div>
        <div className="bg-[#F0FDF4] rounded-lg p-2.5 border border-[#4ad294]/20">
          <div className="w-7 h-7 bg-[#D4F4E6] text-[#4ad294] rounded-full flex items-center justify-center mx-auto mb-1.5 text-xs font-semibold">
            3
          </div>
          <p className="text-[11px] font-medium text-[#25323A]">
            Get SMS updates
          </p>
        </div>
      </div>

      {/* Button */}
      <button
        type="button"
        className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#4ad294] hover:bg-[#3bb882] text-white px-6 py-2.5 rounded-md shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md text-sm font-medium"
        onClick={onJoinClick}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <path d="M6.25 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM3.25 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM19.75 7.5a.75.75 0 00-1.5 0v2.25H16a.75.75 0 000 1.5h2.25v2.25a.75.75 0 001.5 0v-2.25H22a.75.75 0 000-1.5h-2.25V7.5z" />
        </svg>
        <span>Join Queue Now</span>
      </button>
    </motion.div>
  );
}
