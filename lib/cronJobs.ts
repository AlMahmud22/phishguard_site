/**
 * Cron Jobs for Scheduled Tasks
 * Handles weekly reports, cleanup tasks, and other scheduled operations
 */

import cron from 'node-cron';
import dbConnect from './db';
import User from './models/User';
import Scan from './models/Scan';
import { sendWeeklyReport } from './email';

/**
 * Generate weekly report data for a user
 */
async function generateWeeklyReportData(userId: string) {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const scans = await Scan.find({
    userId,
    timestamp: { $gte: oneWeekAgo }
  }).sort({ timestamp: -1 });
  
  const totalScans = scans.length;
  const safeCount = scans.filter(s => s.status === 'safe').length;
  const warningCount = scans.filter(s => s.status === 'warning').length;
  const dangerCount = scans.filter(s => s.status === 'danger').length;
  
  const avgScore = totalScans > 0 
    ? Math.round(scans.reduce((sum, s) => sum + s.score, 0) / totalScans)
    : 0;
  
  // Get top 5 most dangerous URLs
  const topDangerousUrls = scans
    .filter(s => s.status === 'danger')
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => ({
      url: s.url,
      score: s.score,
      timestamp: s.timestamp,
      verdict: s.verdict
    }));
  
  // Calculate scanning trends (day-by-day)
  const dailyScans = new Map<string, number>();
  scans.forEach(scan => {
    const day = scan.timestamp.toISOString().split('T')[0];
    dailyScans.set(day, (dailyScans.get(day) || 0) + 1);
  });
  
  const scanTrend = Array.from(dailyScans.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
  
  return {
    totalScans,
    safeCount,
    warningCount,
    dangerCount,
    avgScore,
    topDangerousUrls,
    scanTrend,
    weekStart: oneWeekAgo.toISOString(),
    weekEnd: new Date().toISOString()
  };
}

/**
 * Send weekly reports to all eligible users
 */
export async function sendWeeklyReports() {
  try {
    console.log('[CRON] Starting weekly report generation...');
    await dbConnect();
    
    // Find all users who have weekly reports enabled and email verified
    const users = await User.find({
      'settings.notifications.weeklyReport': true,
      emailVerified: true
    });
    
    console.log(`[CRON] Found ${users.length} users eligible for weekly reports`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const user of users) {
      try {
        // Generate report data
        const reportData = await generateWeeklyReportData(String(user._id));
        
        // Skip if user had no activity this week
        if (reportData.totalScans === 0) {
          console.log(`[CRON] Skipping user ${user.email} - no scans this week`);
          continue;
        }
        
        // Send email
        await sendWeeklyReport(user.email, user.name, reportData);
        successCount++;
        console.log(`[CRON] Sent weekly report to ${user.email}`);
        
        // Add small delay to avoid overwhelming email server
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        failCount++;
        console.error(`[CRON] Failed to send weekly report to ${user.email}:`, error);
      }
    }
    
    console.log(`[CRON] Weekly reports completed: ${successCount} sent, ${failCount} failed`);
  } catch (error) {
    console.error('[CRON] Weekly reports job failed:', error);
  }
}

/**
 * Initialize all cron jobs
 */
export function initCronJobs() {
  // Weekly reports - Every Sunday at 9:00 AM
  cron.schedule('0 9 * * 0', () => {
    console.log('[CRON] Triggering weekly reports job...');
    sendWeeklyReports();
  }, {
    timezone: 'UTC'
  });
  
  // Daily cleanup - Every day at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('[CRON] Running daily cleanup tasks...');
    try {
      await dbConnect();
      
      // Clean up expired verification tokens (older than 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = await User.updateMany(
        { verificationTokenExpires: { $lt: oneDayAgo } },
        { $unset: { verificationToken: '', verificationTokenExpires: '' } }
      );
      
      console.log(`[CRON] Cleaned up ${result.modifiedCount} expired verification tokens`);
      
      // Clean up expired password reset tokens
      const resetResult = await User.updateMany(
        { resetPasswordExpires: { $lt: oneDayAgo } },
        { $unset: { resetPasswordToken: '', resetPasswordExpires: '' } }
      );
      
      console.log(`[CRON] Cleaned up ${resetResult.modifiedCount} expired password reset tokens`);
    } catch (error) {
      console.error('[CRON] Daily cleanup failed:', error);
    }
  }, {
    timezone: 'UTC'
  });
  
  console.log('[CRON] All cron jobs initialized successfully');
  console.log('[CRON] - Weekly reports: Every Sunday at 9:00 AM UTC');
  console.log('[CRON] - Daily cleanup: Every day at 2:00 AM UTC');
}

/**
 * Manually trigger weekly reports (for testing)
 */
export async function triggerWeeklyReportsManually() {
  console.log('[MANUAL] Manually triggering weekly reports...');
  await sendWeeklyReports();
}
