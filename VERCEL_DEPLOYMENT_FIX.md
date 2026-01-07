# Vercel Deployment Fix - 404 Error Resolution

## Problem
Getting `Server error: 404` when trying to login at https://ask-qiao.vercel.app/login.html

## Root Cause
Vercel requires Express.js apps to be wrapped as serverless functions. The original setup didn't have the proper Vercel configuration, causing all API requests to return 404.

## Solution Applied

### 1. Created Vercel Serverless Function
- **File**: `api/index.js`
- Wraps the Express app for Vercel deployment
- Handles database connection initialization
- Exports the Express app for Vercel to use

### 2. Created Vercel Configuration
- **File**: `vercel.json`
- Routes all `/api/*` requests to the serverless function
- Routes all other requests to the serverless function (for SPA)
- Serves static files with proper caching headers

### 3. Verified MongoDB Configuration
- Database connection settings are correct
- Cluster: `ask-qiao.1lvanu7.mongodb.net`
- Database: `ask_qiao`
- Collection: `users`

## What to Check in Vercel Dashboard

### 1. Environment Variables
Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Ensure these are set:
```
MONGODB_USER=mortalnow
MONGODB_PASSWORD=your_password
MONGODB_CLUSTER=ask-qiao.1lvanu7.mongodb.net
MONGODB_DB_NAME=ask_qiao
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_key
GOOGLE_AI_API_KEY=your_google_key
```

### 2. Redeploy
After adding/updating environment variables:
1. Go to Deployments tab
2. Click "Redeploy" on the latest deployment
3. Or push a new commit to trigger automatic deployment

### 3. Verify Deployment
After redeployment, check:
- `/api/auth/login` endpoint should return JSON (not 404)
- `/login.html` should load correctly
- Static files (CSS, JS) should load

## Testing

### Test API Endpoint
```bash
curl https://ask-qiao.vercel.app/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"mortalnow@gmail.com","password":"111111"}'
```

Expected: JSON response (either success with token or error message)
Not Expected: 404 error

### Test Login Page
Visit: https://ask-qiao.vercel.app/login.html

Should see the login form, not a 404 error.

## Files Changed

1. **api/index.js** (NEW) - Vercel serverless function wrapper
2. **vercel.json** (NEW) - Vercel routing configuration
3. **scripts/verify-mongodb-config.js** (NEW) - MongoDB config verification script

## Next Steps

1. ✅ Commit and push these changes
2. ⏳ Verify environment variables in Vercel dashboard
3. ⏳ Redeploy the application
4. ⏳ Test the login endpoint
5. ⏳ Verify user exists in production database (if needed, run `init-mongodb.js` with production credentials)

## Troubleshooting

If still getting 404 after deployment:

1. **Check Vercel logs**: Dashboard → Deployments → Click on deployment → View Function Logs
2. **Verify api/index.js is being used**: Check build logs for "@vercel/node"
3. **Check environment variables**: Make sure all required vars are set
4. **Test locally**: Run `vercel dev` to test locally before deploying

If getting database connection errors:

1. Verify MongoDB Atlas IP whitelist includes Vercel IPs (or 0.0.0.0/0 for testing)
2. Check MongoDB credentials are correct
3. Run `node scripts/verify-mongodb-config.js` to verify connection string
4. Run `node scripts/check-user.js` with production credentials to verify user exists

