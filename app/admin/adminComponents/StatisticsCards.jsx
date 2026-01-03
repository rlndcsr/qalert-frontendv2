"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function StatisticsCards({ stats, isFetchingData }) {
  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Active Queue */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2">
          <Image
            src="/icons/active-queue.png"
            alt="Active Queue"
            width={20}
            height={20}
            className="w-5 h-5 flex-shrink-0 mt-1"
          />
          <div>
            <p className="text-xs text-gray-600">Active Queue</p>
            {isFetchingData ? (
              <div className="h-5 w-8 bg-gray-200 rounded animate-pulse mt-1"></div>
            ) : (
              <p className="text-md font-semibold text-[#25323A]">
                {stats.activeQueue}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Completed */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2">
          <Image
            src="/icons/completed.png"
            alt="Completed"
            width={20}
            height={20}
            className="w-4 h-4 flex-shrink-0 mr-1"
          />
          <div>
            <p className="text-xs text-gray-600">Completed</p>
            {isFetchingData ? (
              <div className="h-5 w-8 bg-gray-200 rounded animate-pulse mt-1"></div>
            ) : (
              <p className="text-md font-semibold text-[#25323A]">
                {stats.completed}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Today Total */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2">
          <Image
            src="/icons/total-today.png"
            alt="Today Total"
            width={20}
            height={20}
            className="w-5 h-5 flex-shrink-0 mt-1"
          />
          <div>
            <p className="text-xs text-gray-600">Today Total</p>
            {isFetchingData ? (
              <div className="h-5 w-8 bg-gray-200 rounded animate-pulse mt-1"></div>
            ) : (
              <p className="text-md font-semibold text-[#25323A]">
                {stats.todayTotal}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
