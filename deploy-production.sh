#!/bin/bash
# =============================================================
# PhishGuard Production Deploy Script
# Droplet: tanysplace-1vcpu-2gb-70gb-intel-sgp1-01
# Path:    /var/www/html/mahmud/phishguard_web
# Port:    3005
# =============================================================
set -euo pipefail

APP_DIR="/var/www/html/mahmud/phishguard_web"
APP_NAME="phishguard"
PORT=3005
BRANCH="main"

# ── Colours ──────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; NC='\033[0m'

log()  { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"; }
ok()   { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✓${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠${NC} $1"; }
fail() { echo -e "${RED}[$(date '+%H:%M:%S')] ✗ ERROR:${NC} $1"; exit 1; }

# ── Guards ───────────────────────────────────────────────────
[ "$(id -u)" -eq 0 ] || fail "Run as root (sudo ./deploy-production.sh)"
[ -d "$APP_DIR" ]    || fail "App directory not found: $APP_DIR"
[ -f "$APP_DIR/.env" ] || fail ".env file missing — copy .env.example and fill in values"

command -v node >/dev/null 2>&1 || fail "node not found"
command -v npm  >/dev/null 2>&1 || fail "npm not found"
command -v pm2  >/dev/null 2>&1 || fail "pm2 not found — run: npm install -g pm2"

log "Starting PhishGuard production deployment..."
cd "$APP_DIR"

# ── 1. Sync with GitHub ───────────────────────────────────────
log "Fetching latest code from GitHub ($BRANCH)..."
git fetch origin "$BRANCH"

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$BRANCH")

if [ "$LOCAL" = "$REMOTE" ]; then
  warn "Already up to date with origin/$BRANCH ($(git rev-parse --short HEAD))"
  warn "Re-deploying current code..."
else
  log "Updating: $(git rev-parse --short HEAD) → $(git rev-parse --short origin/$BRANCH)"
  git reset --hard "origin/$BRANCH"
  ok "Code updated to $(git rev-parse --short HEAD)"
fi

# ── 2. Check Node version ─────────────────────────────────────
NODE_VER=$(node -v | cut -d'.' -f1 | tr -d 'v')
[ "$NODE_VER" -ge 18 ] || fail "Node.js 18+ required, found $(node -v)"
ok "Node $(node -v), npm $(npm -v)"

# ── 3. Install dependencies ───────────────────────────────────
log "Installing dependencies..."
npm install --legacy-peer-deps --omit=dev 2>&1 | tail -5
ok "Dependencies installed"

# ── 4. Run security audit ─────────────────────────────────────
log "Running security audit..."
AUDIT=$(npm audit --omit=dev 2>&1 || true)
CRITICAL=$(echo "$AUDIT" | grep -c "critical" || true)
HIGH=$(echo "$AUDIT" | grep -c "high" || true)
if [ "$CRITICAL" -gt 0 ]; then
  warn "Audit: $CRITICAL critical issue(s) found — check 'npm audit' after deploy"
else
  ok "Audit: no critical vulnerabilities"
fi

# ── 5. Validate .env ──────────────────────────────────────────
log "Validating required environment variables..."
REQUIRED_VARS=(NEXTAUTH_SECRET NEXTAUTH_URL MONGODB_URI JWT_SECRET)
MISSING=0
for VAR in "${REQUIRED_VARS[@]}"; do
  if ! grep -q "^${VAR}=" .env 2>/dev/null; then
    warn "Missing required env var: $VAR"
    MISSING=$((MISSING + 1))
  fi
done
[ "$MISSING" -eq 0 ] && ok "All required env vars present" || fail "$MISSING required env var(s) missing in .env"

# ── 6. Build ──────────────────────────────────────────────────
log "Building Next.js production bundle..."
rm -rf .next
NODE_ENV=production npm run build
ok "Build complete"

# ── 7. PM2 start / restart ───────────────────────────────────
log "Managing PM2 process..."
mkdir -p /var/log/phishguard

if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  pm2 reload "$APP_NAME" --update-env
  ok "PM2 process '$APP_NAME' reloaded (zero-downtime)"
else
  pm2 start pm2.config.js --env production
  ok "PM2 process '$APP_NAME' started on port $PORT"
fi

# ── 8. Save PM2 state ─────────────────────────────────────────
pm2 save
ok "PM2 state saved (survives reboots)"

# ── 9. Health check ───────────────────────────────────────────
log "Waiting for app to come up..."
sleep 5
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "307" ] || [ "$HTTP_STATUS" = "308" ]; then
  ok "Health check passed (HTTP $HTTP_STATUS)"
else
  warn "Health check returned HTTP $HTTP_STATUS — app may still be starting"
  warn "Check logs: pm2 logs $APP_NAME --lines 50"
fi

# ── Done ──────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Deployment complete${NC}"
echo -e "${GREEN}  Commit : $(git rev-parse --short HEAD)${NC}"
echo -e "${GREEN}  Port   : $PORT${NC}"
echo -e "${GREEN}============================================${NC}"
pm2 list
