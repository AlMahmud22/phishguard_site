import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

/// load Inter font from Google Fonts for modern typography
const inter = Inter({ subsets: ["latin"] });

/// metadata configuration for SEO and browser display
export const metadata: Metadata = {
  title: "PhishGuard - Advanced Phishing Detection System",
  description: "Protect yourself from phishing attacks with PhishGuard's intelligent URL scanning and real-time threat detection.",
  keywords: ["phishing", "security", "url scanner", "threat detection", "cybersecurity"],
};

/// root layout component that wraps all pages with consistent structure
/// includes header navigation and footer across entire application
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        {/* Global navigation header */}
        <Header />
        
        {/* Main content area - takes up remaining space */}
        <main className="flex-1">
          {children}
        </main>
        
        {/* Global footer */}
        <Footer />
      </body>
    </html>
  );
}
