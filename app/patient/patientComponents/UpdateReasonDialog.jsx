"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function UpdateReasonDialog({
  isOpen,
  onClose,
  updatedReason,
  setUpdatedReason,
  isUpdating,
  onSubmit,
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent
            asChild
            className="sm:max-w-lg p-0 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-lg"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="p-6">
                <DialogHeader className="mb-2">
                  <DialogTitle className="text-[18px] md:text-[20px] text-[#25323A]">
                    Update Queue Reason
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Please update the purpose of your visit below
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                  <label className="block text-[13px] font-medium text-[#25323A] mb-2">
                    Purpose of Visit
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g., Medical Consultation, Medical Certificate, Follow-up Checkup, First Aid"
                    className="w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 text-[14px] p-3 placeholder:text-gray-400"
                    value={updatedReason}
                    onChange={(e) => setUpdatedReason(e.target.value)}
                  />
                </div>

                <DialogFooter className="mt-6">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={onClose}
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded-md transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    onClick={onSubmit}
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Updating..." : "Update Reason"}
                  </button>
                </DialogFooter>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
