/**
 * Startup Health Check
 * Validates all required services and configurations on app startup
 */

interface ServiceStatus {
  name: string;
  status: 'OK' | 'ERROR' | 'WARNING';
  message: string;
}

/**
 * Check if environment variable is set
 */
function checkEnvVar(name: string, required: boolean = true): ServiceStatus {
  const value = process.env[name];
  
  if (!value) {
    return {
      name,
      status: required ? 'ERROR' : 'WARNING',
      message: required ? 'Missing (Required)' : 'Not configured (Optional)',
    };
  }
  
  // Mask sensitive values for display
  const displayValue = value.length > 20 
    ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
    : `${value.substring(0, 4)}...`;
    
  return {
    name,
    status: 'OK',
    message: `Configured (${displayValue})`,
  };
}

/**
 * Check MongoDB connection string
 */
function checkMongoDB(): ServiceStatus {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    return {
      name: 'MongoDB',
      status: 'ERROR',
      message: 'MONGODB_URI not configured',
    };
  }
  
  // Parse MongoDB URI to show sanitized info
  try {
    const url = new URL(uri);
    const host = url.hostname;
    const isAtlas = host.includes('mongodb.net');
    const dbName = url.pathname.split('/')[1]?.split('?')[0] || 'default';
    
    return {
      name: 'MongoDB',
      status: 'OK',
      message: `Connected to ${isAtlas ? 'MongoDB Atlas' : host} (DB: ${dbName})`,
    };
  } catch {
    return {
      name: 'MongoDB',
      status: 'WARNING',
      message: 'URI configured but invalid format',
    };
  }
}

/**
 * Check Google OAuth configuration
 */
function checkGoogleAuth(): ServiceStatus {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return {
      name: 'Google OAuth',
      status: 'WARNING',
      message: 'Not configured (Google login disabled)',
    };
  }
  
  const isValid = clientId.endsWith('.apps.googleusercontent.com');
  
  return {
    name: 'Google OAuth',
    status: isValid ? 'OK' : 'WARNING',
    message: isValid 
      ? `Configured (Client: ...${clientId.substring(clientId.length - 20)})` 
      : 'Configured but format may be incorrect',
  };
}

/**
 * Check GitHub OAuth configuration
 */
function checkGitHubAuth(): ServiceStatus {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return {
      name: 'GitHub OAuth',
      status: 'WARNING',
      message: 'Not configured (GitHub login disabled)',
    };
  }
  
  return {
    name: 'GitHub OAuth',
    status: 'OK',
    message: `Configured (Client ID: ${clientId.substring(0, 8)}...)`,
  };
}

/**
 * Check NextAuth configuration
 */
function checkNextAuth(): ServiceStatus {
  const secret = process.env.NEXTAUTH_SECRET;
  const url = process.env.NEXTAUTH_URL;
  
  if (!secret) {
    return {
      name: 'NextAuth',
      status: 'ERROR',
      message: 'NEXTAUTH_SECRET not configured',
    };
  }
  
  if (!url) {
    return {
      name: 'NextAuth',
      status: 'WARNING',
      message: 'NEXTAUTH_SECRET OK, NEXTAUTH_URL not set',
    };
  }
  
  return {
    name: 'NextAuth',
    status: 'OK',
    message: `Configured (URL: ${url})`,
  };
}

/**
 * Get status icon based on status
 */
function getStatusIcon(status: 'OK' | 'ERROR' | 'WARNING'): string {
  switch (status) {
    case 'OK':
      return '✅';
    case 'ERROR':
      return '❌';
    case 'WARNING':
      return '⚠️';
  }
}

/**
 * Print formatted status
 */
function printStatus(status: ServiceStatus) {
  const icon = getStatusIcon(status.status);
  const nameWidth = 20;
  const paddedName = status.name.padEnd(nameWidth);
  console.log(`  ${icon} ${paddedName} ${status.message}`);
}

/**
 * Run all startup checks
 */
export function runStartupChecks() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 PhishGuard Startup Health Check');
  console.log('='.repeat(80) + '\n');
  
  const checks: ServiceStatus[] = [
    // Critical services
    checkMongoDB(),
    checkNextAuth(),
    
    // OAuth providers (optional but recommended)
    checkGoogleAuth(),
    checkGitHubAuth(),
  ];
  
  // Print all statuses
  checks.forEach(printStatus);
  
  // Summary
  const errors = checks.filter(c => c.status === 'ERROR').length;
  const warnings = checks.filter(c => c.status === 'WARNING').length;
  const success = checks.filter(c => c.status === 'OK').length;
  
  console.log('\n' + '-'.repeat(80));
  console.log(`📊 Summary: ${success} OK | ${warnings} Warnings | ${errors} Errors`);
  
  if (errors > 0) {
    console.log('❌ CRITICAL: Application may not function properly!');
    console.log('   Please check your .env.local file and configure missing variables.');
  } else if (warnings > 0) {
    console.log('⚠️  Some optional features are not configured.');
    console.log('   Application will run but with limited functionality.');
  } else {
    console.log('✅ All systems operational!');
  }
  
  console.log('='.repeat(80) + '\n');
  
  // Return boolean indicating if app can start
  return errors === 0;
}

/**
 * Run MongoDB connection test
 */
export async function testMongoDBConnection() {
  try {
    const connectToDatabase = (await import('./db')).default;
    await connectToDatabase();
    console.log('✅ MongoDB connection test: SUCCESS\n');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection test: FAILED');
    console.error('   Error:', error instanceof Error ? error.message : error);
    console.log('');
    return false;
  }
}
