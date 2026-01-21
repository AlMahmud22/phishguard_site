"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface SetupInfo {
  filename: string;
  version: string;
  fileSize: number;
  uploadedAt: string;
  downloadCount: number;
}

export default function DownloadSection() {
  const [setupInfo, setSetupInfo] = useState<SetupInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSetupInfo();
  }, []);

  const fetchSetupInfo = async () => {
    try {
      const response = await fetch("/api/setup/info");
      const data = await response.json();
      if (data.success && data.data) {
        setSetupInfo(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch setup info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch("/api/setup/download");
      
      if (!response.ok) {
        throw new Error("Download failed");
      }

      // Create blob from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement("a");
      a.href = url;
      a.download = setupInfo?.filename || "PhishGuard-Setup.exe";
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Refresh setup info to get updated download count
      setTimeout(fetchSetupInfo, 1000);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download setup file. Please try again later.");
    } finally {
      setDownloading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <section className="py-32 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  if (!setupInfo) {
    return null; // Don't show section if no setup file available
  }

  return (
    <section className="py-32 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
      
      {/* Floating Orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: "1s" }}></div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              className="inline-block mb-6 px-6 py-3 bg-white/20 backdrop-blur-xl text-white rounded-full text-sm font-bold border border-white/30 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              DESKTOP APPLICATION
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              Download <span className="text-cyan-300">PhishGuard</span>
            </h2>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              Get complete protection with our powerful desktop application
            </p>
          </div>

          {/* Download Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 md:p-12 border-2 border-white/20 shadow-2xl"
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Left Side - Icon & Info */}
              <div className="text-center md:text-left">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="inline-block mb-6"
                >
                  <div className="w-32 h-32 bg-gradient-to-br from-white to-cyan-200 rounded-3xl flex items-center justify-center shadow-2xl">
                    <svg className="w-16 h-16 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </motion.div>
                
                <div className="space-y-3 text-white">
                  <h3 className="text-3xl font-bold">PhishGuard Desktop</h3>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-semibold">
                      Version {setupInfo.version}
                    </span>
                    <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-semibold">
                      {formatFileSize(setupInfo.fileSize)}
                    </span>
                    <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-semibold">
                      Windows 10/11
                    </span>
                  </div>
                  <p className="text-white/80 text-sm">
                    Updated: {formatDate(setupInfo.uploadedAt)}
                  </p>
                  <p className="text-white/70 text-sm">
                    {setupInfo.downloadCount.toLocaleString()} downloads
                  </p>
                </div>
              </div>

              {/* Right Side - Download Button & Features */}
              <div>
                <motion.button
                  onClick={handleDownload}
                  disabled={downloading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full py-6 px-8 rounded-2xl font-bold text-lg transition-all shadow-2xl mb-6 ${
                    downloading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                  }`}
                >
                  {downloading ? (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Downloading...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Now
                    </span>
                  )}
                </motion.button>

                <div className="space-y-3">
                  {[
                    { icon: "✓", text: "Real-time URL scanning" },
                    { icon: "✓", text: "AI-powered threat detection" },
                    { icon: "✓", text: "Automatic updates" },
                    { icon: "✓", text: "Cloud sync across devices" },
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center gap-3 text-white"
                    >
                      <span className="w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center text-indigo-900 font-bold text-sm flex-shrink-0">
                        {feature.icon}
                      </span>
                      <span className="text-sm md:text-base">{feature.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Note */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="mt-8 pt-6 border-t border-white/20 text-center text-white/70 text-sm"
            >
              <p>
                By downloading, you agree to our Terms of Service and Privacy Policy. 
                Requires Windows 10 or later. Administrator rights needed for installation.
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
