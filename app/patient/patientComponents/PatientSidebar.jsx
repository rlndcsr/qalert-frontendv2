"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Stethoscope,
  ClipboardList,
  Bell,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const sidebarItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "doctors", label: "My Doctors", icon: Stethoscope },
  { id: "queue", label: "Appointment Queue", icon: ClipboardList },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "feedback", label: "Feedback", icon: MessageSquare },
];

export default function PatientSidebar({
  onLogout,
  isLoggingOut,
  activeView,
  onViewChange,
  isExpanded,
  onExpandedChange,
}) {
  const sidebarVariants = {
    expanded: {
      width: 240,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
    collapsed: {
      width: 64,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  const labelVariants = {
    visible: {
      opacity: 1,
      x: 0,
      display: "block",
      transition: {
        duration: 0.15,
        ease: "easeOut",
        delay: 0.05,
      },
    },
    hidden: {
      opacity: 0,
      x: -8,
      transitionEnd: {
        display: "none",
      },
      transition: {
        duration: 0.1,
        ease: "easeIn",
      },
    },
  };

  const handleItemClick = (itemId) => {
    onViewChange(itemId);
  };

  return (
    <motion.aside
      initial={false}
      animate={isExpanded ? "expanded" : "collapsed"}
      variants={sidebarVariants}
      className="fixed left-0 top-0 h-screen bg-white border-r border-gray-200/50 shadow-sm z-40 flex flex-col"
    >
      {/* Toggle Button */}
      <button
        onClick={() => onExpandedChange(!isExpanded)}
        className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer z-50"
        aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 0 : 180 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
        </motion.div>
      </button>

      {/* Logo / Icon */}
      <div className="px-3 pt-6 pb-4 border-b border-gray-100 flex flex-col items-center h-[160px]">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="logo"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="w-24 h-24 flex items-center justify-center"
            >
              <Image
                src="/images/qalert-logo.png"
                alt="QAlert Logo"
                width={256}
                height={256}
                className="w-24 h-24 object-contain"
                quality={100}
                priority
                unoptimized
              />
            </motion.div>
          ) : (
            <motion.div
              key="icon"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="w-10 h-10 flex items-center justify-center"
            >
              <Image
                src="/images/qalert-icon.png"
                alt="QAlert Icon"
                width={128}
                height={128}
                className="w-10 h-10 object-contain"
                quality={100}
                priority
                unoptimized
              />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.p
              variants={labelVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="mt-2 text-xs text-gray-500 text-center whitespace-nowrap"
            >
              Queueing and Notification System
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 pt-4 px-2 overflow-hidden">
        <ul className="space-y-3">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer group relative ${
                    isActive
                      ? "bg-[#4ad294]/10 text-[#4ad294]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    <Icon
                      className={`w-5 h-5 ${
                        isActive
                          ? "text-[#4ad294]"
                          : "text-gray-500 group-hover:text-gray-700"
                      }`}
                    />
                  </div>
                  <AnimatePresence mode="wait">
                    {isExpanded && (
                      <motion.span
                        variants={labelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className={`text-sm font-medium whitespace-nowrap overflow-hidden ${
                          isActive ? "text-[#4ad294]" : ""
                        }`}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Tooltip for collapsed state */}
                  {!isExpanded && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="px-2 pb-4 border-t border-gray-100 pt-4">
        <button
          onClick={onLogout}
          disabled={isLoggingOut}
          className={`w-full flex items-center gap-3 px-3 py-2.5 mb-4 rounded-lg transition-colors cursor-pointer group relative ${
            isLoggingOut
              ? "opacity-50 cursor-not-allowed"
              : "text-gray-600 hover:bg-red-50 hover:text-red-600"
          }`}
        >
          <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
            <LogOut
              className={`w-5 h-5 ${
                isLoggingOut
                  ? "text-gray-400"
                  : "text-gray-500 group-hover:text-red-500"
              }`}
            />
          </div>
          <AnimatePresence mode="wait">
            {isExpanded && (
              <motion.span
                variants={labelVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>

          {/* Tooltip for collapsed state */}
          {!isExpanded && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Logout
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
