# 🔧 Remove Domain from Old Netlify Site

## Problem
The domain `schoolxnow.com` is already connected to another Netlify site, and you need to remove it so you can use it with your new deployment.

---

## ✅ Step-by-Step Solution

### **Step 1: Find All Your Netlify Sites**

The Netlify dashboard should now be open in your browser. If not, go to:
**https://app.netlify.com**

You should see a list of all your sites.

---

### **Step 2: Identify Which Site Has the Domain**

Look through your sites and check each one:

1. **Look at the site names** - any old `schoolxnow` sites?
2. **Common old site names:**
   - `schoolxnow`
   - `schoolxnow-old`
   - `schoolxnow-v1`
   - `schoolxnow-essential`
   - Or any random name like `wonderful-site-123456`

**For EACH site:**
- Click on the site name
- Look at the top - does it show `schoolxnow.com` as the domain?
- If yes, that's the one!

---

### **Step 3: Remove Domain from Old Site**

Once you find the site with `schoolxnow.com`:

1. **Click on the site** to open it
2. **Click "Domain settings"** (in the top navigation)
3. **Find "Custom domains" section**
4. You should see:
   ```
   schoolxnow.com
   www.schoolxnow.com
   ```
5. **For each domain:**
   - Click the **"Options"** button (three dots `⋯`)
   - Select **"Remove domain"**
   - Confirm the removal
6. **Repeat** for both `schoolxnow.com` and `www.schoolxnow.com`

---

### **Step 4: Add Domain to New Site**

After removing from the old site:

1. **Go back to Sites** (click "Sites" at the top)
2. **Find your NEW site** (the one you just deployed)
   - Look for the most recent one
   - Should have a recent "Last published" date
3. **Click on it**
4. **Click "Domain settings"**
5. **Click "Add custom domain"**
6. **Enter:** `schoolxnow.com`
7. **Click "Verify"**
8. **Click "Yes, add domain"**

---

### **Step 5: Add www Subdomain**

1. Still in Domain settings
2. Click **"Add domain alias"**
3. Enter: `www.schoolxnow.com`
4. Click **"Save"**

---

## 🎯 Alternative: Use CLI Commands

If you prefer using the terminal:

### **1. List all sites:**
```bash
netlify sites:list
```

### **2. Switch to old site (copy the Site ID from the list):**
```bash
netlify switch
# Select the old site when prompted
```

### **3. Remove domain from old site:**
```bash
netlify domains:remove schoolxnow.com
netlify domains:remove www.schoolxnow.com
```

### **4. Switch back to new site:**
```bash
netlify switch
# Select your current site
```

### **5. Add domain to new site:**
```bash
netlify domains:add schoolxnow.com
netlify domains:add www.schoolxnow.com
```

---

## 🔍 Can't Find the Old Site?

If you can't find which site has the domain:

### **Option 1: Check All Sites Manually**

In the Netlify dashboard:
1. Click on **each site** one by one
2. Look at the URL shown at the top
3. Check **Domain settings** for each

### **Option 2: Look for Old Deployments**

Common patterns:
- Sites with old dates
- Sites with similar names to "schoolxnow"
- Sites you're not actively using

### **Option 3: Delete Unused Sites**

If you find old/unused sites:
1. Click on the site
2. Go to **Site settings** → **General**
3. Scroll to bottom: **"Delete this site"**
4. Type the site name to confirm
5. Delete it

This will automatically free up any domains!

---

## ⚠️ Important Notes

1. **Don't delete your new site!** Only delete old/unused ones
2. **Check the "Last published" date** to identify the new vs old site
3. **Your new site** should have been published today (October 15, 2025)
4. **Removing a domain** doesn't delete the site, just disconnects the domain

---

## 🎯 What Your New Site Should Look Like

Your **new site** (the one you want to keep) should have:
- ✅ Recent publish date (today)
- ✅ Environment variables set (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- ✅ Connected to GitHub repo: `Custom_v2`
- ✅ Build command: `npm run build`
- ✅ Publish directory: `dist`

---

## ✅ After Removing Domain

Once you remove the domain from the old site and add it to the new one:

1. **Configure Cloudflare DNS** (if you own the domain there)
2. **Wait for DNS propagation** (5-60 minutes)
3. **Enable HTTPS** in Netlify
4. **Update Supabase redirect URLs**
5. **Test:** https://schoolxnow.com

---

## 🆘 Still Having Issues?

If you still can't find or remove the domain:

**Contact Netlify Support:**
1. Go to: https://www.netlify.com/support/
2. Submit a request
3. Say: "I need help removing schoolxnow.com from an old site so I can use it on my new site"
4. They'll help you within 24 hours

---

## 📞 Quick Commands Reference

```bash
# List all sites
netlify sites:list

# Switch to a different site
netlify switch

# Remove domain
netlify domains:remove schoolxnow.com

# Add domain
netlify domains:add schoolxnow.com

# Open dashboard
netlify open

# Check current site status
netlify status
```

---

**Start with the Netlify dashboard (should be open now) and look through your sites to find the one with `schoolxnow.com`!**
