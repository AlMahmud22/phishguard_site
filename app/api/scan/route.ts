export const dynamic = 'force-dynamic'
/**
 * POST /api/scan
 * Submit a URL for scanning
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { scanURL, validateURL } from '@/lib/services/scanEngine';
import connectToDatabase from '@/lib/db';
import Scan from '@/lib/models/Scan';
import { nanoid } from 'nanoid';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', 'Unauthorized', undefined, 401);
    }

    // Parse request body
    const body = await req.json();
    const { url, source = 'manual' } = body;

    if (!url) {
      return createErrorResponse('INVALID_REQUEST', 'URL is required', undefined, 400);
    }

    // Validate URL
    const validation = validateURL(url);
    if (!validation.valid) {
      return createErrorResponse('VALIDATION_ERROR', validation.error || 'Invalid URL', undefined, 400);
    }

    // Connect to database
    await connectToDatabase();

    // Create initial scan record
    const scanId = nanoid(16);
    const initialScan = await Scan.create({
      userId: session.user.id,
      scanId,
      url,
      status: 'safe', // Will be updated
      score: 0,
      confidence: 0,
      verdict: {
        isSafe: false,
        isPhishing: false,
        isMalware: false,
        isSpam: false,
        category: 'unknown',
      },
      analysis: {
        domain: {
          name: new URL(url).hostname,
          reputation: 'unknown',
        },
        security: {
          hasHttps: url.startsWith('https'),
          hasSsl: url.startsWith('https'),
        },
        ml: {
          cloudScore: 0,
          combinedScore: 0,
          model: '3-engine',
        },
        threat: {
          databases: [],
          reportCount: 0,
        },
      },
      factors: [],
      recommendation: 'Scanning in progress...',
      context: source,
      synced: true,
      timestamp: new Date(),
    });

    // Run scan in background (don't wait)
    performScan(initialScan._id.toString(), url, session.user.id).catch(console.error);

    // Return scan ID immediately
    return createSuccessResponse({
      scanId: initialScan.scanId,
      url,
      status: 'processing',
    }, 'Scan initiated successfully');

  } catch (error: any) {
    console.error('Scan initiation error:', error);
    return createErrorResponse('INTERNAL_ERROR', error.message || 'Failed to initiate scan', undefined, 500);
  }
}

/**
 * Perform the actual scan and update database
 */
async function performScan(scanId: string, url: string, userId: string) {
  try {
    // Run scan
    const result = await scanURL(url);

    // Update scan record with results
    await Scan.findByIdAndUpdate(scanId, {
      $set: {
        status: result.orchestration.verdict.isSafe ? 'safe' : 
                result.orchestration.finalScore >= 60 ? 'danger' : 'warning',
        score: result.orchestration.finalScore,
        confidence: result.orchestration.confidence / 100, // Convert to 0-1
        verdict: {
          isSafe: result.orchestration.verdict.isSafe,
          isPhishing: result.orchestration.verdict.isPhishing,
          isMalware: result.orchestration.verdict.isMalware,
          isSpam: false,
          category: result.orchestration.verdict.category,
        },
        analysis: {
          domain: {
            name: new URL(url).hostname,
            reputation: result.orchestration.finalScore < 30 ? 'good' : 
                       result.orchestration.finalScore < 60 ? 'neutral' : 'bad',
          },
          security: {
            hasHttps: url.startsWith('https'),
            hasSsl: url.startsWith('https'),
          },
          ml: {
            cloudScore: result.engines.engine2.score || 0,
            combinedScore: result.orchestration.finalScore,
            model: '2-engine-orchestrated',
          },
          threat: {
            databases: result.orchestration.enginesUsed,
            reportCount: result.engines.engine2.engines?.malicious || 0,
            engineDetails: {
              engine2: result.engines.engine2,
              engine3: result.engines.engine3,
            },
          },
        },
        engines: {
          engine2: result.engines.engine2,
          engine3: result.engines.engine3,
        },
        scoring: {
          enginesUsed: result.orchestration.enginesUsed,
          engineCount: result.orchestration.enginesUsed.length,
          consensus: result.consensus,
        },
        factors: [],
        recommendation: result.orchestration.recommendation,
        processingTime: result.totalProcessingTime,
      },
    });

    console.log(`Scan completed for ${url}: ${result.orchestration.finalScore}/100`);
  } catch (error) {
    console.error('Scan execution error:', error);
    
    // Update scan as failed
    await Scan.findByIdAndUpdate(scanId, {
      $set: {
        status: 'warning',
        recommendation: 'Scan failed to complete. Please try again.',
      },
    });
  }
}
