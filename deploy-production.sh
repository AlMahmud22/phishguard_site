#!/bin/bash

# Production Deployment Script for PhishGuard
# Usage: ./deploy-production.sh

set -e  # Exit on any error

echo "🚀 Starting PhishGuard deployment..."

# Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run build
echo "🔨 Building Next.js application..."
npm run build

# Restart PM2 application
echo "🔄 Restarting PM2 application..."
pm2 restart phishguard

# Show PM2 status
echo "✅ Deployment complete! Current PM2 status:"
pm2 status

echo ""
echo "🎉 PhishGuard has been successfully deployed!"
