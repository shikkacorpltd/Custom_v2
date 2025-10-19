# Netlify Deployment Setup Instructions

## 🚀 Quick Start - Deploy to Netlify in 5 Minutes

### Step 1: Connect Your GitHub Repository

1. Go to **https://app.netlify.com**
2. Click **"Add new site"** → **"Import an existing project"**
3. Select **GitHub** as your git provider
4. Authorize Netlify to access your GitHub account
5. Select the repository: **`shikkacorpltd/Custom_v2`**
6. Click **"Deploy site"**

### Step 2: Configure Build Settings (Auto-Detected)

Netlify will automatically detect your configuration from `netlify.toml`:

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: `18`

✅ No manual configuration needed - it's all in `netlify.toml`!

### Step 3: Add Environment Variables

Navigate to **Site Settings** → **Environment Variables** and add:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
NODE_VERSION=18
```

**To find your Supabase credentials:**
1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy **Project URL** and **Anon Key**

### Step 4: Trigger Deployment

1. Netlify will automatically deploy when you push to `main` branch
2. OR manually trigger: Go to **Site Settings** → **Deploys** → **Trigger deploy**

---

## 📋 Configuration Files Included

### `netlify.toml` - Main Configuration
```toml
[build]
  command = "npm run build"
  publish = "dist"
  
[build.environment]
  NODE_VERSION = "18"
```

**Includes:**
- ✅ Build settings
- ✅ SPA redirect rules (for client-side routing)
- ✅ Security headers (CSP, HSTS, etc.)
- ✅ Cache control strategies
- ✅ API redirect rules

### `public/_redirects` - Fallback Redirect
```
/*  /index.html  200
```
Ensures all routes fall back to `index.html` for React Router.

### `public/favicon.png` - Tab Icon
SchoolXnow logo displays in browser tabs.

---

## 🔐 Security Features Enabled

### Automatic Security Headers:
- **X-Frame-Options**: DENY (prevents clickjacking)
- **X-Content-Type-Options**: nosniff (prevents MIME sniffing)
- **X-XSS-Protection**: 1; mode=block
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Permissions-Policy**: Disables camera, microphone, geolocation

### Cache Strategy:
- **Static assets** (`/assets/*`): 1 year cache (immutable)
- **Fonts** (`/*.woff2`): 1 year cache (immutable)
- **HTML** (`/index.html`): No cache (always fresh)

---

## 🌐 Your Live Site

Once deployed, your site will be available at:
```
https://your-site-name.netlify.app
```

**To set a custom domain:**
1. Go to **Site Settings** → **Domain management**
2. Click **Add custom domain**
3. Enter your domain (e.g., `schoolxnow.com`)
4. Follow DNS configuration steps

---

## 🧪 Before Deploying - Checklist

- [ ] Build succeeds locally: `npm run build`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] All changes pushed to GitHub
- [ ] Environment variables set in Netlify
- [ ] `.env` file NOT committed (use `.gitignore`)
- [ ] `dist/` folder NOT committed (auto-generated)

---

## 🔄 Automatic Deployments

Netlify will automatically deploy on:

| Event | Action |
|-------|--------|
| **Push to main** | Production deployment |
| **Pull request** | Deploy preview |
| **Any branch push** | Branch preview |

**To disable auto-deploys:**
Site Settings → Build & deploy → Continuous deployment → Disable

---

## 📊 Build Status & Logs

### View Deployment Status:
1. Go to https://app.netlify.com
2. Select your site
3. Click **Deploys** tab

### Troubleshoot Failed Builds:
1. Click on the failed deployment
2. View **Deploy log** for error details
3. Fix issues locally and push again

### Common Errors:

| Error | Solution |
|-------|----------|
| "Module not found: '@/...'" | Check `vite.config.ts` path aliases |
| "Build failed exit code 1" | Check `npm run build` locally |
| "Port already in use" | Netlify uses port 8080, this is normal |
| "Blank page after deploy" | Check browser console for errors |

---

## 🚨 Important Notes

### Environment Variables
- **Frontend**: Must be prefixed with `VITE_` (e.g., `VITE_SUPABASE_URL`)
- **Build-time only**: Set in Netlify environment variables
- **Never commit**: Use `.gitignore` for `.env` files

### Function Timeout
- Default: 10 seconds
- Max: 26 seconds
- Adjust in: Site Settings → Functions

### Build Performance
- First build: ~2-3 minutes
- Subsequent builds: ~1-2 minutes
- Check **Deploys** → **Deploy log** for timing

---

## 🎯 Next Steps

### Step 1: Deploy to Netlify
Follow the **Quick Start** section above.

### Step 2: Verify Deployment
1. Visit your live site URL
2. Test login functionality
3. Check browser console for errors
4. Verify Supabase connection

### Step 3: Monitor & Maintain
- Check Netlify Analytics
- Monitor build times
- Watch for deployment failures
- Keep dependencies updated

---

## 📞 Support & Resources

| Resource | Link |
|----------|------|
| **Netlify Docs** | https://docs.netlify.com |
| **Vite Deployment** | https://vitejs.dev/guide/static-deploy.html#netlify |
| **Supabase Netlify Guide** | https://supabase.com/docs/guides/hosting/netlify |
| **React Deployment** | https://react.dev/learn/start-a-new-react-project |

---

## ✅ Deployment Success Indicators

✅ Site loads without errors  
✅ SchoolXnow logo shows in browser tab  
✅ Login page displays correctly  
✅ Supabase connection works  
✅ All pages load and routes work  
✅ Mobile responsive design works  
✅ No console errors in DevTools  

---

## 🎉 Congratulations!

Your SchoolXnow Essential v2 system is now live on Netlify! 

**Share your live site:**
```
https://your-site-name.netlify.app
```

---

**Last Updated**: October 19, 2025  
**Project**: SchoolXnow Essential v2  
**Platform**: Netlify + Vite + React + TypeScript  
**Deployment**: Automated via GitHub push
