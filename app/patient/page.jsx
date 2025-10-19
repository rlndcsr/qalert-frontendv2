"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function PatientPortal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    emailRegister: "",
    phoneNumber: "",
    universityId: "",
    passwordRegister: "",
    confirmPassword: "",
  });
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === "login") {
      setLoginError("");
      const identifier = (formData.email || "").trim();
      // If numeric, treat as phone and enforce PH local format: 09XXXXXXXXX (11 digits)
      if (/^\d+$/.test(identifier)) {
        if (!/^09\d{9}$/.test(identifier)) {
          setLoginError("Phone numbers must start with 09 and be 11 digits.");
          return;
        }
      }
      console.log("Login submitted:", {
        email: formData.email,
        password: formData.password,
      });
    } else {
      setRegisterError("");
      const phone = (formData.phoneNumber || "").trim();
      if (!/^09\d{9}$/.test(phone)) {
        setRegisterError("Phone numbers must start with 09 and be 11 digits.");
        return;
      }
      console.log("Register submitted:", formData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 font-sans flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="bg-white py-4 border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex items-center gap-3 select-none">
            <button
              onClick={() => router.push("/")}
              aria-label="Back to home"
              className="p-1 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
            >
              <Image src="/icons/back.png" alt="Back" width={28} height={28} />
            </button>
            <div className="w-8 h-8 bg-white border-2 border-[#4ad294] rounded-md flex items-center justify-center">
              {/* Patient Portal icon used on the homepage card */}
              <Image
                src="/icons/users.png"
                alt="Patient Portal"
                width={20}
                height={20}
              />
            </div>
            <h1 className="text-lg font-bold text-[#25323A]">Patient Portal</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full flex items-center justify-center px-8 py-16 overflow-y-auto min-h-0">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-center">
          <motion.div
            className="bg-white rounded-lg shadow-lg border  border-gray-200 p-8 w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Tab Selector */}
            <div className="flex mb-8">
              <button
                onClick={() => setActiveTab("login")}
                className={`flex-1 py-3 px-4 rounded-t-lg font-medium transition-colors cursor-pointer ${
                  activeTab === "login"
                    ? "bg-white text-[#25323A] border border-gray-200 border-b-0"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setActiveTab("register")}
                className={`flex-1 py-3 px-4 rounded-t-lg font-medium transition-colors cursor-pointer ${
                  activeTab === "register"
                    ? "bg-white text-[#25323A] border border-gray-200 border-b-0"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Register
              </button>
            </div>

            {/* Animated Forms */}
            <AnimatePresence mode="wait" initial={false}>
              {activeTab === "login" ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <h2 className="text-2xl font-bold text-[#25323A] mb-2">
                    Welcome Back
                  </h2>
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
                        className="w-full text-sm text-[#25323A] px-4 py-3 border border-gray-300 rounded-lg  focus:border-transparent transition-colors placeholder:text-gray-600"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Enter your email, phone number, or university ID
                      </p>
                      {loginError && (
                        <p className="mt-2 text-sm text-red-600">
                          {loginError}
                        </p>
                      )}
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
              ) : (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <h2 className="text-2xl font-bold text-[#25323A] mb-2">
                    Create Account
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Register to start using QAlert
                  </p>

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
                        className="w-full text-sm text-[#25323A]  px-4 py-3 border border-gray-300 rounded-lg  focus:border-transparent transition-colors placeholder:text-gray-600"
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
                        className="w-full text-sm text-[#25323A]  px-4 py-3 border border-gray-300 rounded-lg  focus:border-transparent transition-colors placeholder:text-gray-600"
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
                        className="w-full text-sm text-[#25323A]  px-4 py-3 border border-gray-300 rounded-lg focus:border-transparent transition-colors placeholder:text-gray-600"
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
                        className="w-full text-sm text-[#25323A]  px-4 py-3 border border-gray-300 rounded-lg focus:border-transparent transition-colors placeholder:text-gray-600"
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
                        className="w-full text-sm text-[#25323A]  px-4 py-3 border border-gray-300 rounded-lg focus:border-transparent transition-colors placeholder:text-gray-600"
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
                        className="w-full text-sm text-[#25323A]  px-4 py-3 border border-gray-300 rounded-lg focus:border-transparent transition-colors placeholder:text-gray-600"
                      />
                    </div>

                    {registerError && (
                      <p className="-mt-2 mb-4 text-sm text-red-600">
                        {registerError}
                      </p>
                    )}
                    <button
                      type="submit"
                      className="w-full bg-[#4ad294] text-white font-medium py-2 px-4 rounded-lg hover:bg-[#3bb882] transition-colors cursor-pointer"
                    >
                      Register
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
