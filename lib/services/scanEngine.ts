/**
 * Main Scan Engine
 * Coordinates two detection engines and orchestration
 * Engine 2 (VirusTotal): Multi-vendor consensus - 60%
 * Engine 3 (URLScan.io): Behavioral analysis - 40%
 */

import * as Engine2 from './engine2';
import * as Engine3 from './engine3';
import { orchestrate, calculateConsensus } from './orchestrator';
import type { Engine2Result } from './engine2';
import type { Engine3Result } from './engine3';
import type { OrchestratorResult } from './orchestrator';

export interface ScanProgress {
  engine2: 'pending' | 'running' | 'completed' | 'failed';
  engine3: 'pending' | 'running' | 'completed' | 'failed';
  overallProgress: number;
}

export interface CompleteScanResult {
  url: string;
  engines: {
    engine2: Engine2Result;
    engine3: Engine3Result;
  };
  orchestration: OrchestratorResult;
  consensus: number;
  totalProcessingTime: number;
  timestamp: Date;
}

/**
 * Validate URL format
 */
export function validateURL(url: string): { valid: boolean; error?: string } {
  try {
    const parsedUrl = new URL(url);
    
    // Check protocol
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }
    
    // Check for valid hostname
    if (!parsedUrl.hostname || parsedUrl.hostname.length < 3) {
      return { valid: false, error: 'Invalid hostname' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Run both engines in parallel with progress tracking
 */
export async function scanURL(
  url: string,
  onProgress?: (progress: ScanProgress) => void
): Promise<CompleteScanResult> {
  const startTime = Date.now();
  
  // Validate URL
  const validation = validateURL(url);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Initialize progress
  const progress: ScanProgress = {
    engine2: 'pending',
    engine3: 'pending',
    overallProgress: 0,
  };

  if (onProgress) onProgress(progress);

  // Run both engines in parallel
  const engines = await Promise.allSettled([
    // Engine 2 - Multi-vendor consensus (VirusTotal)
    (async () => {
      progress.engine2 = 'running';
      progress.overallProgress = 10;
      if (onProgress) onProgress({ ...progress });
      
      const result = await Engine2.analyzeURL(url);
      
      progress.engine2 = result.available ? 'completed' : 'failed';
      progress.overallProgress = 50;
      if (onProgress) onProgress({ ...progress });
      
      return result;
    })(),
    
    // Engine 3 - Behavioral analysis (URLScan.io)
    (async () => {
      progress.engine3 = 'running';
      if (onProgress) onProgress({ ...progress });
      
      const result = await Engine3.analyzeURL(url);
      
      progress.engine3 = result.available ? 'completed' : 'failed';
      progress.overallProgress = 90;
      if (onProgress) onProgress({ ...progress });
      
      return result;
    })(),
  ]);

  // Extract results      
  const engine2Result: Engine2Result = 
    engines[0].status === 'fulfilled' 
      ? engines[0].value 
      : { available: false, processingTime: 0 };
      
  const engine3Result: Engine3Result = 
    engines[1].status === 'fulfilled' 
      ? engines[1].value 
      : { available: false, processingTime: 0 };

  // Run orchestration
  const orchestration = await orchestrate(
    url,
    engine2Result,
    engine3Result
  );

  // Calculate consensus
  const consensus = calculateConsensus(engine2Result, engine3Result);

  // Final progress
  progress.overallProgress = 100;
  if (onProgress) onProgress({ ...progress });

  const totalProcessingTime = Date.now() - startTime;

  return {
    url,
    engines: {
      engine2: engine2Result,
      engine3: engine3Result,
    },
    orchestration,
    consensus,
    totalProcessingTime,
    timestamp: new Date(),
  };
}

/**
 * Get engine health status
 */
export async function getEngineStatus() {
  return {
    engine2: {
      status: process.env.ENGINE_2_API_KEY ? 'operational' : 'disabled',
      description: 'Multi-Vendor Consensus (VirusTotal)',
      weight: '60%',
      rateLimit: Engine2.getRateLimitStatus(),
    },
    engine3: {
      status: process.env.ENGINE_3_API_KEY ? 'operational' : 'disabled',
      description: 'Behavioral Analysis (URLScan.io)',
      weight: '40%',
      rateLimit: Engine3.getRateLimitStatus(),
    },
  };
}

/**
 * Batch scan multiple URLs
 */
export async function batchScan(
  urls: string[],
  onProgress?: (urlIndex: number, progress: ScanProgress) => void
): Promise<CompleteScanResult[]> {
  const results: CompleteScanResult[] = [];
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    
    try {
      const result = await scanURL(url, (progress) => {
        if (onProgress) {
          onProgress(i, progress);
        }
      });
      
      results.push(result);
      
      // Add delay between scans to respect rate limits
      if (i < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error: any) {
      console.error(`Failed to scan ${url}:`, error.message);
      // Continue with next URL
    }
  }
  
  return results;
}
