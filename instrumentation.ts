/**
 * Next.js Instrumentation Hook
 * This file is automatically called when the Next.js server starts
 * Used to run startup health checks and initialize services
 */

export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { runStartupChecks, testMongoDBConnection } = await import('./lib/startup-check');
    
    // Run configuration checks
    const canStart = runStartupChecks();
    
    // Test MongoDB connection if configured
    if (canStart) {
      await testMongoDBConnection();
    }
    
    // Verify email configuration
    const { verifyEmailConfiguration } = await import('./lib/email');
    await verifyEmailConfiguration();
    
    // Initialize cron jobs in production
    if (process.env.NODE_ENV === 'production') {
      const { initCronJobs } = await import('./lib/cronJobs');
      initCronJobs();
    }
    
    // Start health monitoring
    const { startHealthMonitoring } = await import('./lib/healthMonitor');
    startHealthMonitoring(5); // Check every 5 minutes
    
    console.log('🌐 Starting Next.js development server...\n');
  }
}
