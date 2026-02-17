/**
 * GET /api/scan/[id]
 * Get scan details by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/db';
import Scan from '@/lib/models/Scan';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', 'Unauthorized', undefined, 401);
    }

    const { id } = await params;
    const scanId = id;

    if (!scanId) {
      return createErrorResponse('INVALID_REQUEST', 'Scan ID is required', undefined, 400);
    }

    // Connect to database
    await connectToDatabase();

    // Find scan by custom scanId field (not MongoDB _id)
    const scan = await Scan.findOne({ scanId: scanId });

    if (!scan) {
      return createErrorResponse('NOT_FOUND', 'Scan not found', undefined, 404);
    }

    // Check ownership
    if (scan.userId.toString() !== session.user.id) {
      return createErrorResponse('FORBIDDEN', 'Unauthorized', undefined, 403);
    }

    // Return scan details
    return createSuccessResponse({
      id: scan._id,
      scanId: scan.scanId,
      url: scan.url,
      status: scan.status,
      score: scan.score,
      confidence: scan.confidence,
      verdict: scan.verdict,
      analysis: scan.analysis,
      engines: scan.engines,
      scoring: scan.scoring,
      factors: scan.factors,
      localScore: scan.localScore,
      localFactors: scan.localFactors,
      recommendation: scan.recommendation,
      context: scan.context,
      timestamp: scan.timestamp,
      processingTime: scan.processingTime,
      createdAt: scan.createdAt,
      updatedAt: scan.updatedAt,
    });

  } catch (error: any) {
    console.error('Get scan error:', error);
    return createErrorResponse('INTERNAL_ERROR', error.message || 'Failed to retrieve scan', undefined, 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', 'Unauthorized', undefined, 401);
    }

    const { id } = await params;
    const scanId = id;

    if (!scanId) {
      return createErrorResponse('INVALID_REQUEST', 'Scan ID is required', undefined, 400);
    }

    // Connect to database
    await connectToDatabase();

    // Find and delete scan
    const scan = await Scan.findOneAndDelete({
      _id: scanId,
      userId: session.user.id,
    });

    if (!scan) {
      return createErrorResponse('NOT_FOUND', 'Scan not found or unauthorized', undefined, 404);
    }

    return createSuccessResponse({
      message: 'Scan deleted successfully',
      scanId: scan._id,
    });

  } catch (error: any) {
    console.error('Delete scan error:', error);
    return createErrorResponse('INTERNAL_ERROR', error.message || 'Failed to delete scan', undefined, 500);
  }
}
