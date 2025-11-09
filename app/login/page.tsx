"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { LoginCredentials, AuthResponse } from "@/types";

/// Login page - user authentication form
export default function LoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /// handle form submission and authentication
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      /// send login request to backend API
      const response = await api.post<AuthResponse>("/auth/login", credentials);

      if (response.data.success && response.data.token) {
        /// store authentication token in localStorage
        localStorage.setItem("authToken", response.data.token);
        
        /// redirect to dashboard on successful login
        router.push("/dashboard");
      } else {
        setError(response.data.message || "Login failed. Please try again.");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Unable to connect to server. Please check your connection."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="card">
          {/* Page header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Login to PhishGuard
            </h1>
            <p className="text-gray-600">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Error message display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={credentials.email}
                onChange={(e) =>
                  setCredentials({ ...credentials, email: e.target.value })
                }
                placeholder="your.email@example.com"
              />
            </div>

            {/* Password input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                placeholder="Enter your password"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Link to registration page */}
          <p className="mt-6 text-center text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
