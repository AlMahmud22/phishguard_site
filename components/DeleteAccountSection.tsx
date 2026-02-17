"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

interface DeleteAccountProps {
  userProvider: string;
  userEmail: string;
}

export default function DeleteAccountSection({ userProvider, userEmail }: DeleteAccountProps) {
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDeleteAccount = async () => {
    setError("");

    // Validate confirmation text
    if (confirmText !== "DELETE MY ACCOUNT") {
      setError('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    // For credentials users, password is required
    if (userProvider === "credentials" && !password) {
      setError("Password is required to delete your account");
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          confirmText,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Account deleted successfully, sign out and redirect
        await signOut({ callbackUrl: "/" });
      } else {
        setError(data.message || "Failed to delete account");
        setIsDeleting(false);
      }
    } catch (err) {
      setError("Unable to delete account. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="card border-red-200">
        <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-red-800 mb-2">Delete Account</h4>
          <p className="text-sm text-red-700 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <ul className="text-sm text-red-700 space-y-1 mb-4">
            <li>• All your data will be permanently deleted</li>
            <li>• Your scan history will be removed</li>
            <li>• Your account cannot be recovered</li>
            <li>• This action is immediate and irreversible</li>
          </ul>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            aria-label="Open delete account confirmation dialog"
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Delete My Account
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-red-600 mb-4">
              ⚠️ Delete Account
            </h3>
            
            <p className="text-gray-700 mb-4">
              This action <strong>cannot be undone</strong>. This will permanently delete your account <strong>{userEmail}</strong> and remove all your data from our servers.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4 mb-6">
              {userProvider === "credentials" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your password to confirm
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Your password"
                    disabled={isDeleting}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <strong>"DELETE MY ACCOUNT"</strong> to confirm
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="DELETE MY ACCOUNT"
                  disabled={isDeleting}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setPassword("");
                  setConfirmText("");
                  setError("");
                }}
                aria-label="Cancel account deletion"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                aria-label={isDeleting ? "Deleting account" : "Confirm account deletion"}
                aria-busy={isDeleting}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
