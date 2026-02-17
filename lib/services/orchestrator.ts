/**
 * Orchestrator: Weighted Voting System
 * Combines results from 2 engines using weighted consensus
 * Engine 2 (VirusTotal): 60% weight - Multi-vendor consensus
 * Engine 3 (URLScan.io): 40% weight - Behavioral analysis
 */

import { Engine2Result } from './engine2';
import { Engine3Result } from './engine3';

export interface OrchestratorResult {
  finalScore: number; // 0-100 weighted score
  confidence: number; // 0-100 confidence level
  verdict: {
    isThreat: boolean;
    isSafe: boolean;
    isPhishing: boolean;
    isMalware: boolean;
    category: 'safe' | 'phishing' | 'malware' | 'suspicious' | 'unknown';
  };
  recommendation: string;
  enginesUsed: string[];
  scoring: {
    engine2Weight: number;
    engine3Weight: number;
    breakdown: {
      engine2: number;
      engine3: number;
    };
  };
}

// Engine weights (only 2 engines)
const WEIGHTS = {
  engine2: 0.6, // 60% - Multi-vendor consensus (primary)
  engine3: 0.4, // 40% - Behavioral analysis
};

/**
 * Calculate weighted final score
 */
function calculateFinalScore(
  engine2: Engine2Result,
  engine3: Engine3Result
): { finalScore: number; breakdown: any; enginesUsed: string[] } {
  const enginesUsed: string[] = [];
  let totalWeight = 0;
  let weightedSum = 0;

  // Engine 2
  if (engine2.available && engine2.score !== undefined) {
    weightedSum += engine2.score * WEIGHTS.engine2;
    totalWeight += WEIGHTS.engine2;
    enginesUsed.push('engine2');
  }

  // Engine 3
  if (engine3.available && engine3.score !== undefined) {
    weightedSum += engine3.score * WEIGHTS.engine3;
    totalWeight += WEIGHTS.engine3;
    enginesUsed.push('engine3');
  }

  // Normalize if not all engines available
  const finalScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  const breakdown = {
    engine2: engine2.available && engine2.score ? engine2.score : 0,
    engine3: engine3.available && engine3.score ? engine3.score : 0,
  };

  return { finalScore, breakdown, enginesUsed };
}

/**
 * Calculate confidence based on engine agreement
 */
function calculateConfidence(
  engine2: Engine2Result,
  engine3: Engine3Result,
  enginesUsed: string[]
): number {
  // Base confidence on number of engines that ran
  let baseConfidence = (enginesUsed.length / 2) * 50;

  // Check agreement between engines
  const scores: number[] = [];
  if (engine2.available && engine2.score !== undefined) scores.push(engine2.score);
  if (engine3.available && engine3.score !== undefined) scores.push(engine3.score);

  if (scores.length >= 2) {
    // Calculate variance
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // Lower variance = higher confidence
    // stdDev of 0-10 = +50 confidence
    // stdDev of 40+ = +0 confidence
    const agreementBonus = Math.max(0, 50 - (stdDev * 1.25));
    baseConfidence += agreementBonus;
  }

  return Math.min(100, Math.round(baseConfidence));
}

/**
 * Determine verdict based on final score and engine results
 */
function determineVerdict(
  finalScore: number,
  engine2: Engine2Result,
  engine3: Engine3Result
): OrchestratorResult['verdict'] {
  // Thresholds
  const SAFE_THRESHOLD = 30;
  const SUSPICIOUS_THRESHOLD = 60;

  let isThreat = finalScore >= SUSPICIOUS_THRESHOLD;
  let isSafe = finalScore < SAFE_THRESHOLD;
  let isPhishing = false;
  let isMalware = false;
  let category: 'safe' | 'phishing' | 'malware' | 'suspicious' | 'unknown' = 'unknown';

  // Determine category based on engines
  if (finalScore < SAFE_THRESHOLD) {
    category = 'safe';
  } else if (finalScore >= SUSPICIOUS_THRESHOLD) {
    // Check for phishing indicators
    const phishingIndicators = [
      engine2.metadata?.categories?.some(c => 
        c.category.toLowerCase().includes('phishing')
      ),
      engine3.verdict?.categories?.includes('phishing'),
      engine3.verdict?.tags?.includes('credential-harvesting'),
    ].filter(Boolean).length;

    // Check for malware indicators
    const malwareIndicators = [
      engine2.metadata?.categories?.some(c => 
        c.category.toLowerCase().includes('malware')
      ),
      engine3.verdict?.categories?.includes('malware'),
    ].filter(Boolean).length;

    if (phishingIndicators > malwareIndicators) {
      category = 'phishing';
      isPhishing = true;
    } else if (malwareIndicators > 0) {
      category = 'malware';
      isMalware = true;
    } else {
      category = 'suspicious';
    }
  } else {
    category = 'suspicious';
  }

  return {
    isThreat,
    isSafe,
    isPhishing,
    isMalware,
    category,
  };
}

/**
 * Generate recommendation based on verdict
 */
function generateRecommendation(
  verdict: OrchestratorResult['verdict'],
  finalScore: number,
  confidence: number
): string {
  if (verdict.isSafe) {
    if (confidence > 80) {
      return '✅ This URL appears to be safe. No significant threats detected.';
    } else {
      return '⚠️ This URL appears relatively safe, but proceed with caution as analysis confidence is moderate.';
    }
  }

  if (verdict.isPhishing) {
    return '🚨 DANGER: Phishing site detected! This website may attempt to steal your credentials or personal information. Do not enter any sensitive data.';
  }

  if (verdict.isMalware) {
    return '🚨 DANGER: Malware detected! This website may contain malicious software that could harm your device. Do not visit this site.';
  }

  if (verdict.category === 'suspicious') {
    if (finalScore >= 70) {
      return '⚠️ HIGH RISK: Multiple suspicious indicators detected. Strongly recommend avoiding this website.';
    } else {
      return '⚠️ CAUTION: Some suspicious characteristics detected. Exercise caution if visiting this site.';
    }
  }

  return 'Unable to determine threat level. Exercise caution.';
}

/**
 * Orchestrate engines and produce final result
 */
export async function orchestrate(
  url: string,
  engine2Result: Engine2Result,
  engine3Result: Engine3Result
): Promise<OrchestratorResult> {
  // Calculate final score
  const { finalScore, breakdown, enginesUsed } = calculateFinalScore(
    engine2Result,
    engine3Result
  );

  // Calculate confidence
  const confidence = calculateConfidence(
    engine2Result,
    engine3Result,
    enginesUsed
  );

  // Determine verdict
  const verdict = determineVerdict(
    finalScore,
    engine2Result,
    engine3Result
  );

  // Generate recommendation
  const recommendation = generateRecommendation(verdict, finalScore, confidence);

  return {
    finalScore,
    confidence,
    verdict,
    recommendation,
    enginesUsed,
    scoring: {
      engine2Weight: WEIGHTS.engine2,
      engine3Weight: WEIGHTS.engine3,
      breakdown,
    },
  };
}

/**
 * Calculate consensus score (how much engines agree)
 */
export function calculateConsensus(
  engine2: Engine2Result,
  engine3: Engine3Result
): number {
  const scores: number[] = [];
  
  if (engine2.available && engine2.score !== undefined) scores.push(engine2.score);
  if (engine3.available && engine3.score !== undefined) scores.push(engine3.score);

  if (scores.length < 2) return 0;

  // Calculate standard deviation
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // Convert stdDev to consensus score (lower stdDev = higher consensus)
  // stdDev of 0 = 100% consensus
  // stdDev of 50 = 0% consensus
  const consensus = Math.max(0, 100 - (stdDev * 2));

  return Math.round(consensus);
}
