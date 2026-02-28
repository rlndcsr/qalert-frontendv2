"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { sileo } from "sileo";
import { Mail, Lock } from "lucide-react";

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
    >
      <h2 className="text-2xl font-bold text-[#25323A] mb-2">Welcome Back</h2>
      <p className="text-gray-600 mb-6">
        Login with your email, phone number, or university ID
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#25323A] mb-2">
            Email / ID Number
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              name="login"
              value={formData.login}
              onChange={handleInputChange}
              placeholder="name@gmail.com or 211-12345"
              className="w-full text-sm text-[#25323A] pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:border-transparent transition-colors placeholder:text-gray-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#25323A] mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              className="w-full text-sm text-[#25323A] pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:border-transparent transition-colors placeholder:text-gray-600"
            />
          </div>
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
