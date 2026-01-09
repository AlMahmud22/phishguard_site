/**
 * Health Monitoring System
 * Tracks service health, error rates, and sends alerts to admins
 */

import dbConnect from './db';
import User from './models/User';
import { sendEmail } from './email';

interface HealthMetrics {
  mongodb: { status: 'healthy' | 'unhealthy'; message: string };
  errorRate: { rate: number; threshold: number; status: 'healthy' | 'warning' | 'critical' };
  lastCheck: Date;
}

interface ErrorLog {
  timestamp: Date;
  error: string;
  endpoint?: string;
}

// In-memory error tracking
const errorLog: ErrorLog[] = [];
const MAX_ERROR_LOG_SIZE = 1000;
const ERROR_RATE_WINDOW = 15 * 60 * 1000; // 15 minutes
const ERROR_RATE_WARNING_THRESHOLD = 10; // 10 errors per 15 min
const ERROR_RATE_CRITICAL_THRESHOLD = 50; // 50 errors per 15 min

let lastHealthCheck: Date = new Date();
let lastAlertSent: Date = new Date(0); // Initialize to epoch
const ALERT_COOLDOWN = 30 * 60 * 1000; // 30 minutes between alerts

/**
 * Log an error for monitoring
 */
export function logError(error: string, endpoint?: string) {
  errorLog.push({
    timestamp: new Date(),
    error,
    endpoint
  });
  
  // Keep error log size manageable
  if (errorLog.length > MAX_ERROR_LOG_SIZE) {
    errorLog.splice(0, errorLog.length - MAX_ERROR_LOG_SIZE);
  }
}

/**
 * Calculate current error rate
 */
function getErrorRate(): number {
  const now = Date.now();
  const recentErrors = errorLog.filter(
    log => (now - log.timestamp.getTime()) < ERROR_RATE_WINDOW
  );
  return recentErrors.length;
}

/**
 * Check MongoDB health
 */
async function checkMongoDBHealth(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
  try {
    const mongoose = await dbConnect();
    
    // Test actual database operation
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    await db.admin().ping();
    
    return {
      status: 'healthy',
      message: 'MongoDB connection is healthy'
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      message: `MongoDB connection failed: ${error.message}`
    };
  }
}

/**
 * Perform comprehensive health check
 */
export async function performHealthCheck(): Promise<HealthMetrics> {
  lastHealthCheck = new Date();
  
  // Check MongoDB
  const mongodbHealth = await checkMongoDBHealth();
  
  // Check error rate
  const currentErrorRate = getErrorRate();
  let errorStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
  
  if (currentErrorRate >= ERROR_RATE_CRITICAL_THRESHOLD) {
    errorStatus = 'critical';
  } else if (currentErrorRate >= ERROR_RATE_WARNING_THRESHOLD) {
    errorStatus = 'warning';
  }
  
  const metrics: HealthMetrics = {
    mongodb: mongodbHealth,
    errorRate: {
      rate: currentErrorRate,
      threshold: ERROR_RATE_WARNING_THRESHOLD,
      status: errorStatus
    },
    lastCheck: lastHealthCheck
  };
  
  // Send alerts if needed
  if (mongodbHealth.status === 'unhealthy' || errorStatus === 'critical') {
    await sendHealthAlert(metrics);
  }
  
  return metrics;
}

/**
 * Send health alert to admins
 */
async function sendHealthAlert(metrics: HealthMetrics) {
  // Check cooldown to avoid spam
  const now = Date.now();
  if (now - lastAlertSent.getTime() < ALERT_COOLDOWN) {
    console.log('[HEALTH] Alert cooldown active, skipping notification');
    return;
  }
  
  try {
    // Get all admin users
    const admins = await User.find({ role: 'admin', emailVerified: true });
    
    if (admins.length === 0) {
      console.warn('[HEALTH] No verified admin users found to send alerts');
      return;
    }
    
    // Prepare alert details
    const issues: string[] = [];
    
    if (metrics.mongodb.status === 'unhealthy') {
      issues.push(`❌ MongoDB: ${metrics.mongodb.message}`);
    }
    
    if (metrics.errorRate.status === 'critical') {
      issues.push(`🔥 Error Rate: ${metrics.errorRate.rate} errors in last 15 minutes (Critical threshold: ${ERROR_RATE_CRITICAL_THRESHOLD})`);
    } else if (metrics.errorRate.status === 'warning') {
      issues.push(`⚠️ Error Rate: ${metrics.errorRate.rate} errors in last 15 minutes (Warning threshold: ${ERROR_RATE_WARNING_THRESHOLD})`);
    }
    
    // Get recent error samples
    const recentErrors = errorLog.slice(-10).reverse();
    const errorSamples = recentErrors.map(log => 
      `• ${log.timestamp.toISOString()} - ${log.endpoint || 'Unknown'}: ${log.error.substring(0, 100)}`
    ).join('\n');
    
    // Send email to each admin
    for (const admin of admins) {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .alert-box { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
            .metrics { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .error-log { background: #1f2937; color: #e5e7eb; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 11px; overflow-x: auto; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 PhishGuard Health Alert</h1>
              <p style="margin:0;">Critical System Issues Detected</p>
            </div>
            <div class="content">
              <h2>Hi ${admin.name},</h2>
              <p>The PhishGuard monitoring system has detected critical issues that require immediate attention.</p>
              
              <div class="alert-box">
                <strong>⚠️ Issues Detected:</strong><br><br>
                ${issues.join('<br>')}
              </div>

              <div class="metrics">
                <h3>System Metrics</h3>
                <strong>MongoDB Status:</strong> ${metrics.mongodb.status === 'healthy' ? '✅ Healthy' : '❌ Unhealthy'}<br>
                <strong>Error Rate:</strong> ${metrics.errorRate.rate} errors in last 15 minutes<br>
                <strong>Error Status:</strong> ${metrics.errorRate.status.toUpperCase()}<br>
                <strong>Check Time:</strong> ${metrics.lastCheck.toISOString()}<br>
              </div>

              <h3>Recent Errors (Last 10):</h3>
              <div class="error-log">
${errorSamples || 'No recent errors'}
              </div>

              <div style="background:#dbeafe;padding:15px;border-radius:6px;margin:20px 0;">
                <strong>Recommended Actions:</strong><br>
                1. Check server logs for detailed error information<br>
                2. Verify MongoDB connection and credentials<br>
                3. Check API rate limits and external service status<br>
                4. Monitor system resources (CPU, memory, disk)<br>
                5. Review recent deployments or configuration changes
              </div>

              <p><strong>This alert will not be sent again for 30 minutes to prevent spam.</strong></p>
            </div>
            <div class="footer">
              <p>PhishGuard Automated Health Monitoring</p>
              <p>© ${new Date().getFullYear()} PhishGuard. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      const sent = await sendEmail({
        to: admin.email,
        subject: '🚨 [URGENT] PhishGuard Health Alert - Action Required',
        html
      });
      
      if (sent) {
        console.log(`[HEALTH] Alert sent to admin: ${admin.email}`);
      }
    }
    
    lastAlertSent = new Date();
  } catch (error) {
    console.error('[HEALTH] Failed to send health alert:', error);
  }
}

/**
 * Start periodic health monitoring
 */
export function startHealthMonitoring(intervalMinutes: number = 5) {
  console.log(`[HEALTH] Starting health monitoring (check every ${intervalMinutes} minutes)`);
  
  // Perform initial check
  performHealthCheck();
  
  // Schedule periodic checks
  setInterval(() => {
    console.log('[HEALTH] Running scheduled health check...');
    performHealthCheck();
  }, intervalMinutes * 60 * 1000);
}

/**
 * Get current health status (for API endpoint)
 */
export function getCurrentHealthStatus(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: {
    errorRate: number;
    lastCheck: string;
  };
} {
  const errorRate = getErrorRate();
  
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (errorRate >= ERROR_RATE_CRITICAL_THRESHOLD) {
    status = 'unhealthy';
  } else if (errorRate >= ERROR_RATE_WARNING_THRESHOLD) {
    status = 'degraded';
  }
  
  return {
    status,
    metrics: {
      errorRate,
      lastCheck: lastHealthCheck.toISOString()
    }
  };
}
