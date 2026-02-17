/**
 * GET /api/engines/status
 * Get status of all detection engines
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { getEngineStatus } from '@/lib/services/scanEngine';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

export async function GET(req: NextRequest) {
  try {
    // Check authentication (optional for status check)
    const session = await getServerSession();
    
    // Get engine status
    const status = await getEngineStatus();

    return createSuccessResponse(status);

  } catch (error: any) {
    console.error('Get engine status error:', error);
    return createErrorResponse('INTERNAL_ERROR', error.message || 'Failed to get engine status', undefined, 500);
  }
}
