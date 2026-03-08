"use client";

import RoleGuard from "@/components/RoleGuard";
import RateLimitDisplay from "@/components/RateLimitDisplay";

/// Admin Rate Limit page - displays rate limiting statistics
export const dynamic = 'force-dynamic'

export default function AdminRateLimitPage() {
  return (
    <RoleGuard allowedRoles={["admin", "tester"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rate Limiting</h1>
          <p className="mt-2 text-gray-600">
            Monitor API rate limits, track violations, and manage throttling configuration.
          </p>
        </div>

        <RateLimitDisplay />
      </div>
    </RoleGuard>
  );
}
