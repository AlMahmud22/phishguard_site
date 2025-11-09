import Link from "next/link";

/// Footer component with copyright and basic information
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About section */}
          <div>
            <h3 className="text-lg font-bold mb-3">
              {process.env.NEXT_PUBLIC_APP_NAME || "PhishGuard"}
            </h3>
            <p className="text-gray-400 text-sm">
              Advanced phishing detection system for protecting users from
              malicious URLs and cyber threats.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-lg font-bold mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h3 className="text-lg font-bold mb-3">Project Info</h3>
            <p className="text-gray-400 text-sm">
              Final Year Project
              <br />
              PhishGuard Detection System
              <br />
              PSM 2 - Demo 1 (40%)
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            © {currentYear} PhishGuard. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
