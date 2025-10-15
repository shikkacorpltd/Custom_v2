# 🔧 Fix Netlify Blank Page Issue

## ❌ Problem: Blank Page After Deploying to Netlify

This is a common issue with several possible causes. Let's fix it step by step.

---

## 🎯 Most Common Cause: Missing Environment Variables

### **Step 1: Add Environment Variables in Netlify**

⚠️ **This is usually the main issue!**

1. Go to your Netlify dashboard: https://app.netlify.com
2. Select your site: `schoolxnow-v2` (or your site name)
3. Go to: **Site settings → Environment variables**
4. Click **"Add a variable"** or **"Add environment variables"**

**Add these TWO variables:**

| Key | Value | Where to Find |
|-----|-------|---------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Supabase Dashboard → Settings → API → Project API keys → `anon` `public` |

**Example:**
```
VITE_SUPABASE_URL=https://xyzabc123.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJz...
```

5. After adding both variables, click **"Save"**
6. **Trigger a new deploy:**
   - Go to **Deploys** tab
   - Click **"Trigger deploy"** → **"Clear cache and deploy site"**

---

## 🔍 Other Common Issues

### **Issue 2: Build Failed**

Check the deploy logs:
1. Go to Netlify dashboard → Your site
2. Click on **"Deploys"** tab
3. Click on the latest deploy
4. Scroll down to see **"Deploy log"**

**Look for errors like:**
- ❌ `Module not found`
- ❌ `Command failed`
- ❌ `TypeScript errors`

**Solution:**
```bash
# Test build locally first
npm run build

# If it works locally, the issue is environment variables
```

---

### **Issue 3: Wrong Build Settings**

Verify your build settings in Netlify:

1. Go to: **Site settings → Build & deploy → Build settings**

**Should be:**
```
Base directory: (leave empty)
Build command: npm run build
Publish directory: dist
```

If different, click **"Edit settings"** and fix them.

---

### **Issue 4: Browser Console Errors**

1. Open your Netlify site URL
2. Press **F12** (open Developer Tools)
3. Go to **Console** tab
4. Look for red error messages

**Common errors:**

#### **Error: "Failed to fetch"**
→ Environment variables missing (see Step 1)

#### **Error: "Supabase client not initialized"**
→ Environment variables missing or incorrect

#### **Error: "Invalid API key"**
→ Check your `VITE_SUPABASE_ANON_KEY` is correct

#### **Error: "404 on refresh"**
→ Check `_redirects` file exists in `public/` folder
```
/*    /index.html   200
```

---

### **Issue 5: Supabase URL Configuration**

Update allowed URLs in Supabase:

1. Go to Supabase Dashboard
2. Navigate to: **Authentication → URL Configuration**
3. Add your Netlify URL to **Site URL** and **Redirect URLs**:

```
Site URL:
https://your-site-name.netlify.app

Redirect URLs:
https://your-site-name.netlify.app/auth
https://your-site-name.netlify.app
```

4. Click **"Save"**

---

## 🛠️ Step-by-Step Fix Process

### **1. Local Build Test**
```bash
# Make sure it builds locally
npm run build

# Test the production build
npm run preview
```

If it works locally, the issue is in Netlify configuration.

### **2. Check Environment Variables**
```bash
# In Netlify CLI, check current env vars
netlify env:list
```

Add missing variables:
```bash
netlify env:set VITE_SUPABASE_URL "https://your-project.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your-anon-key-here"
```

### **3. Redeploy**
```bash
# Clear cache and deploy
netlify deploy --prod --build
```

---

## 🔍 Debug Checklist

Run through this checklist:

- [ ] Environment variables added in Netlify dashboard
- [ ] `VITE_SUPABASE_URL` is correct (starts with `https://`)
- [ ] `VITE_SUPABASE_ANON_KEY` is the anon key (not service_role key)
- [ ] Build command is `npm run build`
- [ ] Publish directory is `dist`
- [ ] `_redirects` file exists in `public/` folder
- [ ] Supabase redirect URLs include your Netlify URL
- [ ] Clear cache and redeploy after adding env vars

---

## 🚀 Quick Fix Command

Run this to check and redeploy:

```bash
# 1. Build locally to verify it works
npm run build

# 2. Check if dist folder was created
ls dist

# 3. Preview locally
npm run preview

# 4. If it works, deploy to Netlify
netlify deploy --prod

# 5. Check the deploy URL and test
```

---

## 📱 Test Your Site

After fixing, test these:

1. ✅ Site loads (not blank)
2. ✅ Can see login page at `/auth`
3. ✅ Can log in successfully
4. ✅ Dashboard loads after login
5. ✅ No errors in browser console (F12)

---

## 🆘 Still Blank?

### **Get Deploy Logs:**
```bash
netlify watch
```

### **Check Site Status:**
```bash
netlify status
netlify open:site
```

### **View Environment Variables:**
```bash
netlify env:list
```

### **Manual Deploy with Build:**
```bash
# This will build and deploy in one step
netlify deploy --prod --build
```

---

## ✅ Expected Result

After fixing, you should see:
- ✅ SchoolXNow logo and branding
- ✅ Login page at root URL
- ✅ Working authentication
- ✅ Dashboard after login

---

## 🔐 Security Note

**Never commit these to git:**
- `.env` file
- `VITE_SUPABASE_ANON_KEY`
- Any passwords or secrets

**Always add them through:**
- Netlify dashboard (Environment variables)
- Netlify CLI (`netlify env:set`)

---

## 📞 Need More Help?

1. **Check Netlify deploy logs** - Most informative
2. **Check browser console** - Shows runtime errors
3. **Test locally first** - If it works locally, it's a config issue
4. **Verify environment variables** - 90% of blank page issues

---

**Most likely fix:** Add the two environment variables in Netlify dashboard and redeploy! 🎯
