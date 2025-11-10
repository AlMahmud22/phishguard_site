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
    
    console.log('🌐 Starting Next.js development server...\n');
  }
}
