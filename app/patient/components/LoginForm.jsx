"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function LoginForm({ onSubmit, isLoading = false }) {
  const [formData, setFormData] = useState({
    email: "",
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

    const identifier = (formData.email || "").trim();

    // If numeric, treat as phone and enforce PH local format: 09XXXXXXXXX (11 digits)
    if (/^\d+$/.test(identifier)) {
      if (!/^09\d{9}$/.test(identifier)) {
        toast.error("Phone numbers must start with 09 and be 11 digits.");
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
    >
      <h2 className="text-2xl font-bold text-[#25323A] mb-2">Welcome Back</h2>
      <p className="text-gray-600 mb-6">
        Login with your email, phone number, or university ID
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#25323A] mb-2">
            Email / Phone / University ID
          </label>
          <input
            type="text"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="e.g., you@gmail.com or 09XXXXXXXXX"
            className="w-full text-sm text-[#25323A] px-4 py-3 border border-gray-300 rounded-lg focus:border-transparent transition-colors placeholder:text-gray-600"
          />
          <p className="text-sm text-gray-500 mt-1">
            Enter your email, phone number, or university ID
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#25323A] mb-2">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter your password"
            className="w-full text-sm text-[#25323A] px-4 py-3 border border-gray-300 rounded-lg focus:border-transparent transition-colors placeholder:text-gray-600"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full font-medium py-2 px-4 rounded-lg transition-colors tracking-wide ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#4ad294] text-white hover:bg-[#3bb882] cursor-pointer"
          }`}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
    </motion.div>
  );
}
