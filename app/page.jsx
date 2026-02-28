"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import TopBar from "../components/ui/topbar";
import MainHeader from "../components/ui/mainheader";
import { useSystemStatus } from "./hooks/useSystemStatus";

const TILT_MAX = 9;
const TILT_SPRING = { stiffness: 300, damping: 28 };
const GLOW_SPRING = { stiffness: 180, damping: 22 };

function KeyFeatureSpotlightCard({ title, description, iconSrc, iconAlt }) {
  const accentColor = "#34d399";
  const cardRef = useRef(null);

  const normX = useMotionValue(0.5);
  const normY = useMotionValue(0.5);

  const rawRotateX = useTransform(normY, [0, 1], [TILT_MAX, -TILT_MAX]);
  const rawRotateY = useTransform(normX, [0, 1], [-TILT_MAX, TILT_MAX]);

  const rotateX = useSpring(rawRotateX, TILT_SPRING);
  const rotateY = useSpring(rawRotateY, TILT_SPRING);
  const glowOpacity = useSpring(0, GLOW_SPRING);

  const handleMouseMove = (e) => {
    const el = cardRef.current;
    if (!el) {
      return;
    }

    const rect = el.getBoundingClientRect();
    normX.set((e.clientX - rect.left) / rect.width);
    normY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseEnter = () => {
    glowOpacity.set(1);
  };

  const handleMouseLeave = () => {
    normX.set(0.5);
    normY.set(0.5);
    glowOpacity.set(0);
  };

  return (
    <motion.div
      className="group relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-[border-color] duration-300 hover:border-[#34d399]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      ref={cardRef}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 900,
      }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background: `radial-gradient(ellipse at 20% 20%, ${accentColor}14, transparent 65%)`,
        }}
      />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          opacity: glowOpacity,
          background: `radial-gradient(ellipse at 20% 20%, ${accentColor}2e, transparent 65%)`,
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[55%] -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[280%]"
      />

      <div
        className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          background: `${accentColor}18`,
          boxShadow: `inset 0 0 0 1px ${accentColor}30`,
        }}
      >
        <Image src={iconSrc} alt={iconAlt} width={18} height={18} />
      </div>

      <div className="relative z-10 flex flex-col gap-2">
        <h3 className="text-[14px] font-semibold tracking-tight text-[#25323A]">
          {title}
        </h3>
        <p className="text-[12.5px] leading-relaxed text-[#6C757D]">
          {description}
        </p>
      </div>

      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-[2px] w-0 rounded-full transition-all duration-500 group-hover:w-full"
        style={{
          background: `linear-gradient(to right, ${accentColor}80, transparent)`,
        }}
      />
    </motion.div>
  );
}

function PortalEntryCard({
  title,
  description,
  iconSrc,
  iconAlt,
  accentColor,
  accentSoft,
  buttonText,
  onClick,
  disabled = false,
  delay = 0,
}) {
  const cardRef = useRef(null);
  const normX = useMotionValue(0.5);
  const normY = useMotionValue(0.5);
  const rawRotateX = useTransform(normY, [0, 1], [6, -6]);
  const rawRotateY = useTransform(normX, [0, 1], [-6, 6]);
  const rotateX = useSpring(rawRotateX, TILT_SPRING);
  const rotateY = useSpring(rawRotateY, TILT_SPRING);
  const glowOpacity = useSpring(0, GLOW_SPRING);

  const isInteractive = !disabled && !!onClick;

  const handleMouseMove = (e) => {
    if (!isInteractive) return;
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    normX.set((e.clientX - rect.left) / rect.width);
    normY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseEnter = () => {
    if (!isInteractive) return;
    glowOpacity.set(1);
  };

  const handleMouseLeave = () => {
    normX.set(0.5);
    normY.set(0.5);
    glowOpacity.set(0);
  };

  return (
    <motion.div
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white/95 p-6 transition-[border-color,box-shadow,transform] duration-300 ${
        isInteractive
          ? "cursor-pointer"
          : "cursor-not-allowed opacity-55 grayscale-[0.12]"
      }`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut", delay }}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 950,
        borderColor: isInteractive ? `${accentColor}40` : "#d1d5db",
        boxShadow: isInteractive
          ? "0 4px 12px rgba(0,0,0,0.06)"
          : "0 2px 8px rgba(0,0,0,0.05)",
      }}
      whileHover={
        isInteractive
          ? {
              y: -6,
              scale: 1.012,
              boxShadow: "0 20px 30px -16px rgba(0,0,0,0.2)",
              transition: { duration: 0.18, ease: "easeOut" },
            }
          : {}
      }
      whileTap={isInteractive ? { scale: 0.992 } : {}}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{
          background: `linear-gradient(to right, ${accentColor}, ${accentSoft}, ${accentColor})`,
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at top right, ${accentColor}18, transparent 62%)`,
        }}
      />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: glowOpacity,
          background: `radial-gradient(ellipse at top right, ${accentColor}26, transparent 62%)`,
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[45%] -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[300%]"
      />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            background: `${accentColor}15`,
            boxShadow: `inset 0 0 0 1px ${accentColor}45`,
          }}
        >
          <Image
            src={iconSrc}
            alt={iconAlt}
            width={20}
            height={20}
            className={isInteractive ? "" : "opacity-70"}
          />
        </div>
        <span
          className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide"
          style={{
            background: isInteractive ? `${accentColor}1a` : "#f3f4f6",
            color: isInteractive ? accentColor : "#6b7280",
          }}
        >
          {isInteractive ? "Available" : "Offline"}
        </span>
      </div>

      <div className="relative z-10 mt-4 flex-1">
        <h3 className="text-xl font-semibold tracking-tight text-[#25323A] mb-3">
          {title}
        </h3>
        <p className="text-[#6C757D] leading-relaxed text-[15px]">
          {description}
        </p>
      </div>

      <motion.button
        className="relative z-10 mt-6 w-full font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors"
        whileHover={isInteractive ? { scale: 1.015 } : {}}
        whileTap={isInteractive ? { scale: 0.985 } : {}}
        style={{
          backgroundColor: isInteractive ? accentColor : "#d1d5db",
          color: isInteractive ? "#ffffff" : "#6b7280",
          boxShadow: isInteractive ? `0 8px 18px -10px ${accentColor}` : "none",
        }}
        onClick={onClick}
        disabled={!isInteractive}
      >
        {buttonText}
      </motion.button>
    </motion.div>
  );
}

export default function Home() {
  const router = useRouter();
  const { isOnline, isLoading: isSystemLoading } = useSystemStatus();
  const [showCards, setShowCards] = React.useState(false);
  const portalCards = [
    {
      key: "patient",
      title: "Patient Portal",
      description: "Register, join queue, and track your position in real-time",
      iconSrc: "/icons/users.png",
      iconAlt: "Users Icon",
      accentColor: "#4ad294",
      accentSoft: "#8ee6bc",
      buttonText: isOnline ? "Enter as Patient" : "System Offline",
      disabled: !isOnline,
      delay: 0,
      onClick: () => {
        if (isOnline) {
          router.push("/patient");
        } else {
          toast.error("System is currently offline. Please try again later.");
        }
      },
    },
    {
      key: "staff",
      title: "Staff Dashboard",
      description: "Manage patient queues and track clinic operations",
      iconSrc: "/icons/staff-dashboard.png",
      iconAlt: "Staff Dashboard Icon",
      accentColor: "#00968a",
      accentSoft: "#5ecbc3",
      buttonText: "Admin Login",
      disabled: false,
      delay: 0.16,
      onClick: () => router.push("/admin"),
    },
    {
      key: "queue",
      title: "Queue Display",
      description: "Real-time live queue display for monitoring queue status",
      iconSrc: "/icons/window-mac.png",
      iconAlt: "Computer Icon",
      accentColor: "#374D6C",
      accentSoft: "#6A7F9D",
      buttonText: isOnline ? "View Queue" : "System Offline",
      disabled: !isOnline,
      delay: 0.32,
      onClick: () => {
        if (isOnline) {
          window.open("/queues", "_blank");
        }
      },
    },
  ];

  const keyFeatures = [
    {
      title: "SMS Notifications",
      description:
        "Get notified via SMS when your turn is approaching. No need to wait at the clinic.",
      iconSrc: "/icons/sms-notification.png",
      iconAlt: "SMS Notification Icon",
    },
    {
      title: "Real-Time Updates",
      description:
        "Monitor your queue position live through the web dashboard with automatic updates.",
      iconSrc: "/icons/users.png",
      iconAlt: "Users Icon",
    },
    {
      title: "Easy Registration",
      description:
        "Quick sign-up using your university ID and phone number. No complicated forms.",
      iconSrc: "/icons/staff-dashboard-feature.png",
      iconAlt: "Staff Dashboard Feature Icon",
    },
    {
      title: "Staff Management",
      description:
        "Clinic staff can efficiently manage patient flow and reduce overcrowding.",
      iconSrc: "/icons/computer-feature.png",
      iconAlt: "Computer Feature Icon",
    },
  ];

  // Check if user is authenticated and redirect to patient page
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("userData");

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // If user data is valid, redirect to patient page
        if (parsedUser && parsedUser.id) {
          router.push("/patient");
        }
      } catch (error) {
        // If user data is invalid, clear it
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
      }
    }
  }, [router]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] font-sans">
      {/* Top bar + Header */}
      <TopBar />
      <MainHeader />

      {/* Main Content */}
      <motion.main
        className="flex flex-col items-center justify-center px-8 py-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Initiative Label */}
        <motion.div
          className="inline-flex items-center px-4 py-2 border border-[#4ad294] rounded-full text-[#4ad294] text-sm font-medium mb-6"
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          CSU-UCHW Digital Health Initiative
        </motion.div>

        {/* Slogan */}
        <motion.h2
          className="text-4xl md:text-5xl font-bold text-[#25323A] text-center mb-3 leading-tight"
          variants={itemVariants}
          onAnimationComplete={() => setShowCards(true)}
        >
          Skip the Wait,
          <br />
          Get Notified Instead
        </motion.h2>

        {/* Description */}
        <motion.p
          className="text-lg text-[#25323A] text-center max-w-2xl mb-16 leading-relaxed"
          variants={itemVariants}
        >
          QAlert modernizes the clinic experience at Caraga State University's
          University Center for Health and Wellness. Register online, monitor
          your queue position in real-time, and receive SMS notifications when
          it's your turn.
        </motion.p>

        {/* Feature Cards */}
        <AnimatePresence>
          {showCards && (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {portalCards.map((card) => (
                <PortalEntryCard
                  key={card.key}
                  title={card.title}
                  description={card.description}
                  iconSrc={card.iconSrc}
                  iconAlt={card.iconAlt}
                  accentColor={card.accentColor}
                  accentSoft={card.accentSoft}
                  buttonText={card.buttonText}
                  onClick={card.onClick}
                  disabled={card.disabled}
                  delay={card.delay}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Key Features Section */}
        <motion.section
          className="mt-24 max-w-6xl w-full"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h2
            className="text-3xl font-bold text-[#25323A] text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Key Features
          </motion.h2>

          <motion.div
            className="grid grid-cols-1 gap-6 md:grid-cols-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4, staggerChildren: 0.2 }}
          >
            {keyFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  ease: "easeOut",
                  delay: index * 0.1,
                }}
              >
                <KeyFeatureSpotlightCard
                  title={feature.title}
                  description={feature.description}
                  iconSrc={feature.iconSrc}
                  iconAlt={feature.iconAlt}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      </motion.main>

      {/* Footer */}
      <motion.footer
        className="mt-10 bg-white border-t border-gray-200 py-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="text-center">
          <motion.p
            className="text-[#6C757D] text-sm"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            ©2025 QAlert - Caraga State University - University Center for
            Health and Wellness
          </motion.p>
        </div>
      </motion.footer>
    </div>
  );
}
