"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function WelcomeCard({ user, isLoading }) {
  if (isLoading) {
    return (
      <motion.div
        className="bg-gradient-to-br from-[#4ad294] to-[#3bb882] rounded-2xl shadow-lg p-8 relative overflow-hidden border border-white/30"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Skeleton UI for Welcome Card */}
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-7 w-1/2 bg-white/20 rounded mb-2" />
          <div className="h-5 w-1/3 bg-white/20 rounded mb-2" />
          <div className="h-5 w-1/4 bg-white/20 rounded mb-2" />
          <div className="h-5 w-1/3 bg-white/20 rounded" />
        </div>
      </motion.div>
    );
  }

  const avatarSrc = (() => {
    const g = (user?.gender || user?.sex || user?.profile?.gender || "")
      .toString()
      .toLowerCase();
    if (g.startsWith("f")) return "/images/female-avatar.png";
    if (g.startsWith("m")) return "/images/male-avatar.png";
    return "/images/male-avatar.png";
  })();

  return (
    <motion.div
      className="bg-gradient-to-br from-[#4ad294] via-[#3ec085] to-[#2fa872] rounded-2xl shadow-lg p-6 relative overflow-hidden border border-white/30"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_42%)] pointer-events-none" />
      {/* Heart Rate icon - top left with circular background */}
      <div className="absolute top-6 left-6 w-12 h-12 bg-white/15 rounded-full border-2 border-white/40 flex items-center justify-center backdrop-blur-sm">
        <Image
          src="/icons/heart-rate.png"
          alt=""
          width={48}
          height={48}
          className="w-6 h-6"
          quality={100}
        />
      </div>

      {/* Avatar image - positioned near bottom-right inside card */}
      <Image
        src={avatarSrc}
        alt="Patient avatar"
        width={190}
        height={190}
        className="block absolute right-3 sm:right-4 md:right-5 bottom-0 h-24 sm:h-28 md:h-36 lg:h-40 w-24 sm:w-28 md:w-36 lg:w-40 object-cover pointer-events-none select-none drop-shadow-sm z-0"
        quality={100}
        priority
      />

      {/* Content */}
      <div className="relative z-10 pl-0 pr-24 sm:pr-28 md:pr-40">
        <h2 className="text-sm font-normal ml-16 text-white/90">
          Welcome back,
        </h2>
        <h3 className="text-lg font-semibold ml-16 text-white mb-8">
          {user?.name}
        </h3>

        {/* Email */}
        <div className="flex items-center gap-2 text-white mb-2">
          <Image
            src="/icons/mail.png"
            alt=""
            width={16}
            height={16}
            className="w-4 h-4 flex-shrink-0"
          />
          <span className="text-sm font-normal">
            {user?.email || user?.email_address}
          </span>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-2 text-white mb-2">
          <Image
            src="/icons/telephone.png"
            alt=""
            width={16}
            height={16}
            className="w-4 h-4 flex-shrink-0"
          />
          <span className="text-xs font-normal">
            {user?.phone_number || user?.phone || "—"}
          </span>
        </div>

        {/* ID Number */}
        {user?.id_number && (
          <div className="flex items-center gap-2 text-white">
            <Image
              src="/icons/id.png"
              alt=""
              width={16}
              height={16}
              className="w-4 h-4 flex-shrink-0"
            />
            <span className="text-xs font-normal">{user.id_number}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
