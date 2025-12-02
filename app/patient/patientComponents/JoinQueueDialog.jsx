"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function JoinQueueDialog({
  isOpen,
  onClose,
  joinReason,
  setJoinReason,
  joinReasonCategory,
  setJoinReasonCategory,
  joinReasonError,
  setJoinReasonError,
  joinReasonCategoryError,
  setJoinReasonCategoryError,
  isJoining,
  onSubmit,
  user,
}) {
  const reasonCategories = [
    { id: 1, name: "Minor Illness" },
    { id: 2, name: "Injury" },
    { id: 3, name: "First Aid" },
    { id: 4, name: "Health Assessment" },
    { id: 5, name: "Counseling" },
    { id: 6, name: "Emergency" },
  ];
  return (
    <AnimatePresence mode="wait" initial={false}>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent
            asChild
            className="sm:max-w-xl p-0 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-lg"
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
                    Join the Queue
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Please specify the purpose of your visit
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                  <label className="block text-[13px] font-medium text-[#25323A] mb-2">
                    Purpose of Visit
                  </label>
                  <Select
                    value={joinReasonCategory}
                    onValueChange={(value) => {
                      setJoinReasonCategory(value);
                      setJoinReasonCategoryError("");
                    }}
                  >
                    <SelectTrigger className={`w-full text-[14px] ${joinReasonCategoryError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}>
                      <SelectValue placeholder="Purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      {reasonCategories.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {joinReasonCategoryError && (
                    <p className="text-red-500 text-xs mt-1">{joinReasonCategoryError}</p>
                  )}
                </div>

                <div className="mt-4">
                  <label className="block text-[13px] font-medium text-[#25323A] mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g., Medical Consultation, Medical Certificate, Follow-up Checkup, First Aid"
                    className={`w-full rounded-md border focus:outline-none focus:ring-2 text-[14px] p-3 placeholder:text-gray-400 ${
                      joinReasonError
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-[#4ad294] focus:border-[#4ad294]'
                    }`}
                    value={joinReason}
                    onChange={(e) => {
                      setJoinReason(e.target.value);
                      setJoinReasonError("");
                    }}
                  />
                  {joinReasonError && (
                    <p className="text-red-500 text-xs mt-1">{joinReasonError}</p>
                  )}
                </div>

                <div className="mt-4 flex items-start gap-3 rounded-md border border-[#4ad294]/30 bg-[#F0FDF4] p-3">
                  <div className="w-8 h-8 bg-white border border-[#4ad294]/30 rounded-full flex items-center justify-center mt-[2px]">
                    <Image
                      src="/icons/bell.png"
                      alt="Notifications"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-[#25323A]">
                      SMS Notifications Enabled
                    </p>
                    <p className="text-gray-600">
                      Updates will be sent to{" "}
                      <span className="font-semibold">
                        {user?.phone_number ||
                          user?.phone ||
                          "your phone number"}
                      </span>
                    </p>
                  </div>
                </div>

                <DialogFooter className="mt-6">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-semibold text-white bg-[#4ad294] hover:bg-[#3bb882] rounded-md transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={isJoining}
                    onClick={onSubmit}
                  >
                    {isJoining ? "Joining..." : "Join Queue"}
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
