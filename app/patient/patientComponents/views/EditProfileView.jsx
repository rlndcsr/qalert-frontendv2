"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { sileo } from "sileo";
import { Save, X, Loader2, User, Mail, Phone, CreditCard, Camera, Check } from "lucide-react";
import { getAuthToken } from "../patientUtils";

const API_BASE_URL = "/api/proxy";

const FormField = ({ icon: Icon, label, name, type = "text", value, onChange, error, placeholder, required }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-600 mb-2">
        <span className="flex items-center gap-2">
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isFocused ? "bg-[#4ad294]/10 text-[#4ad294]" : "bg-gray-100 text-gray-500"}`}>
            <Icon className="w-4 h-4" />
          </span>
          {label}
          {required && <span className="text-red-400">*</span>}
        </span>
      </label>
      <div className="relative">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`
            w-full pl-11 pr-4 py-3.5 rounded-xl border text-sm transition-all duration-200
            bg-gray-50/50 hover:bg-gray-50 focus:bg-white
            ${error
              ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
              : "border-gray-200 focus:border-[#4ad294] focus:ring-2 focus:ring-[#4ad294]/10"
            }
            outline-none
          `}
        />
        <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${isFocused ? "text-[#4ad294]" : "text-gray-400"}`}>
          <Icon className="w-5 h-5" />
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-500 mt-1.5 pl-1"
          >
            {error}
          </motion.p>
        )}
      </div>
    </div>
  );
};

const SuccessCheckmark = ({ show }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: show ? 1 : 0, opacity: show ? 1 : 0 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className="absolute inset-0 bg-[#4ad294] rounded-xl flex items-center justify-center"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 15 }}
      className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg"
    >
      <Check className="w-8 h-8 text-[#4ad294]" />
    </motion.div>
  </motion.div>
);

export default function EditProfileView({ user, onUpdateUser }) {
  const [formData, setFormData] = useState({
    name: "",
    email_address: "",
    phone_number: "",
    id_number: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (user && !isInitialized) {
      setFormData({
        name: user.name || "",
        email_address: user.email || user.email_address || "",
        phone_number: user.phone_number || user.phone || "",
        id_number: user.id_number || "",
      });
      setIsInitialized(true);
    }
  }, [user, isInitialized]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.email_address.trim()) {
      newErrors.email_address = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_address)) {
      newErrors.email_address = "Please enter a valid email address";
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      sileo.error({
        title: "Not authenticated",
        description: "Your session may have expired. Please log in again.",
      });
      return;
    }

    const userId = user?.id || user?.user_id || user?.uid;
    if (!userId) {
      sileo.error({
        title: "Error",
        description: "Unable to determine your user ID.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": true,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage = data?.message || "Failed to update profile";
        if (errorMessage.toLowerCase().includes("email")) {
          setErrors({ email_address: errorMessage });
        } else {
          sileo.error({
            title: "Update failed",
            description: errorMessage,
          });
        }
        return;
      }

      const updatedUser = { ...user, ...data.user || data };
      if (typeof onUpdateUser === "function") {
        onUpdateUser(updatedUser);
      }

      setIsSuccess(true);
      sileo.success({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      setTimeout(() => setIsSuccess(false), 2000);
    } catch (err) {
      sileo.error({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        email_address: user.email || user.email_address || "",
        phone_number: user.phone_number || user.phone || "",
        id_number: user.id_number || "",
      });
    }
    setErrors({});
  };

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
      className="w-full max-w-3xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Profile Header Card */}
      <motion.div
        className="bg-gradient-to-br from-[#4ad294] via-[#3ec085] to-[#2fa872] rounded-2xl shadow-xl shadow-[#4ad294]/20 p-6 mb-6 relative overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex items-center gap-5">
          {/* Avatar with Edit Button */}
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border-2 border-white/30 bg-white/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarSrc}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-105 transition-transform cursor-pointer">
              <Camera className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
            <p className="text-white/80 text-sm mt-0.5">{user?.email || user?.email_address}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center px-2.5 py-1 bg-white/20 rounded-full text-xs text-white font-medium">
                <span className="w-1.5 h-1.5 bg-white rounded-full mr-1.5 animate-pulse" />
                Active
              </span>
            </div>
          </div>

          {/* Decorative Icon */}
          <div className="hidden sm:block opacity-20">
            <User className="w-32 h-32 text-white" />
          </div>
        </div>
      </motion.div>

      {/* Form Card */}
      <motion.div
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {isSuccess && <SuccessCheckmark show={isSuccess} />}

        {/* Form Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
              <p className="text-sm text-gray-500 mt-0.5">Update your profile details below</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#4ad294]/10 flex items-center justify-center">
              <User className="w-5 h-5 text-[#4ad294]" />
            </div>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              icon={User}
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="Enter your full name"
              required
            />

            <FormField
              icon={Mail}
              label="Email Address"
              name="email_address"
              type="email"
              value={formData.email_address}
              onChange={handleChange}
              error={errors.email_address}
              placeholder="Enter your email address"
              required
            />

            <FormField
              icon={Phone}
              label="Phone Number"
              name="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={handleChange}
              error={errors.phone_number}
              placeholder="Enter your phone number"
              required
            />

            <FormField
              icon={CreditCard}
              label="ID Number"
              name="id_number"
              value={formData.id_number}
              onChange={handleChange}
              placeholder="Enter your university ID (optional)"
            />
          </div>

          {/* Info Banner */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Keep your profile updated</p>
                <p className="text-xs text-blue-700 mt-0.5">Make sure your contact information is accurate for important notifications.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#4ad294] to-[#3bb882] hover:from-[#3bb882] hover:to-[#2fa872] rounded-xl shadow-lg shadow-[#4ad294]/30 hover:shadow-[#4ad294]/40 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}