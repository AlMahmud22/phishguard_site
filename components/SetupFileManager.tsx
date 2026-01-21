"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface SetupFile {
  _id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  version: string;
  uploadedAt: string;
  isActive: boolean;
  downloadCount: number;
  uploadedBy: {
    name: string;
    email: string;
  };
}

export default function SetupFileManager() {
  const [files, setFiles] = useState<SetupFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [version, setVersion] = useState("1.0.0");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSetupFiles();
  }, []);

  const fetchSetupFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/setup/upload");
      const data = await response.json();
      if (data.success) {
        setFiles(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch setup files:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".exe")) {
        setMessage("❌ Only .exe files are allowed");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setMessage("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("❌ Please select a file first");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("version", version);

      const response = await fetch("/api/admin/setup/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setMessage("✅ Setup file uploaded successfully!");
        setSelectedFile(null);
        setVersion("1.0.0");
        fetchSetupFiles();
        
        // Clear file input
        const fileInput = document.getElementById("setup-file-input") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (error) {
      setMessage("❌ Failed to upload setup file");
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-200"
      >
        <div className="flex items-center mb-6">
          <div className="bg-blue-600 rounded-xl p-3 mr-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Upload Setup File</h2>
            <p className="text-gray-600">Upload the PhishGuard desktop application installer (.exe)</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Setup File (.exe)
            </label>
            <input
              id="setup-file-input"
              type="file"
              accept=".exe"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: <span className="font-medium">{selectedFile.name}</span> ({formatFileSize(selectedFile.size)})
              </p>
            )}
          </div>

          {/* Version Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Version Number
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g., 1.0.0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
              !selectedFile || uploading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
            }`}
          >
            {uploading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </span>
            ) : (
              "Upload Setup File"
            )}
          </button>

          {/* Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg ${
                message.includes("✅")
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-red-100 text-red-800 border border-red-300"
              }`}
            >
              {message}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Setup Files List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Setup File History</h2>
          <p className="text-sm text-gray-600 mt-1">All uploaded setup files (active file highlighted)</p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-gray-600">No setup files uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {files.map((file) => (
                <motion.div
                  key={file._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-5 rounded-xl border-2 transition-all ${
                    file.isActive
                      ? "bg-green-50 border-green-400 shadow-md"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{file.originalName}</h3>
                        {file.isActive && (
                          <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                            ACTIVE
                          </span>
                        )}
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                          v{file.version}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-gray-500">File Size</p>
                          <p className="text-sm font-medium text-gray-900">{formatFileSize(file.fileSize)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Downloads</p>
                          <p className="text-sm font-medium text-gray-900">{file.downloadCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Uploaded By</p>
                          <p className="text-sm font-medium text-gray-900">{file.uploadedBy?.name || "Unknown"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Upload Date</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(file.uploadedAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
