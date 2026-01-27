"use client";

import { motion } from "framer-motion";

/**
 * Lightweight placeholder component for views that are not yet implemented.
 * Replace this component with actual content when ready.
 *
 * @param {string} title - The title to display
 * @param {string} description - Optional description text
 */
export default function PlaceholderView({ title, description }) {
  return (
    <motion.div
      className="w-full max-w-5xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <h2 className="text-2xl font-semibold text-[#25323A] mb-2">{title}</h2>
        {description && <p className="text-gray-500 text-sm">{description}</p>}
      </div>
    </motion.div>
  );
}
