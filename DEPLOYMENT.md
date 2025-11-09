# PhishGuard Web Dashboard - Deployment Guide

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)
Vercel is the recommended platform for deploying Next.js applications with zero configuration.

#### Steps:
1. **Install Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   ```

2. **Connect Repository**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Connect your GitHub repository: `AlMahmud22/phish.equators.tech`

3. **Configure Environment Variables**:
   Add these in Vercel dashboard under Settings → Environment Variables:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://phish.equators.site/api
   NEXT_PUBLIC_APP_NAME=PhishGuard
   NODE_ENV=production
   ```

4. **Deploy**:
   - Vercel will auto-deploy on every push to `main` branch
   - Manual deploy: `vercel --prod`

#### Custom Domain Setup:
1. In Vercel dashboard, go to Settings → Domains
2. Add custom domain: `phish.equators.tech`
3. Configure DNS records as instructed by Vercel

---

### Option 2: Self-Hosting (Node.js)
Host on your own server with Node.js runtime.

#### Prerequisites:
- Node.js 18+ installed
- PM2 or similar process manager
- Nginx as reverse proxy (optional)

#### Build and Deploy:
```bash
# 1. Clone repository
git clone https://github.com/AlMahmud22/phish.equators.tech.git
cd phish.equators.tech

# 2. Install dependencies
npm install

# 3. Create .env.local file
cp .env.example .env.local
# Edit .env.local with your values

# 4. Build for production
npm run build

# 5. Start production server
npm run start
# Server runs on http://localhost:3000 by default
```

#### Using PM2 for Process Management:
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "phishguard-web" -- start

# Save PM2 configuration
pm2 save

# Setup auto-restart on server reboot
pm2 startup
```

#### Nginx Configuration (Optional):
```nginx
server {
    listen 80;
    server_name phish.equators.tech;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

### Option 3: Docker Deployment

#### Dockerfile:
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

#### Build and Run:
```bash
# Build Docker image
docker build -t phishguard-web .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=https://phish.equators.site/api \
  -e NEXT_PUBLIC_APP_NAME=PhishGuard \
  phishguard-web
```

---

## 📋 Pre-Deployment Checklist

- [ ] Environment variables configured correctly
- [ ] API backend is running and accessible at `https://phish.equators.site/api`
- [ ] Database connections tested
- [ ] SSL certificate installed for HTTPS
- [ ] Domain DNS configured correctly
- [ ] Build process completes without errors
- [ ] All tests passing (if applicable)
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Analytics configured (Google Analytics, etc.)

## 🔧 Build Commands

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

## 🌐 Environment Variables

Required variables for production:
```bash
NEXT_PUBLIC_API_BASE_URL=https://phish.equators.site/api
NEXT_PUBLIC_APP_NAME=PhishGuard
NODE_ENV=production
```

Optional variables:
```bash
# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Feature Flags
MAINTENANCE_MODE=false
```

## 📊 Performance Monitoring

After deployment, monitor:
- **Response times** via Vercel Analytics or custom monitoring
- **Error rates** via error tracking service
- **Lighthouse scores** should be ≥90
- **Core Web Vitals**: LCP, FID, CLS

## 🔄 Continuous Deployment

With Vercel, every push to `main` branch automatically triggers a new deployment. For other platforms, set up CI/CD using GitHub Actions (see `.github/workflows/deploy.yml`).

## 🆘 Troubleshooting

### Build Failures
- Check Node.js version (must be 18+)
- Verify all dependencies are installed
- Check for TypeScript errors: `npm run lint`

### Runtime Errors
- Verify environment variables are set
- Check API backend connectivity
- Review browser console for errors
- Check server logs for details

### Performance Issues
- Enable caching in reverse proxy
- Optimize images and assets
- Use CDN for static assets
- Monitor bundle size with `@next/bundle-analyzer`

---

## 📞 Support

For deployment issues:
- Check [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- Review project documentation in `/docs`
- Contact: support@phish.equators.tech
