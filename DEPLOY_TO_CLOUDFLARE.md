# 🚀 Deploy to Cloudflare Pages

Since you own `schoolxnow.com` on Cloudflare, deploying to Cloudflare Pages is the best option!

## ✅ Benefits of Cloudflare Pages

- ✅ **No domain conflicts** - Your domain is already in Cloudflare
- ✅ **Free tier** - Unlimited sites, bandwidth
- ✅ **Faster** - Cloudflare's global CDN
- ✅ **Easy setup** - One command deployment
- ✅ **Auto SSL** - Automatic HTTPS
- ✅ **Better integration** - Domain already there!

---

## 🎯 Quick Deployment Steps

### **Step 1: Login to Cloudflare**

```bash
wrangler login
```

This will open your browser to authenticate with Cloudflare.

---

### **Step 2: Build Your Project**

```bash
npm run build
```

This creates the `dist` folder with your production files.

---

### **Step 3: Deploy to Cloudflare Pages**

```bash
wrangler pages deploy dist --project-name schoolxnow
```

This will:
- Create a new Cloudflare Pages project called "schoolxnow"
- Upload your built files
- Give you a live URL like: `schoolxnow.pages.dev`

---

### **Step 4: Add Environment Variables**

After first deployment, add your Supabase credentials:

```bash
# Set production environment variables
wrangler pages secret put VITE_SUPABASE_URL
# When prompted, paste: https://ktknzhypndszujoakaxq.supabase.co

wrangler pages secret put VITE_SUPABASE_ANON_KEY
# When prompted, paste your anon key
```

**Or** add them in Cloudflare Dashboard:
1. Go to: https://dash.cloudflare.com
2. Click **"Workers & Pages"** → Your project
3. Click **"Settings"** → **"Environment variables"**
4. Add:
   - `VITE_SUPABASE_URL` = `https://ktknzhypndszujoakaxq.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = your anon key

---

### **Step 5: Connect Your Custom Domain**

In Cloudflare Dashboard:
1. Go to your project: **Workers & Pages** → `schoolxnow`
2. Click **"Custom domains"** tab
3. Click **"Set up a custom domain"**
4. Enter: `schoolxnow.com`
5. Click **"Continue"**
6. Cloudflare will automatically configure DNS!
7. Also add: `www.schoolxnow.com`

**Done!** Your domain is now connected - no DNS configuration needed!

---

### **Step 6: Set Up GitHub Integration (Optional)**

For automatic deployments on every push:

1. In Cloudflare Dashboard → Your project
2. Click **"Settings"** → **"Builds & deployments"**
3. Click **"Connect to Git"**
4. Select **GitHub** → Authorize
5. Select repository: `Custom_v2`
6. Configure:
   - **Production branch:** `main`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
7. Save

Now every `git push` will auto-deploy! 🎉

---

## 🔧 Alternative: Deploy via Dashboard

If you prefer using the web interface:

1. **Go to:** https://dash.cloudflare.com
2. Click **"Workers & Pages"**
3. Click **"Create application"**
4. Select **"Pages"** tab
5. Click **"Connect to Git"**
6. Select your GitHub repository: `Custom_v2`
7. Configure build settings:
   ```
   Build command: npm run build
   Build output directory: dist
   Root directory: (leave empty)
   ```
8. Click **"Environment variables (advanced)"**
9. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
10. Click **"Save and Deploy"**

---

## 📋 Quick Commands Reference

```bash
# Login to Cloudflare
wrangler login

# Build project
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name schoolxnow

# Add environment variables
wrangler pages secret put VITE_SUPABASE_URL
wrangler pages secret put VITE_SUPABASE_ANON_KEY

# View deployments
wrangler pages deployment list --project-name schoolxnow

# Open project in browser
wrangler pages project view schoolxnow
```

---

## 🎯 After Deployment

### **Update Supabase URLs**

1. Go to: https://supabase.com/dashboard
2. Select your project
3. **Authentication** → **URL Configuration**
4. Update:
   - **Site URL:** `https://schoolxnow.com`
   - **Redirect URLs:**
     ```
     https://schoolxnow.com/auth
     https://schoolxnow.com
     https://www.schoolxnow.com/auth
     https://www.schoolxnow.com
     https://schoolxnow.pages.dev/auth
     https://schoolxnow.pages.dev
     ```

---

## 🆚 Cloudflare Pages vs Netlify

| Feature | Cloudflare Pages | Netlify |
|---------|------------------|---------|
| Free tier | Unlimited | 100GB/month |
| Build minutes | 500/month | 300/month |
| Domain integration | Native (you own domain) | Manual DNS |
| CDN | Cloudflare (fastest) | Netlify CDN |
| Setup | Easier for your case | More complex |
| **Recommended for you** | ✅ YES | ❌ No (domain conflict) |

---

## ✅ Why Cloudflare Pages is Better for You

1. ✅ **No domain conflict** - Fresh start
2. ✅ **Domain already there** - No DNS configuration needed
3. ✅ **Faster deployment** - Direct integration
4. ✅ **Better for Cloudflare domains** - Native support
5. ✅ **Same features** - All the functionality you need

---

## 🚀 Ready to Deploy?

Run these commands in order:

```bash
# 1. Make sure Wrangler is installed
wrangler --version

# 2. Login to Cloudflare
wrangler login

# 3. Build your project
npm run build

# 4. Deploy!
wrangler pages deploy dist --project-name schoolxnow
```

Then add environment variables and connect your domain!

---

**Much simpler than fighting with Netlify domain conflicts!** 🎉
