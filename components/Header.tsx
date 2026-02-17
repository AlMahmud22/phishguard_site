"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-gradient-to-r from-white via-blue-50 to-white backdrop-blur-xl border-b border-blue-200 shadow-sm">
      <nav className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-12 h-12 flex items-center justify-center transition-all">
              <Image
                src="/phishguard_logo.png"
                alt="PhishGuard Logo"
                width={48}
                height={48}
                className="object-contain group-hover:scale-110 transition-transform"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                {process.env.NEXT_PUBLIC_APP_NAME || "PhishGuard"}
              </span>
              <span className="text-[9px] text-blue-500 font-semibold tracking-wider uppercase">Security System</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <Link href="/" className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors relative group">
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            {isAuthenticated && (
              <Link href="/dashboard" className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors relative group">
                Dashboard
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            )}
            
            {!isAuthenticated ? (
              <div className="flex items-center gap-4 ml-4">
                <Link
                  href="/login"
                  className="px-6 py-2.5 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full text-sm font-semibold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105"
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-4 ml-4">
                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-full shadow-md border border-blue-100">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-lg">
                    {session?.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="text-xs">
                    <div className="font-semibold text-gray-900">{session?.user?.name}</div>
                    {session?.user?.role && (
                      <div className="text-[10px] text-blue-600 uppercase font-medium">{session.user.role}</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-5 py-2.5 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-all"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden w-11 h-11 bg-white rounded-full shadow-md border border-blue-100 flex items-center justify-center hover:bg-blue-50 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 p-4 bg-white rounded-2xl shadow-xl border border-blue-100">
            <div className="space-y-2">
              <Link
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              >
                Home
              </Link>
              
              {isAuthenticated && (
                <Link
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  Dashboard
                </Link>
              )}
              
              {!isAuthenticated ? (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-3 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold transition-all text-center shadow-lg"
                  >
                    Get Started
                  </Link>
                </>
              ) : (
                <>
                  <div className="px-4 py-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-lg">
                        {session?.user?.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{session?.user?.name}</div>
                        {session?.user?.role && (
                          <div className="text-xs text-blue-600 uppercase font-medium">{session.user.role}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
                    className="block w-full px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
