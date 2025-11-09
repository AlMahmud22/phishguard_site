# GitHub Actions CI/CD Configuration

This directory contains automated workflows for the PhishGuard web dashboard.

## Workflows

### `deploy.yml`
Automated deployment workflow that runs on every push to `main` branch.

**Jobs:**
1. **Quality Check**: Runs ESLint and TypeScript type checking
2. **Build**: Builds the Next.js application
3. **Deploy to Vercel**: Deploys to production (main branch only)
4. **Notify**: Sends deployment status notifications

**Required Secrets:**
Add these in GitHub repository Settings → Secrets and variables → Actions:

- `NEXT_PUBLIC_API_BASE_URL`: Backend API URL (https://phish.equators.site/api)
- `VERCEL_TOKEN`: Vercel authentication token ([get from Vercel](https://vercel.com/account/tokens))
- `VERCEL_ORG_ID`: Vercel organization ID (found in .vercel/project.json)
- `VERCEL_PROJECT_ID`: Vercel project ID (found in .vercel/project.json)

## Setup Instructions

### 1. Get Vercel Credentials
```bash
# Install Vercel CLI
npm install -g vercel

# Login and link project
vercel login
vercel link

# Get your credentials from .vercel/project.json
cat .vercel/project.json
```

### 2. Add Secrets to GitHub
1. Go to repository Settings
2. Navigate to Secrets and variables → Actions
3. Click "New repository secret"
4. Add each required secret

### 3. Enable Workflows
Workflows are automatically enabled when you push the `.github/workflows` directory to GitHub.

## Manual Deployment

To deploy manually without CI/CD:

```bash
# Using Vercel CLI
vercel --prod

# Or using npm
npm run build && npm start
```

## Workflow Triggers

- **Push to `main`**: Full deployment pipeline
- **Pull Request**: Quality checks and build only (no deployment)
- **Manual**: Can be triggered from GitHub Actions tab

## Monitoring

View workflow status:
- GitHub repository → Actions tab
- Individual workflow runs show detailed logs
- Failed jobs send notifications

## Troubleshooting

### Build Failures
- Check environment variables are set correctly
- Verify Node.js version compatibility
- Review build logs in Actions tab

### Deployment Failures
- Verify Vercel tokens are valid
- Check Vercel project configuration
- Ensure domain is correctly configured

### Type Check Errors
- Run `npx tsc --noEmit` locally to debug
- Fix TypeScript errors before pushing
- Ensure all dependencies are installed

## Best Practices

1. **Never commit secrets** to the repository
2. **Test locally** before pushing to main
3. **Use pull requests** for code review before merging
4. **Monitor deployments** in Vercel dashboard
5. **Keep dependencies updated** to avoid security issues

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Documentation](https://vercel.com/docs)
- [Next.js CI/CD Guide](https://nextjs.org/docs/deployment)
