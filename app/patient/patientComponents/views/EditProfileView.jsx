"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { sileo } from "sileo";
import { Save, X, Loader2 } from "lucide-react";
import { getAuthToken } from "../patientUtils";

const API_BASE_URL = "/api/proxy";

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

      sileo.success({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
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

  const inputClass =
    "w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4ad294]/50 focus:border-[#4ad294] transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const errorClass = "text-xs text-red-500 mt-1";

  return (
    <motion.div
      className="w-full max-w-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-[#4ad294] to-[#3bb882] px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Edit Profile</h2>
          <p className="text-sm text-white/80">Update your personal information</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`${inputClass} ${errors.name ? "border-red-400" : ""}`}
                placeholder="Enter your full name"
              />
              {errors.name && <p className={errorClass}>{errors.name}</p>}
            </div>

            <div>
              <label className={labelClass}>Email Address</label>
              <input
                type="email"
                name="email_address"
                value={formData.email_address}
                onChange={handleChange}
                className={`${inputClass} ${errors.email_address ? "border-red-400" : ""}`}
                placeholder="Enter your email"
              />
              {errors.email_address && (
                <p className={errorClass}>{errors.email_address}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>Phone Number</label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className={`${inputClass} ${errors.phone_number ? "border-red-400" : ""}`}
                placeholder="Enter your phone number"
              />
              {errors.phone_number && (
                <p className={errorClass}>{errors.phone_number}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>ID Number (Optional)</label>
              <input
                type="text"
                name="id_number"
                value={formData.id_number}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter your university ID"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#4ad294] hover:bg-[#3bb882] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}