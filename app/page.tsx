"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import DownloadSection from "@/components/DownloadSection";
import LordIcon from "@/components/LordIcon";
import ParticlesBackground from "@/components/backgrounds/ParticlesBackground";
import GSAPWaves from "@/components/backgrounds/GSAPWaves";
import AutoSlider from "@/components/AutoSlider";

// Lordicon mapping
const lordicons: Record<string, string> = {
  shield: "https://cdn.lordicon.com/ftnxelbg.json",
  target: "https://cdn.lordicon.com/xzybfbcm.json",
  bolt: "https://cdn.lordicon.com/kiynvdns.json",
  search: "https://cdn.lordicon.com/msoeawqm.json",
  robot: "https://cdn.lordicon.com/wzrwaorf.json",
  clock: "https://cdn.lordicon.com/egiwmiit.json",
  globe: "https://cdn.lordicon.com/ggvdxqyx.json",
  download: "https://cdn.lordicon.com/qhgmphtg.json",
  block: "https://cdn.lordicon.com/jdalicnn.json",
  sparkle: "https://cdn.lordicon.com/lomfljuq.json",
};

export default function Home() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  const stats = [
    { 
      value: "98%", 
      label: "Detection Rate",
      iconType: "target" as const,
      color: "from-primary-500 to-primary-700"
    },
    { 
      value: "<200ms", 
      label: "Scan Speed",
      iconType: "bolt" as const,
      color: "from-blue-400 to-blue-600"
    },
    { 
      value: "1500+", 
      label: "URLs Scanned",
      iconType: "search" as const,
      color: "from-blue-500 to-blue-700"
    },
    { 
      value: "24/7", 
      label: "Protection",
      iconType: "shield" as const,
      color: "from-blue-600 to-primary-600"
    }
  ];

  const features = [
    {
      title: "AI-Powered Detection",
      description: "Advanced machine learning algorithms analyze millions of data points to detect sophisticated phishing attempts with unprecedented accuracy.",
      iconType: "robot" as const,
      gradient: "from-primary-500 to-primary-700"
    },
    {
      title: "Real-Time Protection",
      description: "Instant threat analysis as you browse, protecting you from malicious links before they cause harm with lightning-fast response times.",
      iconType: "bolt" as const,
      gradient: "from-blue-400 to-blue-600"
    },
    {
      title: "Desktop Integration",
      description: "Seamless integration with our desktop app provides continuous protection across all devices with automatic updates.",
      iconType: "target" as const,
      gradient: "from-blue-500 to-blue-700"
    },
    {
      title: "Threat Intelligence",
      description: "Access to global threat databases and real-time intelligence feeds for comprehensive protection against emerging threats.",
      iconType: "globe" as const,
      gradient: "from-primary-600 to-blue-600"
    },
    {
      title: "Smart Analytics",
      description: "Detailed insights and reports help you understand your security posture and browsing patterns with interactive visualizations.",
      iconType: "clock" as const,
      gradient: "from-blue-600 to-primary-600"
    },
    {
      title: "Zero-Day Protection",
      description: "Behavioral analysis detects threats that haven't been seen before, keeping you safe from new attacks and unknown vulnerabilities.",
      iconType: "shield" as const,
      gradient: "from-primary-500 to-blue-700"
    }
  ];

  const howItWorks = [
    { step: "1", title: "Submit URL", description: "Enter any suspicious link or let our desktop app scan automatically in real-time", iconType: "target" as const },
    { step: "2", title: "AI Analysis", description: "Our ML engine analyzes the URL against millions of threat indicators instantly", iconType: "robot" as const },
    { step: "3", title: "Instant Results", description: "Get immediate feedback on threat level and safety recommendations with detailed reports", iconType: "search" as const },
    { step: "4", title: "Stay Protected", description: "Continuous monitoring and updates keep you safe from evolving threats 24/7", iconType: "shield" as const }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
      {/* Hero Section with Waves Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <GSAPWaves colors={["#3b82f6", "#8b5cf6", "#06b6d4"]} speed={2} />
        
        <div className="relative container mx-auto px-4 py-20 z-10">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-primary-200 mb-8">
                <LordIcon src={lordicons.shield} size={32} trigger="loop" />
                <span className="text-sm font-semibold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">Advanced Phishing Detection</span>
              </div>
            </motion.div>

            <motion.h1 
              className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="text-gray-900 text-3d-dark inline-block">Secure Your</span>
              <br />
              <motion.span 
                className="bg-gradient-to-r from-primary-600 via-blue-500 to-blue-600 bg-clip-text text-transparent text-3d inline-block"
                animate={{ 
                  rotateY: [-2, 2, -2],
                  scale: [1, 1.02, 1]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                Digital Life
              </motion.span>
            </motion.h1>

            <motion.p 
              className="text-xl md:text-2xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Next-generation phishing protection powered by AI. Detect malicious URLs in milliseconds 
              and browse with confidence across all your devices.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="group px-10 py-5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl font-bold text-lg transition-all duration-300 flex items-center gap-3 shadow-xl hover:shadow-2xl hover:scale-105"
                >
                  Go to Dashboard
                  <motion.svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </motion.svg>
                </Link>
              ) : (
                <>
                  <a
                    href="/api/download-app"
                    download
                    className="px-10 py-5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl font-bold text-lg transition-all duration-300 flex items-center gap-3 shadow-xl hover:shadow-2xl hover:scale-105"
                  >
                    <LordIcon src={lordicons.download} size={28} trigger="hover" colors={{ primary: "#ffffff", secondary: "#e5e7eb" }} />
                    Download Now
                  </a>

                  <Link
                    href="/login"
                    className="px-10 py-5 bg-white text-primary-600 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all duration-300 shadow-lg"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </motion.div>

            {/* Stats Grid */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  className="bg-white backdrop-blur-sm p-8 rounded-2xl shadow-xl border-2 border-primary-200 group hover:border-primary-400 hover:shadow-2xl transition-all duration-300"
                  whileHover={{ 
                    y: -8,
                    scale: 1.05
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 + i * 0.1 }}
                >
                  <div className="flex justify-center mb-4">
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${stat.color} p-2 flex items-center justify-center shadow-lg`}>
                      <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                        <LordIcon src={lordicons[stat.iconType]} size={48} trigger="hover" colors={{ primary: "#2563eb", secondary: "#1d4ed8" }} />
                      </div>
                    </div>
                  </div>
                  <div className={`text-4xl font-black bg-gradient-to-br ${stat.color} bg-clip-text text-transparent mb-2`}>
                    {stat.value}
                  </div>
                  <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-primary-500 rounded-full flex justify-center p-2">
            <motion.div 
              className="w-1.5 h-1.5 bg-primary-500 rounded-full"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 bg-gradient-to-b from-white via-blue-50 to-white">
        <ParticlesBackground variant="network" color="#000000" />
        <div className="relative container mx-auto px-4 z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                <span className="inline-block text-tilt-left">Enterprise-Grade</span>{" "}
                <span className="text-3d bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent inline-block">Protection</span>
              </h2>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                Comprehensive security features designed to keep you safe from evolving cyber threats
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  className="p-8 bg-white rounded-2xl border-2 border-primary-200 shadow-lg hover:shadow-2xl transition-all group"
                  whileHover={{ 
                    y: -8,
                    scale: 1.02
                  }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <div className="flex justify-center mb-6">
                    <motion.div 
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-blue-600 p-2 shadow-lg"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                        <LordIcon src={lordicons[feature.iconType]} size={48} trigger="hover" colors={{ primary: "#2563eb", secondary: "#1d4ed8" }} />
                      </div>
                    </motion.div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                    {feature.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-center">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-32 bg-gradient-to-b from-white via-blue-50 to-white">
        <ParticlesBackground variant="bubbles" color="#000000" />
        <div className="relative container mx-auto px-4 z-10">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              className="text-center mb-20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
                How It <span className="text-3d bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent inline-block text-tilt-right">Works</span>
              </h2>
              <p className="text-xl text-gray-700">
                Simple, fast, and effective protection in four steps
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {howItWorks.map((step, i) => (
                <motion.div
                  key={i}
                  className="relative text-center bg-white p-8 rounded-2xl border-2 border-primary-200 shadow-lg hover:shadow-2xl transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ 
                    y: -8,
                    scale: 1.02
                  }}
                >
                  {/* Connector Line */}
                  {i < howItWorks.length - 1 && (
                    <div className="hidden lg:block absolute top-20 left-full w-full h-0.5 bg-gradient-to-r from-primary-500 to-blue-500 opacity-30 z-0" />
                  )}
                  
                  <motion.div 
                    className="relative w-32 h-32 bg-gradient-to-br from-primary-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="absolute inset-3 bg-white rounded-2xl flex items-center justify-center">
                      <LordIcon src={lordicons[step.iconType]} size={56} trigger="hover" colors={{ primary: "#2563eb", secondary: "#1d4ed8" }} />
                    </div>
                    <div className="absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg border-4 border-white">
                      {step.step}
                    </div>
                  </motion.div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-base">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section className="relative py-32 bg-gradient-to-b from-white via-blue-50 to-white">
        <ParticlesBackground variant="dots" color="#000000" />
        <div className="relative z-10">
          <DownloadSection />
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden bg-gradient-to-b from-white via-blue-50 to-blue-100">
        <ParticlesBackground variant="snow" color="#000000" />
        
        <div className="relative container mx-auto px-4 z-10">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              Ready to Get <span className="text-3d text-pop-out bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent inline-block">Protected</span>?
            </h2>
            <p className="text-xl text-gray-700 mb-12">
              Join thousands of users who trust PhishGuard to keep them safe online
            </p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Link
                href="/register"
                className="px-10 py-5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
              >
                Create Free Account
              </Link>
              <a
                href="/api/download-app"
                download
                className="px-10 py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold text-lg hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
              >
                Download Desktop App
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
