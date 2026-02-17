/**
 * GET /api/engines/status
 * Get status of all detection engines
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEngineStatus } from '@/lib/services/scanEngine';
import { apiResponse } from '@/lib/apiResponse';

export async function GET(req: NextRequest) {
  try {
    // Check authentication (optional for status check)
    const session = await getServerSession(authOptions);
    
    // Get engine status
    const status = await getEngineStatus();

    return apiResponse(true, status);

  } catch (error: any) {
    console.error('Get engine status error:', error);
    return apiResponse(false, null, error.message || 'Failed to get engine status', 500);
  }
}
