import Link from "next/link";

/// Home page - landing page with welcome message and PhishGuard introduction
export default function Home() {
  return (
    <div className="min-h-[80vh]">
      {/* Hero section */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to PhishGuard
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Advanced phishing detection system that protects you from malicious
            URLs and cyber threats in real-time.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register" className="btn-primary text-lg">
              Get Started
            </Link>
            <Link href="/login" className="btn-secondary text-lg">
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-16 container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1: Real-time scanning */}
          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-Time Scanning</h3>
            <p className="text-gray-600">
              Instantly analyze URLs for phishing threats with our advanced
              detection algorithms.
            </p>
          </div>

          {/* Feature 2: Desktop integration */}
          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Desktop Client</h3>
            <p className="text-gray-600">
              Access PhishGuard through our dedicated desktop application for
              seamless protection.
            </p>
          </div>

          {/* Feature 3: Analytics dashboard */}
          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Analytics Dashboard
            </h3>
            <p className="text-gray-600">
              View detailed scan history, statistics, and insights about your
              protection.
            </p>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="bg-primary-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Protect Yourself?
          </h2>
          <p className="text-xl mb-8">
            Join PhishGuard today and stay safe from phishing attacks.
          </p>
          <Link href="/register" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block">
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
}
