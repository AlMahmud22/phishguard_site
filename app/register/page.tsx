"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import type { RegisterData } from "@/types";

// Dynamically import Three.js component to avoid SSR issues
const InteractiveBackground = dynamic(
  () => import("@/components/three/InteractiveBackground"),
  { ssr: false }
);

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: "Weak",
    color: "bg-red-500",
  });
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  // Calculate password strength
  useEffect(() => {
    const password = formData.password;
    if (!password) {
      setPasswordStrength({ score: 0, label: "Weak", color: "bg-red-500" });
      return;
    }

    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    score = Object.values(checks).filter(Boolean).length;

    let label = "Weak";
    let color = "bg-red-500";

    if (score >= 5) {
      label = "Very Strong";
      color = "bg-green-600";
    } else if (score >= 4) {
      label = "Strong";
      color = "bg-green-500";
    } else if (score >= 3) {
      label = "Good";
      color = "bg-warning-500";
    } else if (score >= 2) {
      label = "Fair";
      color = "bg-orange-500";
    }

    setPasswordStrength({ score, label, color });
  }, [formData.password]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setErrors([]);
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        setShowVerificationMessage(true);
      } else {
        if (data.errors && Array.isArray(data.errors)) {
          setErrors(data.errors);
        } else {
          setError(data.message || "Registration failed. Please try again.");
        }
      }
    } catch (err: any) {
      setError("Unable to connect to server. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  if (showVerificationMessage) {
    return (
      <div className="min-h-screen bg-black relative">
        {/* Interactive 3D Background */}
        <div className="absolute inset-0 z-0">
          <InteractiveBackground />
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4">
          <motion.div 
            className="max-w-md w-full"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 p-8 rounded-3xl shadow-2xl">
              <div className="text-center">
                <motion.div 
                  className="mb-4 text-6xl"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.6, delay: 0.2 }}
                >
                  ✅
                </motion.div>
                <h1 className="text-3xl font-bold text-white mb-4">
                  Account Created!
                </h1>
                <p className="text-gray-200 mb-6">
                  Your account <strong className="text-primary-400">{formData.email}</strong> has been created successfully.
                </p>
                <p className="text-gray-200 mb-6">
                  You can now login and start using PhishGuard. An admin will review and approve your account shortly.
                </p>
                <div className="bg-primary-500/20 border border-primary-400/50 text-primary-200 px-4 py-3 rounded-xl mb-6 backdrop-blur-sm">
                  <p className="text-sm">
                    <strong>Note:</strong><br />
                    While your account is pending approval, you can still login and explore the platform.
                  </p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="/login"
                    className="inline-block btn-primary"
                  >
                    Go to Login
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Interactive 3D Background */}
      <div className="absolute inset-0 z-0">
        <InteractiveBackground />
      </div>

      <motion.div 
        className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="max-w-md w-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 p-8 rounded-3xl shadow-2xl">
            {/* Page header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                Create Account
              </h1>
              <p className="text-gray-200">
                Join PhishGuard to protect yourself from phishing attacks
              </p>
            </div>

            {/* Error message display */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl mb-6 backdrop-blur-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Validation errors */}
            {errors.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl mb-6 backdrop-blur-sm"
              >
                <p className="font-semibold mb-2">Password requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Registration form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name input */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  className="w-full px-4 py-3 bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-primary-400 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="John Doe"
                />
              </div>

              {/* Email input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  className="w-full px-4 py-3 bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-primary-400 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Password input */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  required
                  className="w-full px-4 py-3 bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-primary-400 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Minimum 8 characters"
                />
                
                {/* Password strength indicator */}
                {formData.password && (
                  <motion.div 
                    className="mt-3"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-300">Password strength:</span>
                      <span className={`text-xs font-semibold ${
                        passwordStrength.score >= 4 ? 'text-green-400' :
                        passwordStrength.score >= 3 ? 'text-warning-400' :
                        'text-red-400'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className={`h-2 rounded-full transition-colors duration-300 ${passwordStrength.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        transition={{ duration: 0.5, type: "spring" }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Use 8+ characters with uppercase, lowercase, number, and special character
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Confirm password input */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  required
                  className="w-full px-4 py-3 bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-primary-400 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  placeholder="Re-enter your password"
                />
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <motion.p 
                    className="text-xs text-red-400 mt-1"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    Passwords don't match
                  </motion.p>
                )}
              </div>

              {/* Submit button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Account...
                  </span>
                ) : "Create Account"}
              </motion.button>
            </form>

            {/* Link to login page */}
            <p className="mt-6 text-center text-gray-200">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
              >
                Login here
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
