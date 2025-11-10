#!/usr/bin/env node

/**
 * Pre-start script that runs before npm run dev
 * Checks all services and configurations
 */

import { runStartupChecks } from '../lib/startup-check.ts';

console.clear();
const canStart = runStartupChecks();

if (!canStart) {
  console.error('\n💥 Startup checks failed! Please fix the errors above before starting the server.\n');
  process.exit(1);
}

console.log('✅ Pre-flight checks passed! Starting server...\n');
