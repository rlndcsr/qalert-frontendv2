"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function RegisterForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    fullName: "",
    emailRegister: "",
    phoneNumber: "",
    universityId: "",
    passwordRegister: "",
    confirmPassword: "",
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

    const phone = (formData.phoneNumber || "").trim();
    if (!/^09\d{9}$/.test(phone)) {
      setError("Phone numbers must start with 09 and be 11 digits.");
      return;
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
      <h2 className="text-2xl font-bold text-[#25323A] mb-2">Create Account</h2>
      <p className="text-gray-600 mb-6">Register to start using QAlert</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#25323A] mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            placeholder="Your full name"
            className="w-full text-sm text-[#25323A] px-4 py-3 border border-gray-300 rounded-lg focus:border-transparent transition-colors placeholder:text-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#25323A] mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="emailRegister"
            value={formData.emailRegister}
            onChange={handleInputChange}
            placeholder="you@gmail.com"
            className="w-full text-sm text-[#25323A] px-4 py-3 border border-gray-300 rounded-lg focus:border-transparent transition-colors placeholder:text-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#25323A] mb-2">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            placeholder="09XXXXXXXXX"
            className="w-full text-sm text-[#25323A] px-4 py-3 border border-gray-300 rounded-lg focus:border-transparent transition-colors placeholder:text-gray-600"
          />
          <p className="text-sm text-gray-500 mt-1">
            Format: 09XXXXXXXXX (11 digits)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#25323A] mb-2">
            University ID (Optional)
          </label>
          <input
            type="text"
            name="universityId"
            value={formData.universityId}
            onChange={handleInputChange}
            placeholder="e.g., 211-01510"
            className="w-full text-sm text-[#25323A] px-4 py-3 border border-gray-300 rounded-lg focus:border-transparent transition-colors placeholder:text-gray-600"
          />
          <p className="text-sm text-gray-500 mt-1">
            For CSU students/employees only
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#25323A] mb-2">
            Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="passwordRegister"
            value={formData.passwordRegister}
            onChange={handleInputChange}
            placeholder="Enter your password"
            className="w-full text-sm text-[#25323A] px-4 py-3 border border-gray-300 rounded-lg focus:border-transparent transition-colors placeholder:text-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#25323A] mb-2">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Re-enter your password"
            className="w-full text-sm text-[#25323A] px-4 py-3 border border-gray-300 rounded-lg focus:border-transparent transition-colors placeholder:text-gray-600"
          />
        </div>

        {error && <p className="-mt-2 mb-4 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full bg-[#4ad294] text-white font-medium py-2 px-4 rounded-lg hover:bg-[#3bb882] transition-colors cursor-pointer"
        >
          Register
        </button>
      </form>
    </motion.div>
  );
}
