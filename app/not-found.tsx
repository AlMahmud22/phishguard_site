import Link from "next/link";

/// custom 404 page displayed when user navigates to non-existent route
/// provides branded error message and navigation options to return to app
export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* Large 404 display */}
        <h1 className="text-9xl font-bold text-blue-600 mb-4">404</h1>
        
        {/* Error message */}
        <h2 className="text-3xl font-semibold text-gray-900 mb-4">
          Page Not Found
        </h2>
        
        <p className="text-lg text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back on track.
        </p>
        
        {/* Navigation options */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Go to Homepage
          </Link>
          
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Go to Dashboard
          </Link>
        </div>
        
        {/* Additional help text */}
        <p className="mt-8 text-sm text-gray-500">
          Need help? Contact our support team or check our documentation.
        </p>
      </div>
    </div>
  );
}
