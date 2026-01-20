import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

/// comprehensive metadata configuration for SEO, social sharing, and browser display
/// includes Open Graph tags for social media previews and Twitter Card metadata
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://phish.equators.tech'),
  
  title: {
    default: "PhishGuard - Advanced Phishing Detection System",
    template: "%s | PhishGuard",
  },
  description: "Protect yourself from phishing attacks with PhishGuard's intelligent URL scanning and real-time threat detection. Monitor scan history, view analytics, and manage your security settings.",
  keywords: ["phishing", "security", "url scanner", "threat detection", "cybersecurity", "phishing protection", "url analysis", "malware detection"],
  authors: [{ name: "PhishGuard Team" }],
  creator: "PhishGuard",
  publisher: "PhishGuard",
  applicationName: "PhishGuard Dashboard",
  
  /// Open Graph metadata for social media sharing (Facebook, LinkedIn, etc.)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://phish.equators.tech",
    siteName: "PhishGuard",
    title: "PhishGuard - Advanced Phishing Detection System",
    description: "Protect yourself from phishing attacks with PhishGuard's intelligent URL scanning and real-time threat detection.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PhishGuard - Phishing Detection System",
      },
    ],
  },
  
  /// Twitter Card metadata for Twitter sharing
  twitter: {
    card: "summary_large_image",
    title: "PhishGuard - Advanced Phishing Detection System",
    description: "Protect yourself from phishing attacks with PhishGuard's intelligent URL scanning and real-time threat detection.",
    images: ["/twitter-image.png"],
    creator: "@phishguard",
  },
  
  /// favicon and app icons
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  
  /// manifest for PWA support
  manifest: "/manifest.json",
  
  /// additional metadata for search engines
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  /// verification tokens (to be added when available)
  verification: {
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

/// viewport configuration for responsive design
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.className} flex flex-col min-h-screen`} suppressHydrationWarning>
        <AuthProvider>
          <Header />
          <main className="flex-1 pt-20">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
