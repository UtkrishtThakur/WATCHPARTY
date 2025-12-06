# 🚀 WatchParty Authentication & OTP Setup Guide

## ⚙️ Step 1: Configure MongoDB Atlas

Your MongoDB Atlas connection string is almost ready, but the password needs to be added.

### Current .env.local:
```
MONGO_URI="mongodb+srv://utkrisht77880_db_user:<db_password>@cluster0.v8eowme.mongodb.net/watchparty?appName=Cluster0"
```

### ✅ To Fix:

1. Go to **MongoDB Atlas Dashboard** → **Cluster0** → **Connect**
2. Click **Drivers** and select **Node.js**
3. Copy the connection string
4. Replace `<db_password>` with your actual database password
5. Update `.env.local` with the full connection string

**Example:**
```
MONGO_URI="mongodb+srv://utkrisht77880_db_user:MyPassword123@cluster0.v8eowme.mongodb.net/watchparty?appName=Cluster0"
```

---

## 📦 Step 2: Install Dependencies

All required packages are already in `package.json`:
- ✅ `bcryptjs` - Password hashing
- ✅ `jsonwebtoken` - JWT tokens
- ✅ `mongoose` - MongoDB ODM
- ✅ `next` - Framework

Run:
```bash
npm install
```

---

## 🔐 Step 3: MongoDB Collections

The OTP and User collections will be created automatically when you:

1. **Register a new user** → Creates `otps` collection
2. **Verify OTP** → Creates `users` collection

**Or manually create in MongoDB Atlas:**

Go to **MongoDB Atlas** → **Cluster0** → **Collections** → **Create Collection**

Create these collections:
- `otps` - Stores temporary OTP data
- `users` - Stores verified users

---

## 🧪 Step 4: Test the System

### Registration Flow:
1. Go to `http://localhost:3000/auth/register`
2. Enter: **Name**, **Email**, **Password**
3. Click "Register" → OTP will be logged to console
4. Enter the 6-digit OTP
5. Click "Verify OTP"
6. You'll be logged in and redirected

### Login Flow:
1. Go to `http://localhost:3000/auth/login`
2. Enter email and password from registration
3. Click "Log In"

---

## 📧 Step 5: Email Configuration (Optional)

Currently, OTP is logged to console. To send real emails:

### Install nodemailer:
```bash
npm install nodemailer
```

### Update `lib/email.js`:
```javascript
import nodemailer from "nodemailer";

export async function sendOtpEmail(email, message) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your WatchParty OTP",
    html: `<h2>Verify Your Email</h2><p>${message}</p>`,
  });
}
```

### Add to `.env.local`:
```
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-password
```

---

## 🗄️ Database Schema

### Users Collection
```json
{
  "_id": ObjectId,
  "name": "John Doe",
  "email": "john@example.com",
  "password": "hashed_password",
  "isVerified": true,
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

### OTPs Collection (Temporary)
```json
{
  "_id": ObjectId,
  "email": "john@example.com",
  "name": "John Doe",
  "password": "hashed_password",
  "code": "123456",
  "expiresAt": ISODate,
  "createdAt": ISODate
}
```

---

## 🔧 Troubleshooting

### "bad auth : authentication failed"
- ❌ MongoDB password is wrong or placeholder still in .env.local
- ✅ Replace `<db_password>` with actual password

### "Module not found: bcryptjs"
- ❌ Package not installed
- ✅ Run `npm install bcryptjs`

### "Cannot find module @/models/User"
- ❌ Path alias not configured
- ✅ Check `jsconfig.json` has correct path aliases

### OTP not sending
- ✅ It's logged to console (check terminal)
- 📧 Configure email service for real emails

---

## 📱 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Send OTP to email |
| POST | `/api/auth/verify` | Verify OTP & create user |
| POST | `/api/auth/login` | Login with email/password |

---

## ✅ Checklist

- [ ] Update `MONGO_URI` in `.env.local` with password
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Test registration at `/auth/register`
- [ ] Test login at `/auth/login`
- [ ] (Optional) Configure email for OTP

---

## 🎯 Next Steps

1. Update MongoDB credentials
2. Restart dev server: `npm run dev`
3. Test the authentication flow
4. Start building room/video features

Good luck! 🚀
