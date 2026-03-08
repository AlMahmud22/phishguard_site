
#!/bin/bash
set -e

echo "🚀 Deploying PhishGuard..."
cd /var/www/html/mahmud/phishguard

npm install
npm run build
pm2 restart phishguard || pm2 start npm --name "phishguard" -- start -- -p 3001

echo "✅ PhishGuard deployed on port 3001"