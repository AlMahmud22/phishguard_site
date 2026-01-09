"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import SettingsForm from "@/components/SettingsForm";
import DeleteAccountSection from "@/components/DeleteAccountSection";
import { fetchUserSettings, updateUserSettings } from "@/lib/api";
import type { UserSettings, ApiResponse } from "@/types";

/// Settings page for user preferences and configuration
/// fetches from GET /api/user/settings and updates with PUT /api/user/settings
export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /// fetch user settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        /// fetch user settings and preferences
        const response: ApiResponse<UserSettings> = await fetchUserSettings();
        
        if (response.success && response.data) {
          setSettings(response.data);
        } else {
          setError(response.message || "Failed to load settings");
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
        setError("Unable to load settings. Please try again later.");
        
        /// if authentication fails, redirect to login
        if ((err as any)?.response?.status === 401) {
          router.push("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [router]);

  /// handle settings save
  const handleSave = async (updatedSettings: Partial<UserSettings>) => {
    try {
      /// update user settings and preferences
      const response: ApiResponse<UserSettings> = await updateUserSettings(updatedSettings);
      
      if (response.success && response.data) {
        setSettings(response.data);
      } else {
        throw new Error(response.message || "Failed to update settings");
      }
    } catch (err) {
      console.error("Failed to update settings:", err);
      throw err;
    }
  };

  /// loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your preferences and account</p>
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /// error state
  if (error || !settings) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your preferences and account</p>
        </div>

        <div className="card text-center py-12">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Settings</h3>
          <p className="text-gray-600 mb-4">
            {error || "There was a problem loading your settings. Please try again."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your preferences and account</p>
      </div>

      {/* Settings form */}
      <SettingsForm settings={settings} onSave={handleSave} isLoading={isLoading} />

      {/* Account data management */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Export Data</p>
              <p className="text-sm text-gray-500">Download all your scan history and data</p>
            </div>
            <button className="btn-secondary">
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Section */}
      {session?.user && (
        <DeleteAccountSection 
          userProvider={(session.user as any).provider || "credentials"}
          userEmail={session.user.email || ""}
        />
      )}

      {/* Last updated info */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Last updated: {new Date(settings.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}
