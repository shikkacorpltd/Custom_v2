-- SQL Script to Fix Common Login Issues
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. FIND YOUR USER ID
-- ============================================
-- Replace 'your-email@example.com' with your actual email
SELECT 
  id as user_id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'your-email@example.com';

-- Copy the user_id from the result above and use it in the commands below
-- Replace 'YOUR_USER_ID_HERE' with the actual UUID


-- ============================================
-- 2. CHECK CURRENT STATUS
-- ============================================
-- Check if profile exists
SELECT 
  up.*,
  ur.role
FROM user_profiles up
LEFT JOIN user_roles ur ON up.user_id = ur.user_id
WHERE up.user_id = 'YOUR_USER_ID_HERE';


-- ============================================
-- 3. FIX MISSING PROFILE
-- ============================================
-- If no profile exists, create one
INSERT INTO user_profiles (
  user_id,
  full_name,
  approval_status,
  is_active,
  school_id
) VALUES (
  'YOUR_USER_ID_HERE',
  'Your Full Name',  -- Change this to your name
  'approved',
  true,
  NULL  -- Set to a school UUID if you're a teacher/school_admin
)
ON CONFLICT (user_id) DO UPDATE
SET 
  approval_status = 'approved',
  is_active = true;


-- ============================================
-- 4. FIX MISSING ROLE
-- ============================================
-- If no role exists, create one
-- Change 'teacher' to 'school_admin' or 'super_admin' as needed
INSERT INTO user_roles (
  user_id,
  role
) VALUES (
  'YOUR_USER_ID_HERE',
  'teacher'  -- Options: 'teacher', 'school_admin', 'super_admin'
)
ON CONFLICT (user_id) DO UPDATE
SET role = 'teacher';


-- ============================================
-- 5. FIX APPROVAL STATUS
-- ============================================
-- Approve the user if they're pending
UPDATE user_profiles
SET 
  approval_status = 'approved',
  is_active = true,
  updated_at = NOW()
WHERE user_id = 'YOUR_USER_ID_HERE';


-- ============================================
-- 6. ASSIGN TO A SCHOOL (Optional)
-- ============================================
-- First, find available schools
SELECT id, name FROM schools LIMIT 10;

-- Then assign user to a school
-- Replace 'SCHOOL_UUID_HERE' with actual school ID from above
UPDATE user_profiles
SET school_id = 'SCHOOL_UUID_HERE'
WHERE user_id = 'YOUR_USER_ID_HERE';


-- ============================================
-- 7. VERIFY FINAL STATUS
-- ============================================
-- Run this to confirm everything is set up correctly
SELECT 
  au.email,
  au.email_confirmed_at,
  up.full_name,
  up.approval_status,
  up.is_active,
  ur.role,
  s.name as school_name
FROM auth.users au
JOIN user_profiles up ON au.id = up.user_id
LEFT JOIN user_roles ur ON au.id = ur.user_id
LEFT JOIN schools s ON up.school_id = s.id
WHERE au.id = 'YOUR_USER_ID_HERE';


-- ============================================
-- 8. QUICK FIX - ALL IN ONE (Use with caution!)
-- ============================================
-- This combines all fixes - only use if you know what you're doing
-- Replace YOUR_USER_ID_HERE and other values as needed

-- DO $$
-- DECLARE
--   v_user_id UUID := 'YOUR_USER_ID_HERE';
--   v_full_name TEXT := 'Your Full Name';
--   v_role TEXT := 'teacher';  -- Options: 'teacher', 'school_admin', 'super_admin'
--   v_school_id UUID := NULL;  -- Set to school UUID if applicable
-- BEGIN
--   -- Ensure profile exists and is approved
--   INSERT INTO user_profiles (user_id, full_name, approval_status, is_active, school_id)
--   VALUES (v_user_id, v_full_name, 'approved', true, v_school_id)
--   ON CONFLICT (user_id) DO UPDATE
--   SET 
--     approval_status = 'approved',
--     is_active = true,
--     updated_at = NOW();
--   
--   -- Ensure role exists
--   INSERT INTO user_roles (user_id, role)
--   VALUES (v_user_id, v_role)
--   ON CONFLICT (user_id) DO UPDATE
--   SET role = v_role;
--   
--   RAISE NOTICE 'User % fixed successfully!', v_user_id;
-- END $$;
