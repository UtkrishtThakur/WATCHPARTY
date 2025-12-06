# 🔴 CRITICAL: Fix MongoDB Authentication First!

## The Problem

Your `.env.local` has:
```
MONGO_URI="mongodb+srv://utkrisht77880_db_user:<db_password>@cluster0.v8eowme.mongodb.net/watchparty?appName=Cluster0"
```

The `<db_password>` placeholder needs to be replaced with your actual MongoDB Atlas password.

---

## 🔧 How to Fix (5 Steps)

### Step 1: Go to MongoDB Atlas
- Visit: https://www.mongodb.com/cloud/atlas
- Log in to your account
- Click on **Cluster0**

### Step 2: Get Connection String
- Click the **CONNECT** button
- Select **Drivers**
- Choose **Node.js** version 4.0 or later
- You'll see the connection string

### Step 3: Copy Your Password
Look for this in MongoDB Atlas:
- **Database Access** (Left sidebar)
- Find user: `utkrisht77880_db_user`
- Look for the password you set (or reset it)
- Copy the password

### Step 4: Update `.env.local`
Open `.env.local` in your editor and replace:

**FROM:**
```
MONGO_URI="mongodb+srv://utkrisht77880_db_user:<db_password>@cluster0.v8eowme.mongodb.net/watchparty?appName=Cluster0"
```

**TO:** (replace `YOUR_PASSWORD` with actual password)
```
MONGO_URI="mongodb+srv://utkrisht77880_db_user:YOUR_PASSWORD@cluster0.v8eowme.mongodb.net/watchparty?appName=Cluster0"
```

**Example:**
```
MONGO_URI="mongodb+srv://utkrisht77880_db_user:MySecurePass123!@cluster0.v8eowme.mongodb.net/watchparty?appName=Cluster0"
```

### Step 5: Restart Dev Server
```bash
npm run dev
```

---

## ✅ How to Know It Works

When you start the server, you should see:
```
✅ MongoDB Connected Successfully
```

Instead of:
```
❌ MongoDB Connection Error: bad auth : authentication failed
```

---

## 🆘 If It Still Doesn't Work

### Check these:

1. **Password has special characters?**
   - If password contains `@`, `!`, `#`, etc. → URL encode it
   - Example: `@` becomes `%40`, `!` becomes `%21`
   - Go to: https://www.urlencoder.org/
   - Encode your password, then use in connection string

2. **Database user doesn't exist?**
   - Go to MongoDB Atlas → Database Access
   - Create new database user with strong password
   - Use that username and password

3. **Cluster not whitelisted?**
   - Go to MongoDB Atlas → Network Access
   - Add IP address `0.0.0.0/0` (allows all IPs)
   - Or add your specific IP

4. **Still getting errors?**
   - Check spelling of `utkrisht77880_db_user`
   - Make sure cluster name is `cluster0`
   - Verify region matches

---

## 📝 Reference

Your connection details:
- **Cluster**: `cluster0`
- **Database**: `watchparty`
- **Username**: `utkrisht77880_db_user`
- **Password**: `[YOUR_PASSWORD_HERE]`
- **Host**: `cluster0.v8eowme.mongodb.net`

---

## ⏰ Once Fixed...

After updating `.env.local`:

1. Save the file
2. Stop dev server (Ctrl+C)
3. Run `npm run dev` again
4. You should see ✅ MongoDB Connected Successfully
5. Visit http://localhost:3000
6. You can now test registration and login!

---

**This is the ONLY blocking issue. Once fixed, everything will work!** 🚀
