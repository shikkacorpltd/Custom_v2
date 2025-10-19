# 🌐 Connect www.schoolxnow.com to Cloudflare Pages

## Step-by-Step Guide

### **Method 1: Via Cloudflare Dashboard (EASIEST)**

The Cloudflare Pages dashboard should now be open in your browser.

#### **Step 1: Find Your Project**
1. You should see your project: **`schoolxnow`**
2. Click on it

#### **Step 2: Go to Custom Domains**
1. Click the **"Custom domains"** tab at the top
2. Click **"Set up a custom domain"** button

#### **Step 3: Add www.schoolxnow.com**
1. In the domain field, enter: `www.schoolxnow.com`
2. Click **"Continue"**
3. Cloudflare will automatically:
   - ✅ Create DNS records
   - ✅ Configure SSL/TLS
   - ✅ Set up redirects
4. Click **"Activate domain"**

#### **Step 4: Add Root Domain (Optional)**
1. Click **"Set up a custom domain"** again
2. Enter: `schoolxnow.com` (without www)
3. Click **"Continue"**
4. Click **"Activate domain"**

**Done!** Your domain is now connected! 🎉

---

### **Method 2: Via Wrangler CLI**

If you prefer using the command line:

```bash
# Add www subdomain
wrangler pages project domain add schoolxnow www.schoolxnow.com

# Also add root domain
wrangler pages project domain add schoolxnow schoolxnow.com
```

---

## ✅ What Cloudflare Does Automatically

When you add a custom domain, Cloudflare automatically:

1. ✅ **Creates DNS Records** (CNAME to your Pages project)
2. ✅ **Provisions SSL Certificate** (Free HTTPS)
3. ✅ **Configures CDN** (Global distribution)
4. ✅ **Sets up www redirect** (www → non-www or vice versa)

**No manual DNS configuration needed!** 🎯

---

## 🔍 Verify Domain Setup

### **Check DNS Records:**

1. In Cloudflare Dashboard
2. Go to: Your domain → **DNS** → **Records**
3. You should see:
   ```
   Type: CNAME
   Name: www
   Target: schoolxnow.pages.dev
   Proxy: Enabled (Orange cloud)
   ```

### **Check via CLI:**

```bash
# List domains for your project
wrangler pages project domain list schoolxnow
```

---

## 🌐 Domain Options

You can set up:

### **Option 1: www.schoolxnow.com (with www)**
- Primary domain: `www.schoolxnow.com`
- Redirects: `schoolxnow.com` → `www.schoolxnow.com`

### **Option 2: schoolxnow.com (without www)**
- Primary domain: `schoolxnow.com`
- Redirects: `www.schoolxnow.com` → `schoolxnow.com`

### **Option 3: Both (Recommended)**
- Both domains work
- Choose which one is primary
- Other redirects to primary

---

## ⚙️ Configure Redirect (Optional)

To set which domain is primary:

1. In Cloudflare Pages → Your project
2. Go to **Settings** → **Custom domains**
3. Click on the domain you want as primary
4. Enable **"Redirect www to apex"** or **"Redirect apex to www"**

---

## 🔐 SSL/TLS Configuration

Cloudflare automatically provisions SSL. To verify:

1. In Cloudflare Dashboard
2. Go to: Your domain → **SSL/TLS**
3. Ensure mode is set to: **"Full (strict)"** ✅
4. Check **Edge Certificates** → SSL certificate should be "Active"

---

## 📝 Update Supabase Redirect URLs

After domain is active, update Supabase:

1. Go to: https://supabase.com/dashboard
2. Select your project: `ktknzhypndszujoakaxq`
3. **Authentication** → **URL Configuration**
4. Update to:

**Site URL:**
```
https://www.schoolxnow.com
```

**Redirect URLs (add all):**
```
https://www.schoolxnow.com/auth
https://www.schoolxnow.com
https://schoolxnow.com/auth
https://schoolxnow.com
https://schoolxnow.pages.dev/auth
https://schoolxnow.pages.dev
```

5. Click **"Save"**

---

## ⏱️ Propagation Time

- **DNS Propagation:** 1-5 minutes (Cloudflare is fast!)
- **SSL Certificate:** Instant (Cloudflare automatic)
- **Global CDN:** Immediate

**Usually live within 2-3 minutes!** ⚡

---

## 🧪 Test Your Domain

After adding the domain:

```bash
# Test if domain resolves
nslookup www.schoolxnow.com

# Test HTTPS
curl -I https://www.schoolxnow.com

# Open in browser
start https://www.schoolxnow.com
```

---

## 🔧 Troubleshooting

### **Domain Not Working?**

1. **Check DNS Records:**
   - Cloudflare Dashboard → Domain → DNS
   - Verify CNAME record exists for `www`

2. **Check SSL Status:**
   - SSL/TLS tab → Edge Certificates
   - Should show "Active"

3. **Clear Browser Cache:**
   - Press `Ctrl + F5` to hard refresh

4. **Wait a Few Minutes:**
   - DNS can take 1-5 minutes to propagate

### **Still See Cloudflare Default Page?**

- Go to Pages project → Deployments
- Make sure latest deployment is "Active"
- Redeploy if needed:
  ```bash
  wrangler pages deploy dist --project-name schoolxnow
  ```

---

## ✅ Final Checklist

After connecting domain:

- [ ] Domain added in Cloudflare Pages
- [ ] DNS records created automatically
- [ ] SSL certificate active
- [ ] Can access: https://www.schoolxnow.com
- [ ] Can access: https://schoolxnow.com
- [ ] Supabase redirect URLs updated
- [ ] Login works on custom domain

---

## 🎉 Success!

Once your domain is connected:

✅ **Your site:** https://www.schoolxnow.com  
✅ **Also works:** https://schoolxnow.com  
✅ **Backup URL:** https://schoolxnow.pages.dev  
✅ **HTTPS:** Automatic SSL  
✅ **CDN:** Global Cloudflare network  

**Your SchoolXNow application is now live on your custom domain!** 🚀

---

## 📞 Quick Commands

```bash
# View project domains
wrangler pages project domain list schoolxnow

# Add domain
wrangler pages project domain add schoolxnow www.schoolxnow.com

# Remove domain (if needed)
wrangler pages project domain remove schoolxnow www.schoolxnow.com

# View project info
wrangler pages project view schoolxnow

# Open project in browser
start https://dash.cloudflare.com
```

---

**Go to the Cloudflare Pages dashboard now (should be open in browser) and add your domain!** 🎯
