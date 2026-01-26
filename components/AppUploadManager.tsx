"use client";

import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";

interface DownloadInfo {
  id: string;
  filename: string;
  originalFilename: string;
  version: string;
  filesize: number;
  downloadUrl: string;
  releaseNotes: string;
  uploadedAt: string;
  downloadCount: number;
}

interface UploadHistory {
  _id: string;
  filename: string;
  originalFilename: string;
  version: string;
  filesize: number;
  uploadedAt: string;
  uploadedBy: {
    email: string;
    name: string;
  };
}

export default function AppUploadManager() {
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentDownload, setCurrentDownload] = useState<DownloadInfo | null>(
    null
  );
  const [history, setHistory] = useState<UploadHistory[]>([]);

  // Load current download and history on mount
  useEffect(() => {
    loadDownloadInfo();
    loadUploadHistory();
  }, []);

  const loadDownloadInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/app/download-info");
      const data = await response.json();

      if (data.success) {
        setCurrentDownload(data.data);
      }
    } catch (err) {
      console.error("Failed to load download info:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadUploadHistory = async () => {
    try {
      const response = await fetch("/api/admin/app/upload");
      const data = await response.json();

      if (data.success) {
        setHistory(data.data.history || []);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.endsWith(".exe")) {
        setError("Only .exe files are allowed");
        setFile(null);
        return;
      }

      // Validate file size (max 500MB)
      if (selectedFile.size > 500 * 1024 * 1024) {
        setError("File must be smaller than 500MB");
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!file || !version.trim()) {
      setError("Please select a file and enter version number");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("version", version);
      if (releaseNotes.trim()) {
        formData.append("releaseNotes", releaseNotes);
      }

      const response = await fetch("/api/admin/app/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setSuccess(
        `Version ${version} uploaded successfully! Previous version has been archived.`
      );
      setFile(null);
      setVersion("");
      setReleaseNotes("");

      // Reload data
      await loadDownloadInfo();
      await loadUploadHistory();

      // Reset form
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload file"
      );
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Version Display */}
      {currentDownload && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                📥 Current Version
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Version
                  </p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    v{currentDownload.version}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    File Size
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatFileSize(currentDownload.filesize)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Uploaded
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatDate(currentDownload.uploadedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Downloads
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currentDownload.downloadCount}
                  </p>
                </div>
              </div>
              {currentDownload.releaseNotes && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Release Notes
                  </p>
                  <p className="text-sm text-gray-900 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded">
                    {currentDownload.releaseNotes}
                  </p>
                </div>
              )}
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>
      )}

      {/* Upload Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📤 Upload New Version
        </h3>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select .exe File *
            </label>
            <input
              type="file"
              accept=".exe"
              onChange={handleFileChange}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                dark:file:bg-blue-900/20 dark:file:text-blue-400
                hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {file && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Selected: {file.name} ({formatFileSize(file.size)})
              </p>
            )}
          </div>

          {/* Version Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Version Number * (e.g., 1.0.0)
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              disabled={uploading}
              placeholder="1.0.0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                placeholder-gray-500 dark:placeholder-gray-400
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Release Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Release Notes (Optional)
            </label>
            <textarea
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              disabled={uploading}
              placeholder="Describe new features, bug fixes, improvements..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                placeholder-gray-500 dark:placeholder-gray-400
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading || !file || !version}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg
              transition-colors duration-200
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading..." : "Upload New Version"}
          </button>
        </form>
      </div>

      {/* Upload History */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📋 Previous Versions
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">
                    Version
                  </th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">
                    File Size
                  </th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">
                    Uploaded By
                  </th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="py-2 px-2 text-gray-900 dark:text-white">
                      v{item.version}
                    </td>
                    <td className="py-2 px-2 text-gray-600 dark:text-gray-400">
                      {formatFileSize(item.filesize)}
                    </td>
                    <td className="py-2 px-2 text-gray-600 dark:text-gray-400">
                      {item.uploadedBy.name || item.uploadedBy.email}
                    </td>
                    <td className="py-2 px-2 text-gray-600 dark:text-gray-400">
                      {formatDate(item.uploadedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-sm text-amber-800 dark:text-amber-300">
          <strong>ℹ️ Note:</strong> When you upload a new version, the previous
          version will be archived automatically. Users will see and download
          the latest version only.
        </p>
      </div>
    </div>
  );
}
