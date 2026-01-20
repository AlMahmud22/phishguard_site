"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      {/* Futuristic background with gradient and grid */}
      <div className={`relative transition-all duration-500 ${
        scrolled ? "backdrop-blur-2xl" : ""
      }`}>
        {/* Animated gradient background */}
        <motion.div
          animate={{
            background: scrolled
              ? "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 50%, rgba(15, 23, 42, 0.95) 100%)"
              : "linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 50%, rgba(15, 23, 42, 0.98) 100%)",
          }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        />
        
        {/* Tech grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:20px_20px] opacity-40"></div>
        
        {/* Diagonal accent lines */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-60"></div>
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-40"></div>
        
        {/* Glowing orbs - CSS Only */}
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-primary-500 rounded-full filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute top-0 left-1/3 w-64 h-64 bg-cyan-500 rounded-full filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '1s', animationDuration: '3s' }}></div>

        <nav className="relative container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo with futuristic design */}
            <Link href="/" className="flex items-center space-x-3 group relative">
              {/* Hexagonal background for logo */}
              <div className="relative">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className="relative"
                >
                  {/* Hexagonal glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-xl blur-lg opacity-50 group-hover:opacity-80 transition-opacity"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-primary-600 via-cyan-600 to-purple-600 rounded-xl flex items-center justify-center border border-primary-400/30 shadow-xl">
                    <Image
                      src="/phishguard_logo.png"
                      alt="PhishGuard Logo"
                      width={32}
                      height={32}
                      className="object-contain relative z-10"
                      priority
                    />
                  </div>
                </motion.div>
                {/* Animated corner accents */}
                <motion.div
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-400"
                />
                <motion.div
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-primary-400"
                />
              </div>
              
              <div className="flex flex-col">
                <motion.span 
                  className="text-xl font-black bg-gradient-to-r from-primary-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent"
                  animate={{ 
                    backgroundPosition: ["0%", "100%", "0%"],
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  style={{ backgroundSize: "200% auto" }}
                >
                  {process.env.NEXT_PUBLIC_APP_NAME || "PhishGuard"}
                </motion.span>
                <span className="text-[8px] text-cyan-400 font-mono tracking-wider">SECURITY SYSTEM</span>
              </div>
            </Link>

            {/* Desktop Navigation - Futuristic style */}
            <div className="hidden lg:flex items-center space-x-2">
              {/* Nav Links */}
              <NavLink href="/" label="HOME" />
              {isAuthenticated && <NavLink href="/dashboard" label="DASHBOARD" />}
              
              {!isAuthenticated ? (
                <div className="flex items-center gap-3 ml-4">
                  <TechButton href="/login" variant="ghost">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                    LOGIN
                  </TechButton>
                  <TechButton href="/register" variant="primary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                    REGISTER
                  </TechButton>
                </div>
              ) : (
                <div className="flex items-center gap-3 ml-4">
                  {/* User profile chip */}
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-primary-500/30 rounded-lg backdrop-blur-xl relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative w-8 h-8 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-lg">
                      {session?.user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="text-xs">
                      <div className="font-bold text-white">{session?.user?.name}</div>
                      {session?.user?.role && (
                        <div className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider">
                          {session.user.role}
                        </div>
                      )}
                    </div>
                  </motion.div>
                  
                  <TechButton onClick={handleSignOut} variant="danger">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    LOGOUT
                  </TechButton>
                </div>
              )}
            </div>

            {/* Mobile menu button - Tech style */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="lg:hidden relative w-10 h-10 bg-gradient-to-br from-slate-800/80 to-slate-700/80 border border-primary-500/30 rounded-lg flex items-center justify-center group"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
              <svg
                className="w-5 h-5 text-cyan-400 relative z-10 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 12h16" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 18h16" />
                  </>
                )}
              </svg>
            </motion.button>
          </div>

          {/* Mobile Navigation - Futuristic dropdown */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="lg:hidden mt-4 overflow-hidden"
              >
                <div className="relative p-4 bg-gradient-to-br from-slate-900/95 to-slate-800/95 rounded-2xl border border-primary-500/30 backdrop-blur-xl">
                  {/* Grid pattern overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:20px_20px] rounded-2xl"></div>
                  
                  <div className="relative space-y-2">
                    <MobileNavLink href="/" onClick={() => setIsMenuOpen(false)} label="HOME">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    </MobileNavLink>
                    
                    {isAuthenticated && (
                      <MobileNavLink href="/dashboard" onClick={() => setIsMenuOpen(false)} label="DASHBOARD">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                      </MobileNavLink>
                    )}
                    
                    {!isAuthenticated ? (
                      <>
                        <MobileNavLink href="/login" onClick={() => setIsMenuOpen(false)} label="LOGIN">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                        </MobileNavLink>
                        
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Link
                            href="/register"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary-600 to-cyan-600 text-white rounded-xl font-bold text-sm border border-primary-400/50 shadow-lg relative overflow-hidden group"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                            <span className="relative z-10">REGISTER NOW</span>
                          </Link>
                        </motion.div>
                      </>
                    ) : (
                      <>
                        <div className="my-4 p-3 bg-gradient-to-br from-slate-800/50 to-slate-700/50 rounded-xl border border-primary-500/20">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">
                              {session?.user?.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">{session?.user?.name}</div>
                              {session?.user?.role && (
                                <div className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider">
                                  {session.user.role}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setIsMenuOpen(false);
                            handleSignOut();
                          }}
                          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-bold text-sm border border-red-400/50 shadow-lg relative overflow-hidden group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          <span className="relative z-10">LOGOUT</span>
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </div>
    </motion.header>
  );
}

// Futuristic Nav Link Component
function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="group relative px-4 py-2">
      <span className="relative z-10 text-xs font-bold text-gray-300 group-hover:text-cyan-400 transition-colors tracking-wider">
        {label}
      </span>
      {/* Animated underline */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary-500 to-cyan-500"
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.3 }}
      />
      {/* Corner accents */}
      <motion.div
        className="absolute top-0 left-0 w-1 h-1 bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"
        initial={{ scale: 0 }}
        whileHover={{ scale: 1 }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-1 h-1 bg-primary-400 opacity-0 group-hover:opacity-100 transition-opacity"
        initial={{ scale: 0 }}
        whileHover={{ scale: 1 }}
      />
    </Link>
  );
}

// Futuristic Tech Button Component
function TechButton({ 
  href, 
  onClick, 
  variant = "primary", 
  children 
}: { 
  href?: string; 
  onClick?: () => void; 
  variant?: "primary" | "ghost" | "danger";
  children: React.ReactNode;
}) {
  const variantStyles = {
    primary: "bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-500 hover:to-cyan-500 border-primary-400/50 text-white shadow-lg shadow-primary-500/20",
    ghost: "bg-slate-800/50 hover:bg-slate-700/70 border-slate-600/50 text-gray-300 hover:text-white",
    danger: "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 border-red-400/50 text-white shadow-lg shadow-red-500/20",
  };

  const content = (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className={`relative px-5 py-2 rounded-lg border backdrop-blur-xl font-bold text-xs tracking-wider flex items-center gap-2 overflow-hidden group transition-all ${variantStyles[variant]}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="relative z-10 flex items-center gap-2">
        {children}
      </div>
      {/* Tech corner accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-30 group-hover:opacity-60 transition-opacity"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-30 group-hover:opacity-60 transition-opacity"></div>
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return <button onClick={onClick}>{content}</button>;
}

// Mobile Nav Link Component
function MobileNavLink({ 
  href, 
  onClick, 
  label,
  children 
}: { 
  href: string; 
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ x: 5 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        href={href}
        onClick={onClick}
        className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all font-bold text-sm border border-transparent hover:border-primary-500/30 group"
      >
        <div className="relative">
          {children}
          <div className="absolute inset-0 bg-primary-500 blur-lg opacity-0 group-hover:opacity-50 transition-opacity"></div>
        </div>
        <span className="flex-1 tracking-wider">{label}</span>
        <motion.svg
          className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100"
          animate={{ x: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </motion.svg>
      </Link>
    </motion.div>
  );
}
