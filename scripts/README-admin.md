# Admin Account Setup Guide

## Important Notes

1. **Username vs Email**: The system uses `username`, not `email`. If your email is `mortalnow@gmail.com`, use `mortalnow` as the username.

2. **MongoDB Atlas Connection**: You need the correct cluster address from MongoDB Atlas dashboard.

## Getting MongoDB Atlas Connection String

1. Go to MongoDB Atlas dashboard
2. Click "Connect" on your cluster
3. Select "Connect your application"
4. Copy the connection string - it should look like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<dbname>?retryWrites=true&w=majority
   ```
5. Extract the cluster address (the part after `@` and before `/`):
   - Full format: `cluster0.xxxxx.mongodb.net`
   - Or just: `cluster0` (if your cluster is named cluster0)

## Setting Environment Variables

Create or update your `.env` file:

```bash
MONGODB_USER=your-mongodb-username
MONGODB_PASSWORD=your-mongodb-password
MONGODB_CLUSTER=cluster0.xxxxx.mongodb.net  # Full address OR just "cluster0"
MONGODB_DB_NAME=ask_qiao
```

## Checking/Creating Admin Account

### Option 1: Using the check-admin script

```bash
# Check and create admin account
node scripts/check-admin.js mortalnow 111111

# Or with different username/password
node scripts/check-admin.js <username> <password>
```

### Option 2: Using set-password script (if user exists)

```bash
# Set password for existing user
node scripts/set-password.js mortalnow 111111

# Then manually set admin flag in MongoDB Atlas dashboard
# Or use MongoDB shell/Compass to update: db.users.updateOne({username: "mortalnow"}, {$set: {is_admin: true}})
```

## Troubleshooting 404 Error

If you're getting a 404 error on the online server:

1. **Check MongoDB Connection**: The server might not be starting due to MongoDB connection failure
   - Check server logs for MongoDB connection errors
   - Verify environment variables are set correctly on the server

2. **Check Routes**: Verify the routes are accessible:
   - `/api/auth/login` - Should work without auth
   - `/api/auth/me` - Requires JWT token
   - `/api/admin/*` - Requires admin JWT token

3. **Check Admin Account**: Ensure the admin account exists and `is_admin` is set to `true`

## Manual MongoDB Atlas Check

You can also check directly in MongoDB Atlas:

1. Go to MongoDB Atlas dashboard
2. Click "Browse Collections"
3. Check the `users` collection
4. Look for a document with:
   - `username: "mortalnow"`
   - `is_admin: true`
   - `password_hash: <hashed password>`

