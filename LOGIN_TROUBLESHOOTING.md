# 🔧 Login Troubleshooting Guide

## ❌ "Email and Password are Correct but Can't Login"

This guide will help you fix login issues in the SchoolXNow system.

---

## 🎯 Quick Diagnostic Tool

**Visit:** http://localhost:8080/login-diagnostic

This tool will:
- ✅ Test your credentials
- ✅ Check your user profile
- ✅ Verify your role assignment
- ✅ Identify specific issues
- ✅ Provide SQL fixes

---

## 🔍 Common Issues & Solutions

### Issue 1: User Profile Not Created
**Symptom:** Login succeeds but nothing happens, or page redirects back to login.

**Check:**
```sql
SELECT * FROM user_profiles WHERE user_id = 'YOUR_USER_ID';
```

**Fix:**
```sql
INSERT INTO user_profiles (
  user_id,
  full_name,
  approval_status,
  is_active
) VALUES (
  'YOUR_USER_ID',
  'Your Name',
  'approved',
  true
);
```

---

### Issue 2: User Not Approved
**Symptom:** Login works but dashboard shows "pending approval" or redirects.

**Check:**
```sql
SELECT approval_status, is_active 
FROM user_profiles 
WHERE user_id = 'YOUR_USER_ID';
```

**Fix:**
```sql
UPDATE user_profiles
SET 
  approval_status = 'approved',
  is_active = true
WHERE user_id = 'YOUR_USER_ID';
```

---

### Issue 3: No Role Assigned
**Symptom:** Login succeeds but system doesn't know your permissions.

**Check:**
```sql
SELECT * FROM user_roles WHERE user_id = 'YOUR_USER_ID';
```

**Fix:**
```sql
INSERT INTO user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'teacher')  -- or 'school_admin' or 'super_admin'
ON CONFLICT (user_id) DO UPDATE SET role = 'teacher';
```

---

### Issue 4: User Inactive
**Symptom:** "Account inactive" error or blank screen after login.

**Check:**
```sql
SELECT is_active FROM user_profiles WHERE user_id = 'YOUR_USER_ID';
```

**Fix:**
```sql
UPDATE user_profiles
SET is_active = true
WHERE user_id = 'YOUR_USER_ID';
```

---

### Issue 5: No School Assignment (Teachers/Admins)
**Symptom:** Can login but can't access school data or features.

**Check:**
```sql
SELECT school_id FROM user_profiles WHERE user_id = 'YOUR_USER_ID';
```

**Fix:**
```sql
-- First, find a school
SELECT id, name FROM schools LIMIT 5;

-- Then assign
UPDATE user_profiles
SET school_id = 'SCHOOL_UUID'
WHERE user_id = 'YOUR_USER_ID';
```

---

## 🛠️ Step-by-Step Manual Fix

### Step 1: Find Your User ID
1. Go to Supabase Dashboard → Authentication → Users
2. Find your email and copy the UUID
3. OR run this SQL:
```sql
SELECT id, email FROM auth.users WHERE email = 'your@email.com';
```

### Step 2: Run the Diagnostic
Visit: http://localhost:8080/login-diagnostic
- Enter your email and password
- Click "Run Diagnostic"
- Note any issues found

### Step 3: Apply Fixes in Supabase
1. Open Supabase Dashboard → SQL Editor
2. Use the provided SQL commands from the diagnostic
3. OR use the comprehensive fix script: `fix-user-login.sql`

### Step 4: Verify and Test
```sql
-- Run this to see complete user status
SELECT 
  au.email,
  au.email_confirmed_at,
  up.full_name,
  up.approval_status,
  up.is_active,
  ur.role,
  s.name as school_name
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
LEFT JOIN user_roles ur ON au.id = ur.user_id
LEFT JOIN schools s ON up.school_id = s.id
WHERE au.email = 'your@email.com';
```

Expected results:
- ✅ `approval_status` = 'approved'
- ✅ `is_active` = true
- ✅ `role` = 'teacher' (or 'school_admin' or 'super_admin')
- ✅ `school_name` = (a school name, unless you're super_admin)

### Step 5: Try Logging In Again
1. Clear browser cache (Ctrl+Shift+Delete)
2. Go to http://localhost:8080/auth
3. Enter your credentials
4. You should now be able to access the dashboard

---

## 📋 Complete Fix Script

Use the file: **`fix-user-login.sql`**

1. Open the file in your editor
2. Replace all instances of:
   - `YOUR_USER_ID_HERE` with your actual user UUID
   - `Your Full Name` with your actual name
   - `your-email@example.com` with your email
3. Run in Supabase SQL Editor

---

## 🔐 For Super Admin Issues

If you're trying to create a super admin:

### Use Bootstrap Page
Visit: http://localhost:8080/bootstrap

This creates a properly configured super admin account.

### Manual Super Admin Creation
```sql
-- After creating user through Supabase Auth
INSERT INTO user_profiles (
  user_id,
  full_name,
  approval_status,
  is_active,
  school_id
) VALUES (
  'USER_UUID',
  'Super Admin Name',
  'approved',
  true,
  NULL
);

INSERT INTO user_roles (user_id, role)
VALUES ('USER_UUID', 'super_admin');
```

---

## 🚨 Still Having Issues?

### Check Browser Console
1. Press F12 to open Developer Tools
2. Go to Console tab
3. Look for errors when clicking "Sign In"
4. Common errors:
   - "Invalid login credentials" → Wrong email/password
   - "User not found" → Profile missing
   - Network errors → Supabase connection issue

### Check Network Tab
1. Press F12 → Network tab
2. Try logging in
3. Look for failed requests
4. Check response for error messages

### Verify Supabase Connection
Visit: http://localhost:8080/supabase-test

This tests:
- ✅ Database connection
- ✅ Authentication service
- ✅ Table access
- ✅ RLS policies

---

## 📞 Need More Help?

1. **Use Login Diagnostic:** http://localhost:8080/login-diagnostic
2. **Check Supabase Logs:** Dashboard → Logs → Auth logs
3. **Verify Email:** Make sure your email is confirmed in Supabase
4. **Check RLS Policies:** Ensure Row Level Security policies allow access

---

## ✅ Prevention Checklist

After creating any new user, ensure:
- [ ] User exists in `auth.users` table
- [ ] Profile exists in `user_profiles` table
- [ ] `approval_status` = 'approved'
- [ ] `is_active` = true
- [ ] Role exists in `user_roles` table
- [ ] School assigned (if not super_admin)
- [ ] Email confirmed (check `email_confirmed_at`)

---

## 🎓 Understanding the Authentication Flow

1. **User enters credentials** → Supabase Auth validates
2. **Auth success** → System fetches user profile
3. **Check profile** → Must have `approval_status='approved'` and `is_active=true`
4. **Check role** → Must have entry in `user_roles` table
5. **Check school** → Teachers/admins must have `school_id` set
6. **Grant access** → User redirected to dashboard

If ANY step fails → User cannot access the system.

---

## 📝 Quick Reference SQL Commands

### View User Status
```sql
SELECT * FROM user_profiles WHERE user_id = 'UUID';
SELECT * FROM user_roles WHERE user_id = 'UUID';
```

### Approve User
```sql
UPDATE user_profiles SET approval_status='approved', is_active=true WHERE user_id='UUID';
```

### Set Role
```sql
INSERT INTO user_roles (user_id, role) VALUES ('UUID', 'teacher') ON CONFLICT (user_id) DO UPDATE SET role='teacher';
```

### Assign School
```sql
UPDATE user_profiles SET school_id='SCHOOL_UUID' WHERE user_id='UUID';
```

---

**Remember:** Always backup your database before running UPDATE or DELETE commands!
