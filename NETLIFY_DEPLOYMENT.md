# Netlify Deployment Guide for SchoolXnow Essential v2

## 🚀 Quick Deploy

### Option 1: Deploy via Netlify Dashboard (Recommended)

1. **Sign in to Netlify**: https://app.netlify.com
2. **Click "Add new site"** → "Import an existing project"
3. **Connect to GitHub**: Select `shikkacorpltd/Custom_v2`
4. **Configure build settings**:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18`
5. **Add environment variables** (Settings → Environment variables):
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   NODE_VERSION=18
   ```
6. **Click "Deploy site"**

### Option 2: Deploy via Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize Netlify site (from project root)
cd "d:\MyPersonal Project\SchoolXnow\Custom_v2"
netlify init

# Deploy manually
netlify deploy --prod
```

---

## 📋 Configuration Files Created

### 1. `netlify.toml`
Main Netlify configuration file with:
- Build settings (command, publish directory)
- Redirects for SPA routing
- Security headers
- Cache control
- Environment variables

### 2. `public/_redirects`
Fallback redirect rule for client-side routing

### 3. `.nvmrc`
Specifies Node.js version 18 for builds

---

## 🔧 Build Configuration

### Build Command
```bash
npm run build
```
This runs:
1. TypeScript type checking: `tsc --noEmit`
2. Vite build: `vite build`

### Output Directory
```
dist/
```
Vite builds the production-ready app to this folder.

---

## 🌐 Environment Variables

Add these in Netlify Dashboard → Site Settings → Environment Variables:

### Required Variables
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Optional Variables
```env
NODE_VERSION=18
NPM_FLAGS=--legacy-peer-deps
CI=false
```

**Important**: Don't include sensitive keys like `SUPABASE_SERVICE_ROLE_KEY` in frontend environment variables!

---

## 🔍 Common Issues & Solutions

### Issue 1: "Build failed - command not found"
**Solution**: Ensure `package.json` has the correct build script:
```json
"scripts": {
  "build": "tsc --noEmit && vite build"
}
```

### Issue 2: "404 on page refresh"
**Solution**: Already fixed with `netlify.toml` and `_redirects` files. They ensure all routes redirect to `index.html` for SPA routing.

### Issue 3: "Environment variables not working"
**Solution**: 
- Prefix all frontend env vars with `VITE_`
- Add them in Netlify Dashboard
- Redeploy after adding variables

### Issue 4: "Build succeeds but site is blank"
**Solution**:
- Check browser console for errors
- Verify Supabase URL and keys are correct
- Check if `dist` folder contains `index.html` and `assets/`

### Issue 5: "TypeScript errors during build"
**Solution**:
- Run `npm run type-check` locally first
- Fix any TypeScript errors
- Commit and push changes

### Issue 6: "Module not found errors"
**Solution**:
```bash
# Clear node_modules and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 🔐 Security Headers

The following security headers are automatically applied:

- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-XSS-Protection**: Enables XSS filter
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features

---

## 📦 Cache Strategy

### Static Assets (`/assets/*`)
- **Cache Duration**: 1 year (31536000 seconds)
- **Strategy**: Immutable (never revalidate)
- Includes: JS, CSS, images, fonts in assets folder

### Fonts (`/*.woff2`)
- **Cache Duration**: 1 year
- **Strategy**: Immutable

### HTML Files (`/index.html`)
- **Cache Duration**: None (always fresh)
- **Strategy**: No-cache, must-revalidate

---

## 🔄 CI/CD Workflow

Netlify automatically deploys on:
- **Push to main branch** → Production deployment
- **Pull requests** → Deploy preview
- **Branch pushes** → Branch previews

### Manual Deploy
```bash
# Deploy to production
netlify deploy --prod

# Deploy preview
netlify deploy
```

---

## 🧪 Testing Before Deploy

### Local Build Test
```bash
# Build locally
npm run build

# Preview production build
npm run preview
```

### Test Checklist
- [ ] Build completes without errors
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Environment variables are set
- [ ] All routes work correctly
- [ ] Authentication works
- [ ] Supabase connection works
- [ ] Mobile responsive design works

---

## 📊 Build Status Badge

Add this to your README.md:
```markdown
[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR-SITE-ID/deploy-status)](https://app.netlify.com/sites/YOUR-SITE-NAME/deploys)
```

Replace `YOUR-SITE-ID` and `YOUR-SITE-NAME` with your actual values from Netlify.

---

## 🆘 Getting Help

### Netlify Build Logs
1. Go to Netlify Dashboard
2. Click on your site
3. Go to "Deploys" tab
4. Click on the failed deploy
5. Check "Deploy log" for errors

### Common Log Messages

**"Command failed with exit code 1"**
- TypeScript compilation error
- Missing dependencies
- Build script error

**"Build script returned non-zero exit code: 2"**
- Out of memory during build
- Solution: Increase build time limit in Netlify settings

**"Module not found: Can't resolve '@/...'"**
- Path alias issue
- Check `vite.config.ts` and `tsconfig.json`

---

## 📞 Support Resources

- **Netlify Docs**: https://docs.netlify.com
- **Vite Deployment**: https://vitejs.dev/guide/static-deploy.html#netlify
- **Supabase + Netlify**: https://supabase.com/docs/guides/hosting/netlify

---

## ✅ Deployment Checklist

Before deploying, ensure:

- [ ] `netlify.toml` exists in project root
- [ ] `public/_redirects` exists
- [ ] `.nvmrc` specifies Node 18
- [ ] Environment variables are set in Netlify
- [ ] `.gitignore` includes `dist/`, `node_modules/`, `.env`
- [ ] All changes committed and pushed to GitHub
- [ ] Build succeeds locally (`npm run build`)
- [ ] No TypeScript errors (`npm run type-check`)

---

## 🎉 Success!

Once deployed, your site will be available at:
```
https://your-site-name.netlify.app
```

You can also add a custom domain in Netlify settings.

---

## 🔄 Post-Deployment

### Update README with Live URL
```markdown
## 🌐 Live Demo
https://your-site-name.netlify.app
```

### Monitor Performance
- Check Netlify Analytics
- Monitor build times
- Watch for build failures

### Set Up Notifications
- Email notifications for failed deploys
- Slack integration (optional)
- Discord webhooks (optional)

---

**Last Updated**: October 15, 2025
**Deployment Platform**: Netlify
**Build Tool**: Vite 5.x
**Framework**: React 18 + TypeScript
