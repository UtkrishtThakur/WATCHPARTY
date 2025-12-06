# WatchParty OTP & Authentication System Summary

## ✅ What's Been Set Up

### 1. **User Model** (`models/User.js`)
- Fields: `name`, `email`, `password`, `isVerified`, `timestamps`
- Password is hashed using bcryptjs
- Email is unique in database

### 2. **OTP Model** (`models/Otp.js`)
- Stores temporary user data during registration
- Fields: `email`, `name`, `password`, `code`, `expiresAt`
- Auto-expires after 5 minutes
- Auto-deletes from database after TTL expires

### 3. **Authentication Routes** (`app/api/auth/`)

#### Register Route (`/api/auth/register`)
```javascript
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```
- Generates 6-digit OTP
- Hashes password
- Stores in OTP collection (temporary)
- Logs OTP to console (or sends via email if configured)

#### Verify Route (`/api/auth/verify`)
```javascript
POST /api/auth/verify
{
  "email": "john@example.com",
  "code": "123456",
  "name": "John Doe"
}
```
- Verifies OTP code
- Creates permanent user in User collection
- Deletes OTP record
- Returns JWT token

#### Login Route (`/api/auth/login`)
```javascript
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```
- Validates email and password
- Compares hashed password
- Returns JWT token

### 4. **Frontend Pages** (`app/auth/`)
- **`/auth/login`** - Login form (email + password)
- **`/auth/register`** - Registration with OTP verification (2-step)

### 5. **Utilities**
- **`lib/db.js`** - MongoDB connection with error handling
- **`lib/email.js`** - Email service (placeholder for Nodemailer)
- **`app/utils/auth.js`** - JWT token utilities
- **`models/Otp.js`** - OTP schema with auto-expiry

---

## 🔄 Registration & Login Flow

### Registration (2-Step)
1. User enters **name**, **email**, **password**
2. System generates **6-digit OTP**
3. OTP sent to email (or logged to console)
4. User enters **OTP code**
5. System verifies code
6. **User created** in database with verified status
7. **JWT token** returned
8. User stored in localStorage
9. Redirect to `/room/join`

### Login (1-Step)
1. User enters **email** and **password**
2. System finds user in database
3. System compares hashed password
4. If valid: **JWT token** returned
5. User stored in localStorage
6. Redirect to `/room/join`

---

## 📊 Database Collections

### `users` Collection
```
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  isVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### `otps` Collection
```
{
  _id: ObjectId,
  email: String (unique),
  name: String,
  password: String (hashed),
  code: String,
  expiresAt: Date,
  createdAt: Date (TTL index - auto-deletes)
}
```

---

## 🔑 Environment Variables Required

```env
MONGO_URI=mongodb+srv://user:PASSWORD@cluster.mongodb.net/watchparty
JWT_SECRET=your-long-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🚀 How to Start

### 1. Fix MongoDB Credentials
Update `.env.local` - Replace `<db_password>` with actual password:
```env
MONGO_URI="mongodb+srv://utkrisht77880_db_user:YOUR_PASSWORD@cluster0.v8eowme.mongodb.net/watchparty?appName=Cluster0"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Dev Server
```bash
npm run dev
```

### 4. Test
- Register: http://localhost:3000/auth/register
- Login: http://localhost:3000/auth/login

---

## 📝 OTP Behavior

- **Generation**: Random 6-digit code (100000-999999)
- **Expiration**: 5 minutes from creation
- **Storage**: MongoDB `otps` collection
- **Auto-delete**: After 5 minutes via TTL index
- **Rate limiting**: Can't request new OTP if one exists and not expired

---

## 🔒 Security Features

✅ Passwords are hashed with bcryptjs (10 salt rounds)
✅ JWT tokens expire after 7 days
✅ OTP codes expire after 5 minutes
✅ OTP codes are 6 digits (1 million combinations)
✅ Passwords excluded from API responses
✅ Authentication errors are generic (don't reveal if email exists)

---

## 📧 Email Configuration (Optional)

To send real OTP emails instead of logging to console:

1. Install nodemailer: `npm install nodemailer`
2. Update `lib/email.js` with email service credentials
3. Add to `.env.local`:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=app-password
   ```

---

## ✨ Files Structure

```
watchparty/
├── models/
│   ├── User.js          ← User schema
│   └── Otp.js           ← OTP schema
├── lib/
│   ├── db.js            ← DB connection
│   └── email.js         ← Email service
├── app/
│   ├── utils/
│   │   └── auth.js      ← JWT utilities
│   ├── api/auth/
│   │   ├── register/route.js  ← Generate OTP
│   │   ├── verify/route.js    ← Verify OTP & create user
│   │   └── login/route.js     ← Login with credentials
│   └── auth/
│       ├── register/page.jsx  ← Registration form
│       └── login/page.jsx     ← Login form
└── .env.local           ← Environment variables
```

---

## 🧪 Testing with Console

Since email isn't configured, **OTP codes are logged to the console**:

1. Start dev server: `npm run dev`
2. Go to `/auth/register`
3. Enter name, email, password
4. Click "Register"
5. **Check terminal** → You'll see:
   ```
   📧 Email sent to john@example.com: Your OTP is: 123456
   ```
6. Copy the 6-digit code
7. Paste in OTP field
8. Click "Verify OTP"
9. Done! You're logged in.

---

## ❌ Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "bad auth" MongoDB error | Wrong password in MONGO_URI | Replace `<db_password>` with actual password |
| "Module not found: bcryptjs" | Package not installed | Run `npm install bcryptjs` |
| OTP not appearing | Email not configured | Check terminal/console for logged OTP |
| User not created | MongoDB connection failed | Verify MONGO_URI and MongoDB is running |

---

Done! The OTP system is fully set up. 🎉
