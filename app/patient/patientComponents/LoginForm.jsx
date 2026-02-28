"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { sileo } from "sileo";
import { Mail, Lock, ShieldCheck } from "lucide-react";

export default function LoginForm({ onSubmit, isLoading = false }) {
  const [formData, setFormData] = useState({
    login: "",
    password: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Prevent submission if already loading
    if (isLoading) {
      return;
    }

    const identifier = (formData.login || "").trim();

    // If numeric, treat as phone and enforce PH local format: 09XXXXXXXXX (11 digits)
    if (/^\d+$/.test(identifier)) {
      if (!/^09\d{9}$/.test(identifier)) {
        sileo.error({
          title: "Invalid phone number",
          description: "Phone numbers must start with 09 and be 11 digits.",
        });
        return;
      }
    }

    onSubmit(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#25323A] mb-1">
            Welcome Back
          </h2>
          <p className="text-sm text-gray-600">
            Sign in with your email, phone number, or university ID.
          </p>
        </div>
        <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg border border-[#4ad294]/30 bg-[#4ad294]/10">
          <ShieldCheck className="w-5 h-5 text-[#25323A]" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[#25323A]">
            Email / ID Number
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
            <input
              type="text"
              name="login"
              value={formData.login}
              onChange={handleInputChange}
              placeholder="name@gmail.com or 211-12345"
              className="w-full h-11 rounded-xl border border-gray-300 bg-white px-10 pr-4 text-sm text-[#25323A] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4ad294]/40 focus:border-[#4ad294] transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[#25323A]">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              className="w-full h-11 rounded-xl border border-gray-300 bg-white px-10 pr-4 text-sm text-[#25323A] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4ad294]/40 focus:border-[#4ad294] transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full h-11 rounded-xl font-semibold text-sm tracking-wide transition-all ${
            isLoading
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "bg-[#4ad294] text-white hover:bg-[#3bb882] shadow-sm hover:shadow cursor-pointer"
          }`}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Your account details are protected and used only for secure access.
        </p>
      </form>
    </motion.div>
  );
}
