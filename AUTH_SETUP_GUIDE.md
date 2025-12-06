## Authentication System Setup Complete

### Files Created/Updated:

#### 1. **Models** (`/models`)
- **User.js** - User schema with fields: `name`, `email`, `password`, `isVerified`, `timestamps`
- **Otp.js** - OTP schema for temporary user registration data with auto-expiry

#### 2. **Database** (`/lib`)
- **db.js** - MongoDB connection handler using Mongoose
- **email.js** - Email utility for sending OTP emails (placeholder - configure with your email service)

#### 3. **Authentication Utils** (`/app/utils`)
- **auth.js** - JWT token generation and verification utilities

#### 4. **API Routes** (`/app/api/auth`)
- **register/route.js** - Generate OTP and send to email
- **login/route.js** - Authenticate user with email/password
- **verify/route.js** (NEW) - Verify OTP and create user in database

#### 5. **Frontend Pages** (`/app/auth`)
- **login/page.jsx** - Login form (email + password)
- **register/page.jsx** - Registration with 2-step OTP verification

---

## How It Works:

### Registration Flow:
1. User enters **Name**, **Email**, and **Password** on registration page
2. System sends OTP to user's email
3. User enters OTP to verify email
4. User account is created with verified status

### Login Flow:
1. User enters **Email** and **Password**
2. System validates credentials
3. JWT token is generated and stored in localStorage
4. User is redirected to profile page

---

## Configuration Required:

Create a `.env.local` file (copy from `.env.example`):

```
MONGO_URI=mongodb://localhost:27017/watchparty
JWT_SECRET=your-super-secret-key
```

### Optional - Email Configuration:
To send real OTP emails, configure email service (Gmail, SendGrid, etc.) in `lib/email.js`

---

## Data Structure:

### User Collection:
```json
{
  "_id": ObjectId,
  "name": "John Doe",
  "email": "john@example.com",
  "password": "hashed_password",
  "isVerified": true,
  "createdAt": Date,
  "updatedAt": Date
}
```

### OTP Collection (Temporary):
```json
{
  "_id": ObjectId,
  "email": "john@example.com",
  "name": "John Doe",
  "password": "hashed_password",
  "code": "123456",
  "expiresAt": Date,
  "createdAt": Date
}
```

---

## API Endpoints:

- `POST /api/auth/register` - Send OTP to email
- `POST /api/auth/login` - Login with email & password
- `POST /api/auth/verify` - Verify OTP and create user

---

## Installation:
Make sure you have the required packages installed:
```bash
npm install bcryptjs jsonwebtoken mongoose
```

All are already in your `package.json`
