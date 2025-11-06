"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import TopBar from "../components/ui/topbar";
import MainHeader from "../components/ui/mainheader";

export default function Home() {
  const router = useRouter();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
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
        duration: 0.8,
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
          className="text-4xl md:text-5xl font-bold text-[#25323A] text-center mb-6 leading-tight"
          variants={itemVariants}
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
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full"
          variants={containerVariants}
        >
          {/* Patient Portal Card */}
          <motion.div
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:border-[#a8e6c3] transition-colors duration-300"
            variants={itemVariants}
            whileHover={{
              y: -8,
              scale: 1.02,
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <motion.div
              className="w-10 h-10 bg-white border-2 border-[#a8e6c3] rounded-md flex items-center justify-center mb-3"
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Image
                src="/icons/users.png"
                alt="Users Icon"
                width={20}
                height={20}
              />
            </motion.div>
            <h3 className="text-xl font-semibold text-[#25323A] mb-4">
              Patient Portal
            </h3>
            <p className="text-[#6C757D] mb-6">
              Register, join queue, and track your position in real-time
            </p>
            <motion.button
              className="w-full bg-[#4ad294] text-white font-medium py-2 px-4 rounded-lg hover:bg-[#3bb882] transition-colors text-sm hover:cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/patient")}
            >
              Enter as Patient
            </motion.button>
          </motion.div>

          {/* Staff Dashboard Card */}
          <motion.div
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:border-[#80cbc4] transition-colors duration-300"
            variants={itemVariants}
            whileHover={{
              y: -8,
              scale: 1.02,
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <motion.div
              className="w-10 h-10 bg-white border-2 border-[#80cbc4] rounded-md flex items-center justify-center mb-3"
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Image
                src="/icons/staff-dashboard.png"
                alt="Staff Dashboard Icon"
                width={20}
                height={20}
              />
            </motion.div>
            <h3 className="text-xl font-semibold text-[#25323A] mb-4">
              Staff Dashboard
            </h3>
            <p className="text-[#6C757D] mb-6">
              Manage patient queues and track clinic operations
            </p>
            <motion.button
              className="w-full bg-[#00968a] text-white font-medium py-2 px-4 rounded-lg hover:bg-[#007a6e] transition-colors text-sm hover:cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Staff Login
            </motion.button>
          </motion.div>

          {/* Queue Display Card */}
          <motion.div
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:border-[#c8a2f0] transition-colors duration-300"
            variants={itemVariants}
            whileHover={{
              y: -8,
              scale: 1.02,
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <motion.div
              className="w-10 h-10 bg-white border-2 border-[#c8a2f0] rounded-md flex items-center justify-center mb-3"
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Image
                src="/icons/computer.png"
                alt="Computer Icon"
                width={20}
                height={20}
              />
            </motion.div>
            <h3 className="text-xl font-semibold text-[#25323A] mb-4">
              Queue Display
            </h3>
            <p className="text-[#6C757D] mb-6">
              Public display for clinic waiting room
            </p>
            <motion.button
              className="mt-6 w-full bg-[#9611f8] text-white font-medium py-2 px-4 rounded-lg hover:bg-[#7e0dd4] transition-colors text-sm hover:cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              View Display
            </motion.button>
          </motion.div>
        </motion.div>

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
            className="grid grid-cols-1 md:grid-cols-2 gap-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4, staggerChildren: 0.2 }}
          >
            {/* SMS Notifications */}
            <motion.div
              className="flex items-start gap-4"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              whileHover={{ x: 5 }}
            >
              <motion.div
                className="w-12 h-12 bg-[#a8e6c3] rounded-md flex items-center justify-center flex-shrink-0"
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Image
                  src="/icons/sms-notification.png"
                  alt="SMS Notification Icon"
                  width={24}
                  height={24}
                />
              </motion.div>
              <div>
                <h3 className="text-xl font-semibold text-[#25323A] mb-2">
                  SMS Notifications
                </h3>
                <p className="text-[#6C757D]">
                  Get notified via SMS when your turn is approaching. No need to
                  wait at the clinic.
                </p>
              </div>
            </motion.div>

            {/* Real-Time Updates */}
            <motion.div
              className="flex items-start gap-4"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              whileHover={{ x: -5 }}
            >
              <motion.div
                className="w-12 h-12 bg-[#a8e6c3] rounded-md flex items-center justify-center flex-shrink-0"
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Image
                  src="/icons/users.png"
                  alt="Users Icon"
                  width={24}
                  height={24}
                />
              </motion.div>
              <div>
                <h3 className="text-xl font-semibold text-[#25323A] mb-2">
                  Real-Time Updates
                </h3>
                <p className="text-[#6C757D]">
                  Monitor your queue position live through the web dashboard
                  with automatic updates.
                </p>
              </div>
            </motion.div>

            {/* Easy Registration */}
            <motion.div
              className="flex items-start gap-4"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              whileHover={{ x: 5 }}
            >
              <motion.div
                className="w-12 h-12 bg-[#a8e6c3] rounded-md flex items-center justify-center flex-shrink-0"
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Image
                  src="/icons/staff-dashboard-feature.png"
                  alt="Staff Dashboard Feature Icon"
                  width={24}
                  height={24}
                />
              </motion.div>
              <div>
                <h3 className="text-xl font-semibold text-[#25323A] mb-2">
                  Easy Registration
                </h3>
                <p className="text-[#6C757D]">
                  Quick sign-up using your university ID and phone number. No
                  complicated forms.
                </p>
              </div>
            </motion.div>

            {/* Staff Management */}
            <motion.div
              className="flex items-start gap-4"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              whileHover={{ x: -5 }}
            >
              <motion.div
                className="w-12 h-12 bg-[#a8e6c3] rounded-md flex items-center justify-center flex-shrink-0"
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Image
                  src="/icons/computer-feature.png"
                  alt="Computer Feature Icon"
                  width={24}
                  height={24}
                />
              </motion.div>
              <div>
                <h3 className="text-xl font-semibold text-[#25323A] mb-2">
                  Staff Management
                </h3>
                <p className="text-[#6C757D]">
                  Clinic staff can efficiently manage patient flow and reduce
                  overcrowding.
                </p>
              </div>
            </motion.div>
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
            ©2025 QAlert - Caraga State University University Center for Health
            and Wellness
          </motion.p>
        </div>
      </motion.footer>
    </div>
  );
}
