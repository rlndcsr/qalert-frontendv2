"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function VerifyEmailForm({ email, onVerified, onBack }) {
  const { verifyEmail, resendVerificationCode } = useAuth();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  // Handle cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();

    // Check if pasted content is a 6-digit code
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split("");
      setCode(newCode);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const verificationCode = code.join("");

    if (verificationCode.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code");
      return;
    }

    setIsVerifying(true);

    try {
      const result = await verifyEmail(email, verificationCode);

      if (result.success) {
        toast.success("Email verified successfully! You can now log in.");
        if (onVerified) {
          onVerified();
        }
      }
    } catch (error) {
      console.error("Verification error:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (isResending || resendCooldown > 0) return;

    setIsResending(true);

    try {
      const result = await resendVerificationCode(email);

      if (result.success) {
        toast.success("Verification code sent! Please check your email.");
        setResendCooldown(60); // 60 seconds cooldown
        setCode(["", "", "", "", "", ""]); // Clear the code inputs
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error("Resend error:", error);
    } finally {
      setIsResending(false);
    }
  };

  // Mask email for display
  const maskedEmail = email ? email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <div className="flex items-center gap-2 mb-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
        <h2 className="text-2xl font-bold text-[#25323A]">Verify Your Email</h2>
      </div>

      <div className="flex items-center gap-2 text-gray-600 mb-6">
        <Mail className="w-4 h-4" />
        <p className="text-sm">
          We've sent a verification code to{" "}
          <span className="font-medium">{maskedEmail}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#25323A] mb-3">
            Enter Verification Code
          </label>
          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-xl font-semibold text-[#25323A] border border-gray-300 rounded-lg focus:border-[#4ad294] focus:ring-2 focus:ring-[#4ad294]/20 focus:outline-none transition-all"
                disabled={isVerifying}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isVerifying || code.some((d) => !d)}
          className={`w-full font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
            isVerifying || code.some((d) => !d)
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-[#4ad294] text-white hover:bg-[#3bb882] cursor-pointer"
          }`}
        >
          {isVerifying ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Verify Email
            </>
          )}
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
          <button
            type="button"
            onClick={handleResendCode}
            disabled={isResending || resendCooldown > 0}
            className={`text-sm font-medium transition-colors ${
              isResending || resendCooldown > 0
                ? "text-gray-400 cursor-not-allowed"
                : "text-[#4ad294] hover:text-[#3bb882] cursor-pointer"
            }`}
          >
            {isResending ? (
              <span className="flex items-center justify-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Sending...
              </span>
            ) : resendCooldown > 0 ? (
              `Resend code in ${resendCooldown}s`
            ) : (
              "Resend Verification Code"
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
