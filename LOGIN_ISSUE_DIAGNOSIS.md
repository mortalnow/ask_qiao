# Login Issue Diagnosis

## Problem
Cannot login to production site (https://talk-to-qiao.vercel.app) with:
- Username: `mortalnow@gmail.com`
- Password: `111111`

## Root Cause
The production MongoDB database on Vercel is likely **empty or pointing to a different database** than your local development database.

## Verification
✅ Local database check shows:
- User `mortalnow@gmail.com` exists
- Password is correct
- User is an admin

❌ Production database likely:
- Doesn't have this user
- Or is using different MongoDB credentials

## Solutions

### Option 1: Initialize Production Database (Recommended)

1. **Get your production MongoDB credentials** from Vercel:
   - Go to Vercel dashboard → Your project → Settings → Environment Variables
   - Note down: `MONGODB_USER`, `MONGODB_PASSWORD`, `MONGODB_CLUSTER`, `MONGODB_DB_NAME`

2. **Run the initialization script** with production credentials:
   ```bash
   MONGODB_USER=your_prod_user \
   MONGODB_PASSWORD=your_prod_password \
   MONGODB_CLUSTER=your_prod_cluster.mongodb.net \
   MONGODB_DB_NAME=talk_to_qiao \
   node scripts/init-mongodb.js
   ```

   Or pass the cluster as an argument:
   ```bash
   MONGODB_USER=your_prod_user \
   MONGODB_PASSWORD=your_prod_password \
   node scripts/init-mongodb.js your_prod_cluster.mongodb.net
   ```

3. **Verify the user was created**:
   ```bash
   MONGODB_USER=your_prod_user \
   MONGODB_PASSWORD=your_prod_password \
   MONGODB_CLUSTER=your_prod_cluster.mongodb.net \
   node scripts/check-user.js "mortalnow@gmail.com" "111111"
   ```

### Option 2: Create User Using check-admin Script

1. **Set production MongoDB environment variables** (same as above)

2. **Run the check-admin script**:
   ```bash
   MONGODB_USER=your_prod_user \
   MONGODB_PASSWORD=your_prod_password \
   MONGODB_CLUSTER=your_prod_cluster.mongodb.net \
   node scripts/check-admin.js "mortalnow@gmail.com" "111111"
   ```

   This will:
   - Check if user exists
   - Create user if it doesn't exist
   - Set password and admin status

### Option 3: Verify Environment Variables Match

1. **Check Vercel environment variables** match your local `.env`:
   - Ensure `MONGODB_CLUSTER` points to the same database
   - Ensure `MONGODB_DB_NAME` is the same (`talk_to_qiao`)
   - Ensure credentials are correct

2. **If they don't match**, either:
   - Update Vercel env vars to point to your local database (for testing)
   - Or initialize the production database with the user

### Option 4: Register via Invite Code (Alternative)

If you have invite codes, you can register a new account:
1. Go to https://talk-to-qiao.vercel.app/login.html
2. Click "Register" tab
3. Enter an invite code, username, and password
4. This will create the account in the production database

## Quick Diagnostic Commands

### Check if user exists in production:
```bash
MONGODB_USER=your_prod_user \
MONGODB_PASSWORD=your_prod_password \
MONGODB_CLUSTER=your_prod_cluster.mongodb.net \
node scripts/check-user.js "mortalnow@gmail.com" "111111"
```

### List all users in production:
```bash
MONGODB_USER=your_prod_user \
MONGODB_PASSWORD=your_prod_password \
MONGODB_CLUSTER=your_prod_cluster.mongodb.net \
node scripts/check-admin.js
```

## Notes

- The local database and production database are **separate** unless they use the same MongoDB credentials
- Vercel environment variables override local `.env` file
- Always verify which database you're connecting to before running scripts
- The `init-mongodb.js` script creates the admin user automatically if it doesn't exist

