"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function LoginForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const identifier = (formData.email || "").trim();

    // If numeric, treat as phone and enforce PH local format: 09XXXXXXXXX (11 digits)
    if (/^\d+$/.test(identifier)) {
      if (!/^09\d{9}$/.test(identifier)) {
        setError("Phone numbers must start with 09 and be 11 digits.");
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
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
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
          className="w-full bg-[#4ad294] text-white font-medium py-2 px-4 rounded-lg hover:bg-[#3bb882] transition-colors tracking-wide cursor-pointer"
        >
          Login
        </button>
      </form>
    </motion.div>
  );
}
