"use client";

import { motion } from "framer-motion";
import { Mail, Phone, CreditCard, Calendar, Clock, Shield } from "lucide-react";

export default function WelcomeCard({ user, isLoading }) {
  if (isLoading) {
    return (
      <motion.div
        className="bg-gradient-to-br from-[#4ad294] to-[#3bb882] rounded-2xl shadow-lg p-6 relative overflow-hidden border border-white/30"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-7 w-1/2 bg-white/20 rounded mb-2" />
          <div className="h-5 w-1/3 bg-white/20 rounded mb-2" />
          <div className="h-5 w-1/4 bg-white/20 rounded mb-2" />
          <div className="h-5 w-1/3 bg-white/20 rounded" />
        </div>
      </motion.div>
    );
  }

  const userInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const InfoItem = ({ icon: Icon, label, value, large = false }) => (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-white/90" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/60 uppercase tracking-wide font-medium">{label}</p>
        <p className={`font-semibold text-white truncate ${large ? "text-lg mt-1" : "text-sm mt-0.5"}`}>
          {value || "—"}
        </p>
      </div>
    </div>
  );

  return (
    <motion.div
      className="bg-gradient-to-br from-[#4ad294] via-[#3ec085] to-[#2fa872] rounded-2xl shadow-xl shadow-[#4ad294]/20 relative overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
      <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/5 rounded-full" />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-white/30 via-white/50 to-white/30" />

      {/* Header Section */}
      <div className="relative p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar Circle with Initials */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">
                  {userInitials(user?.name)}
                </span>
              </div>
              {/* Online Indicator */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-[#3ec085]">
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-50" />
              </div>
            </div>

            {/* Name & Status */}
            <div className="pt-1">
              <p className="text-sm text-white/70 font-medium">Welcome back,</p>
              <h3 className="text-xl font-bold text-white mt-0.5">{user?.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 rounded-full text-xs font-medium text-white/90">
                  <Shield className="w-3 h-3" />
                  Verified Patient
                </span>
              </div>
            </div>
          </div>

          {/* Decorative Icon */}
          <div className="hidden md:block opacity-10">
            <svg className="w-32 h-32 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* Info Grid */}
      <div className="relative p-6 pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <InfoItem
          icon={Mail}
          label="Email Address"
          value={user?.email || user?.email_address}
        />
        <InfoItem
          icon={Phone}
          label="Phone Number"
          value={user?.phone_number || user?.phone}
        />
        <InfoItem
          icon={CreditCard}
          label="ID Number"
          value={user?.id_number}
        />
        <InfoItem
          icon={Calendar}
          label="Member Since"
          value={formatDate(user?.created_at || user?.created)}
        />
      </div>

      {/* Footer Stats Bar */}
      <div className="relative px-6 pb-4">
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/70">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Last updated: {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/60">Active Status</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-300 rounded-full" />
              <span className="text-xs font-semibold text-white">Online</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}