"use client";

import { useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Users,
  LogOut,
  ChevronLeft,
  X,
  AlertTriangle,
} from "lucide-react";

const sidebarItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "patient-record", label: "Patient Record", icon: Users },
  {
    id: "emergency-encounters",
    label: "Emergency Encounters",
    icon: AlertTriangle,
  },
];

export default function AdminSidebar({
  onLogout,
  isLoggingOut,
  activeView,
  onViewChange,
  isExpanded,
  onExpandedChange,
  isMobileOpen,
  onMobileClose,
}) {
  // Close mobile sidebar on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isMobileOpen) {
        onMobileClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileOpen, onMobileClose]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

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

  const mobileSlideVariants = {
    hidden: {
      x: "-100%",
      transition: {
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
    visible: {
      x: 0,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const handleItemClick = (itemId) => {
    onViewChange(itemId);
    // Close mobile sidebar when item is clicked
    if (isMobileOpen) {
      onMobileClose();
    }
  };

  // Sidebar content (shared between desktop and mobile)
  const SidebarContent = ({ showLabels, isMobile = false }) => (
    <>
      {/* Close button for mobile */}
      {isMobile && (
        <button
          onClick={onMobileClose}
          className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      )}

      {/* Toggle Button - Desktop only */}
      {!isMobile && (
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
      )}

      {/* Logo / Icon */}
      <div
        className={`px-3 pt-6 pb-4 border-b border-gray-100 flex flex-col items-center ${
          isMobile ? "h-auto" : "h-[160px]"
        }`}
      >
        {showLabels ? (
          <div className="w-24 h-24 flex items-center justify-center">
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
          </div>
        ) : (
          <div className="w-10 h-10 flex items-center justify-center">
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
          </div>
        )}
        {showLabels && (
          <p className="mt-2 text-xs text-gray-500 text-center whitespace-nowrap">
            Queueing and Notification System
          </p>
        )}
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
                      ? "bg-[#00968a]/10 text-[#00968a]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    <Icon
                      className={`w-5 h-5 ${
                        isActive
                          ? "text-[#00968a]"
                          : "text-gray-500 group-hover:text-gray-700"
                      }`}
                    />
                  </div>
                  {showLabels ? (
                    <span
                      className={`text-sm font-medium whitespace-nowrap overflow-hidden ${
                        isActive ? "text-[#00968a]" : ""
                      }`}
                    >
                      {item.label}
                    </span>
                  ) : (
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
          onClick={() => {
            onLogout();
            if (isMobile) onMobileClose();
          }}
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
          {showLabels ? (
            <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
              Logout
            </span>
          ) : (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Logout
            </div>
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={isExpanded ? "expanded" : "collapsed"}
        variants={sidebarVariants}
        className="fixed left-0 top-0 h-screen bg-white border-r border-gray-200/50 shadow-sm z-40 flex-col hidden lg:flex"
      >
        <SidebarContent showLabels={isExpanded} isMobile={false} />
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={onMobileClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            variants={mobileSlideVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200/50 shadow-lg z-50 flex flex-col lg:hidden"
          >
            <SidebarContent showLabels={true} isMobile={true} />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
