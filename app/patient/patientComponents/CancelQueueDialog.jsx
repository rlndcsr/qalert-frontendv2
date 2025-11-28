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

export default function CancelQueueDialog({
  isOpen,
  onClose,
  queueEntry,
  queuePosition,
  isCancelling,
  onConfirm,
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
                  <DialogTitle className="text-[18px] md:text-[20px] text-[#25323A] flex items-center gap-2">
                    <span className="inline-flex w-5 h-5 rounded-full bg-red-100 items-center justify-center">
                      <svg
                        viewBox="0 0 24 24"
                        className="w-3.5 h-3.5 text-red-600"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M12 2.25a9.75 9.75 0 1 0 0 19.5 9.75 9.75 0 0 0 0-19.5Zm3.53 12.72a.75.75 0 1 1-1.06 1.06L12 13.56l-2.47 2.47a.75.75 0 0 1-1.06-1.06L10.44 12 7.97 9.53a.75.75 0 1 1 1.06-1.06L12 10.44l2.47-2.47a.75.75 0 1 1 1.06 1.06L13.56 12l2.47 2.47Z" />
                      </svg>
                    </span>
                    Cancel Queue Entry?
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Are you sure you want to cancel your queue entry?
                  </DialogDescription>
                </DialogHeader>

                {/* Summary Panel */}
                <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                      <span className="text-gray-500">Position:</span>
                      <span className="font-medium">
                        {queuePosition ? `#${queuePosition}` : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                      <span className="text-gray-500">Wait Time:</span>
                      <span className="font-medium">
                        {queueEntry?.estimated_time_wait ?? "Pending"}
                      </span>
                    </div>
                    <div className="sm:col-span-2 flex items-start gap-2">
                      <span className="text-gray-500">Purpose:</span>
                      <span className="font-medium break-words">
                        {queueEntry?.reason || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Note */}
                <div className="mt-4 text-xs rounded-md border border-amber-200 bg-amber-50 text-amber-800 p-3">
                  <span className="font-medium">Note:</span> You'll need to
                  rejoin the queue if you change your mind, and you may lose
                  your current position.
                </div>

                <DialogFooter className="mt-6">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={onClose}
                    disabled={isCancelling}
                  >
                    Keep My Spot
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-semibold text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-md transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    onClick={onConfirm}
                    disabled={isCancelling}
                  >
                    {isCancelling ? "Cancelling..." : "Yes, Cancel Entry"}
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
