"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";

export default function RegisterForm({ onSubmit }) {
  const { registerWithAPI } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    emailRegister: "",
    phoneNumber: "",
    universityId: "",
    passwordRegister: "",
    confirmPassword: "",
    gender: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear any existing errors
    setIsSubmitting(true);

    try {
      const result = await registerWithAPI(formData);
      if (result.success) {
        // Call the original onSubmit if provided (for any additional handling)
        if (onSubmit) {
          onSubmit(formData);
        }
        // Reset form on success
        setFormData({
          fullName: "",
          emailRegister: "",
          phoneNumber: "",
          universityId: "",
          passwordRegister: "",
          confirmPassword: "",
          gender: "",
        });
      } else {
        // Registration failed - error toast already shown by useAuth hook
        // No need to set form error since backend errors are shown as toasts
      }
    } catch (error) {
      // Handle unexpected errors - error toast already shown by useAuth hook
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
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
            Gender <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Male", value: "male" },
              { label: "Female", value: "female" },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`group cursor-pointer flex flex-col items-center justify-center rounded-md border px-2 py-3 text-xs font-medium transition-all select-none
                  ${
                    formData.gender === opt.value
                      ? "border-[#4ad294] bg-[#F0FDF4] text-[#25323A] shadow-sm"
                      : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                  }`}
              >
                <input
                  type="radio"
                  name="gender"
                  value={opt.value}
                  checked={formData.gender === opt.value}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
          {formData.gender === "" && (
            <p className="text-xs text-gray-500 mt-1">
              Please select your gender.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#25323A] mb-2">
            ID Number (Optional)
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

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full font-medium py-2 px-4 rounded-lg transition-colors ${
            isSubmitting
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-[#4ad294] text-white hover:bg-[#3bb882] cursor-pointer"
          }`}
        >
          {isSubmitting ? "Registering..." : "Register"}
        </button>
      </form>
    </motion.div>
  );
}
