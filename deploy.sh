#!/bin/bash
set -e

echo "🚀 Deploy started..."

cd /var/www/html/mahmud/phishguard_web

echo "🔄 Resetting to latest version..."
git fetch origin main
git reset --hard origin/main
chmod +x deploy.sh

echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🧹 Cleaning up lock files..."
rm -f .next/lock

echo "🏗️ Building app..."
npm run build

echo "🔁 Restarting app..."
pm2 restart phishguard || pm2 start npm --name "phishguard" -- start

echo "✅ Deploy finished!"
