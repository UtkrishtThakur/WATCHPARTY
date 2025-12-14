# WatchParty Project Architecture & Documentation

## Overview

WatchParty is a real-time collaborative video streaming application built with **Next.js 14 (App Router)**, **MongoDB**, **Mongoose**, and **WebRTC**. Users can create rooms, invite others via shareable codes, start group sessions, and eventually stream movies together using WebRTC for peer-to-peer video/audio communication.

---

## Project Structure

```
watchparty/
├── app/                                  # Next.js App Router (main application logic)
│   ├── api/                             # API routes (backend endpoints)
│   │   ├── auth/
│   │   │   ├── login/route.js           # User login endpoint
│   │   │   ├── register/route.js        # User registration endpoint
│   │   │   └── verify/route.js          # OTP verification endpoint
│   │   ├── room/
│   │   │   ├── create/route.js          # Create new room endpoint
│   │   │   ├── join/route.js            # Join room by ID or code endpoint
│   │   │   ├── list/route.js            # List user's created rooms endpoint
│   │   │   ├── details/[roomId]/route.js # Get room details endpoint
│   │   │   ├── [roomId]/route.js        # Delete/end room endpoint (DELETE)
│   │   │   └── migrate-codes/route.js   # Migration endpoint to add codes to existing rooms
│   │   └── signaling/route.js           # WebRTC signaling endpoint (future)
│   │
│   ├── auth/                            # Authentication pages
│   │   ├── login/page.jsx               # Login page UI
│   │   └── register/page.jsx            # Registration page UI
│   │
│   ├── room/                            # Room pages
│   │   ├── create/page.jsx              # Create room page UI
│   │   ├── join/page.jsx                # Join room page UI (list rooms + join by code)
│   │   └── [roomId]/page.jsx            # Room session page (video call, controls, participants)
│   │
│   ├── hooks/                           # React custom hooks
│   │   ├── useWebRTCStream.js           # Hook to access local media (camera/mic)
│   │   ├── useWebRTCSignal.js           # Hook for WebRTC signaling (future)
│   │   └── useDataChannel.js            # Hook for WebRTC data channel (future)
│   │
│   ├── utils/                           # Frontend utilities
│   │   ├── auth.js                      # Auth helper functions
│   │   ├── db.js                        # Database connection wrapper (delegates to lib/db.js)
│   │   ├── helpers.js                   # General helpers
│   │   └── logout.js                    # Logout handler
│   │
│   ├── layout.js                        # Root layout (wraps all pages)
│   ├── page.js                          # Root page / landing page
│   └── globals.css                      # Global CSS styles
│
├── components/                          # Reusable React components
│   ├── call/
│   │   ├── CallWindow.jsx               # Main video call display component
│   │   ├── CamButton.jsx                # Camera on/off toggle button
│   │   └── MicButton.jsx                # Microphone on/off toggle button
│   ├── ui/
│   │   └── Button.jsx                   # Reusable button component
│   ├── LoadingSpinner.jsx               # Loading indicator component
│   ├── ParticipantsBar.jsx              # Participants list component
│   ├── PartyControls.jsx                # Room control buttons (leave, end, etc.)
│   └── PartyVideoPlayer.jsx             # Video player component
│
├── lib/                                 # Shared library utilities (backend & helpers)
│   ├── db.js                            # MongoDB connection handler with error handling
│   ├── email.js                         # Nodemailer email sending logic
│   ├── peerConnectionHelpers.js         # WebRTC peer connection utilities (future)
│   ├── signalingServer.js               # WebRTC signaling server logic (future)
│   └── webrtcConfig.js                  # WebRTC configuration constants
│
├── models/                              # Mongoose schemas
│   ├── User.js                          # User schema (email, password, name, createdAt)
│   ├── Room.js                          # Room schema (name, code, participants, sessions)
│   └── Otp.js                           # OTP schema (email, code, expiry)
│
├── public/                              # Static assets
│
├── .env.local                           # Environment variables (not in git)
├── package.json                         # Dependencies & scripts
├── jsconfig.json                        # JavaScript path aliases
├── next.config.mjs                      # Next.js configuration
├── postcss.config.mjs                   # PostCSS configuration
├── eslint.config.mjs                    # ESLint configuration
└── README.md                            # Project README

```

---

## Core Files Explained

### **Authentication & Security**

#### `models/User.js`
- **Purpose**: Defines the User schema for MongoDB
- **Fields**:
  - `email` (String, unique, required): User's email address
  - `password` (String, required): Hashed password (bcrypt)
  - `name` (String): User's display name
  - `createdAt` (Date): Account creation timestamp
- **Used by**: Registration, login, OTP verification

#### `models/Otp.js`
- **Purpose**: Stores temporary OTP records for email verification
- **Fields**:
  - `email` (String, unique): User's email
  - `code` (String): 6-digit OTP code
  - `expiresAt` (Date): OTP expiration time (5 minutes)
- **Used by**: Registration flow (OTP sent via email, verified, then user created)

#### `app/api/auth/register/route.js`
- **Purpose**: User registration endpoint
- **Flow**:
  1. Accept `email`, `password`, `name` from request body
  2. Check if user already exists
  3. Generate 6-digit OTP code
  4. Send OTP via email (using `lib/email.js`)
  5. Store OTP record in database
  6. Return OTP expiry time to client
- **Response**: `{ otp, expiresIn: 300000 }` (5 minutes)

#### `app/api/auth/verify/route.js`
- **Purpose**: OTP verification endpoint
- **Flow**:
  1. Accept `email` and `otp` from request body
  2. Find OTP record in database
  3. Validate OTP is not expired and matches
  4. Hash password using bcryptjs
  5. Create User document in MongoDB
  6. Delete OTP record (one-time use)
  7. Generate JWT token (using process.env.JWT_SECRET)
  8. Return token + user info
- **Response**: `{ token, user: { id, email, name } }`

#### `app/api/auth/login/route.js`
- **Purpose**: User login endpoint
- **Flow**:
  1. Accept `email` and `password` from request body
  2. Find user in database
  3. Compare provided password with hashed password (bcryptjs)
  4. Generate JWT token
  5. Return token + user info
- **Response**: `{ token, user: { id, email, name } }`

#### `app/utils/logout.js`
- **Purpose**: Frontend logout handler
- **Function**: Clears `token` and `user` from localStorage, redirects to home
- **Used by**: Logout buttons in UI

#### `lib/email.js`
- **Purpose**: Handles email sending via SMTP (Nodemailer)
- **Configuration**:
  - Reads `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM` from `.env.local`
  - Supports Gmail, Mailtrap, or any SMTP server
- **Fallback**: If SMTP not configured, logs OTP to console
- **Used by**: Registration flow (OTP email)

---

### **Room Management**

#### `models/Room.js`
- **Purpose**: Defines the Room schema for MongoDB
- **Fields**:
  - `name` (String, required): Room display name
  - `code` (String, unique, indexed): Shareable room code (UUID v4, auto-generated)
  - `createdBy` (ObjectId, ref: User): Room creator/host ID
  - `participants` (Array of ObjectId refs to User): Users currently in room
  - `maxParticipants` (Number, default: 10): Room capacity
  - `isActive` (Boolean, default: true): Whether room is active
  - `sessionStarted` (Boolean, default: false): Whether playback/session has started
  - `sessionStartedAt` (Date): Timestamp when session started
  - `createdAt`, `updatedAt` (Date): Timestamps
  - `expiresAt` (Date): Room auto-expiry (24 hours from creation)
- **Used by**: All room APIs and UI

#### `app/api/room/create/route.js`
- **Purpose**: Create a new room
- **Flow**:
  1. Verify JWT token from Authorization header
  2. Extract `name` and optional `maxParticipants` from request body
  3. **One-room-per-user enforcement**: Delete any previous active rooms created by this user
  4. Create new Room document with auto-generated `code` and `createdBy: userId`
  5. Add creator as first participant
  6. Return created room object (including the generated `code`)
- **Response**: `{ message: "Room created successfully", room: {...} }`
- **Key behavior**: Ensures only one active room per user at a time

#### `app/api/room/join/route.js`
- **Purpose**: Join an existing room
- **Flow**:
  1. Verify JWT token
  2. Accept either `roomId` (direct) or `code` (shareable) from request body
  3. Query room by ID or by code
  4. Check room capacity (not full)
  5. Add user to `participants` array if not already present
  6. **Session start**: If this is a new participant and session hasn't started, set `sessionStarted: true` and `sessionStartedAt: now`
  7. Populate participants with user details (name, email)
  8. Return room object
- **Response**: `{ message: "Joined room successfully", room: {...} }`
- **Error cases**: Room not found (404), room full (400), unauthorized (401)

#### `app/api/room/list/route.js`
- **Purpose**: List all rooms created by the authenticated user
- **Flow**:
  1. Verify JWT token
  2. Query all rooms where `createdBy: userId`
  3. Include `code` field in results (so user can see codes for their rooms)
  4. Return array of room objects
- **Response**: `{ rooms: [...] }`
- **Security**: Only returns rooms created by the authenticated user

#### `app/api/room/details/[roomId]/route.js`
- **Purpose**: Get full details of a specific room
- **Flow**:
  1. Accept `roomId` from dynamic route parameter (awaited for Next.js 14 compatibility)
  2. Query room by ID
  3. Populate `createdBy` with user details (name, email)
  4. Populate `participants` with user details (name, email)
  5. Return full room object with populated references
- **Response**: `{ room: {...} }`
- **Used by**: Room page to display host info and participants list

#### `app/api/room/[roomId]/route.js` (DELETE)
- **Purpose**: End/delete a room (host-only action)
- **Flow**:
  1. Verify JWT token
  2. Accept `roomId` from dynamic route parameter (awaited)
  3. Find room by ID
  4. **Authorization check**: Verify `createdBy` matches current user (host only)
  5. Delete room document from database
  6. Return success message
- **Response**: `{ message: "Room ended successfully" }`
- **Error cases**: Room not found (404), unauthorized (403), invalid token (401)
- **Security**: Only room creator (host) can delete

#### `app/api/room/migrate-codes/route.js`
- **Purpose**: One-time migration endpoint to add codes to existing rooms
- **Why needed**: Rooms created before the `code` field was added to the model don't have codes
- **Flow**:
  1. Verify JWT token
  2. Find all rooms without a `code` field
  3. Generate unique UUID for each room (retry if duplicate)
  4. Update rooms with their new codes
  5. Return migration summary
- **Usage**: Call once via `POST /api/room/migrate-codes` with valid auth token
- **Response**: `{ message: "Migration complete", migratedCount: N }`

---

### **Frontend Pages**

#### `app/page.js` (Root/Landing Page)
- **Purpose**: Home page for unauthenticated and authenticated users
- **Behavior**:
  - If logged in: Shows a simple home page with a button to create or join rooms
  - If not logged in: Shows login/register landing page with CTA buttons
- **Navigation**: Redirects to `/auth/login` or `/room/join` based on auth state

#### `app/auth/register/page.jsx`
- **Purpose**: User registration UI
- **Flow**:
  1. User enters email, password, confirm password, and name
  2. Submit calls `/api/auth/register` 
  3. API returns OTP and expiry
  4. Show OTP input field (countdown timer)
  5. User enters OTP and submits
  6. Call `/api/auth/verify` with email + OTP
  7. API returns JWT token + user info
  8. Store `token` and `user` (JSON) in localStorage
  9. Redirect to `/room/join`
- **Error handling**: Show validation errors (password mismatch, invalid OTP, etc.)

#### `app/auth/login/page.jsx`
- **Purpose**: User login UI
- **Flow**:
  1. User enters email and password
  2. Submit calls `/api/auth/login`
  3. API returns JWT token + user info
  4. Store `token` and `user` in localStorage
  5. Redirect to `/room/join`
- **Error handling**: Show error for invalid credentials

#### `app/room/create/page.jsx`
- **Purpose**: Create a new room UI
- **Flow**:
  1. User enters room name and optional max participants (default 10)
  2. Submit calls `/api/room/create` with JWT token
  3. API creates room and returns room object (with generated `code`)
  4. **Show success screen** displaying:
     - Room name
     - Generated room code (large, copyable)
     - Copy button (clipboard copy)
     - "Enter Room" button
     - "Go Back" button
  5. User can copy code to share with others or enter room directly
- **Key UX**: Instead of immediate redirect, shows the code so user can copy it before entering

#### `app/room/join/page.jsx`
- **Purpose**: Join a room via code or enter your created rooms
- **Sections**:
  1. **My Created Rooms**: Lists all rooms created by the user
     - Shows room name, code, participant count
     - Copy button for code (clipboard)
     - Enter Room button
     - Delete button (removes room from DB)
  2. **Join by Code**: Input field to paste a room code and join
     - User gets code from room creator
     - Input code and click "Join Room"
     - Redirected to room page
- **Flow**:
  1. On load, fetch `/api/room/list` to get user's rooms
  2. Display rooms with copy/enter/delete buttons
  3. When user enters code:
     - Call `/api/room/join` with `code` parameter
     - API adds user to room and starts session if needed
     - Redirect to `/room/[roomId]`
  4. Delete action: Call `DELETE /api/room/[roomId]`, remove from UI

#### `app/room/[roomId]/page.jsx`
- **Purpose**: Main room/session page (in-room experience)
- **Components**:
  - **Header**: Shows room name, participant count, room code (with copy), session status
  - **Session Status**: Displays "Session started: <timestamp>" or "Session not started"
  - **Host Controls**: If current user is the room creator, show "🛑 End Room" button
    - Clicking prompts for confirmation
    - Calls `DELETE /api/room/[roomId]`
    - Redirects host to `/room/join` after deletion
  - **CallWindow**: Main WebRTC video display (local + remote streams)
  - **Controls**: Mic/Cam toggle buttons (controlled by parent page)
  - **Leave Button**: Leave room and return to `/room/join`
- **Flow**:
  1. On mount: Get current user from localStorage
  2. Fetch room details via `/api/room/details/[roomId]`
  3. Start local media stream (camera/mic) via `useWebRTCStream` hook
  4. Display participants and controls
  5. Show session status (started timestamp)
  6. If user is host, show End Room button
  7. On leave: Stop media, redirect to `/room/join`
  8. On End Room (host only): Delete room, redirect to `/room/join`
- **WebRTC integration** (future): Will use `useWebRTCStream` and `useWebRTCSignal` for video/audio

---

### **React Hooks** (In `app/hooks/`)

#### `useWebRTCStream.js`
- **Purpose**: Manages local media stream (camera and microphone)
- **Functions**:
  - `startStream()`: Request user permission and get video/audio tracks
  - `stopStream()`: Stop all tracks and close stream
  - Returns: `stream` (MediaStream object), `startStream`, `stopStream`
- **Used by**: Room page to get local camera/mic

#### `useWebRTCSignal.js` (Placeholder)
- **Purpose**: Handle WebRTC signaling (SDP offers/answers, ICE candidates)
- **Future**: Will connect to `/api/signaling` endpoint for peer discovery and connection

#### `useDataChannel.js` (Placeholder)
- **Purpose**: Handle WebRTC data channel for non-media communication
- **Future**: Will be used for chat or metadata exchange

---

### **Reusable Components** (In `components/`)

#### `components/ui/Button.jsx`
- **Purpose**: Reusable button component with variant support
- **Props**: `variant` (primary/secondary), `onClick`, `disabled`, `className`, children
- **Used by**: Login, register, join, create pages

#### `components/call/CallWindow.jsx`
- **Purpose**: Main video display component
- **Props**: `localStream`, `remoteStreams`, `participants`, `onMicToggle`, `onCamToggle`, `onLeave`, `isMicOn`, `isCamOn`
- **Displays**: Local video (self), remote videos (other participants), control buttons

#### `components/call/CamButton.jsx`
- **Purpose**: Camera toggle button
- **Props**: `isOn`, `onClick`
- **Displays**: Camera on/off icon

#### `components/call/MicButton.jsx`
- **Purpose**: Microphone toggle button
- **Props**: `isOn`, `onClick`
- **Displays**: Mic on/off icon

#### `components/LoadingSpinner.jsx`
- **Purpose**: Loading indicator
- **Used by**: Pages while fetching data

#### `components/ParticipantsBar.jsx`
- **Purpose**: Display list of participants in room
- **Props**: `participants` (array of user objects)

#### `components/PartyControls.jsx`
- **Purpose**: Control buttons for room (leave, end, etc.)
- **Props**: `onLeave`, `onEnd`, `isHost`

#### `components/PartyVideoPlayer.jsx`
- **Purpose**: Individual video player for one participant
- **Props**: `stream` (MediaStream), `userName`, `isSelf`

---

### **Backend Utilities** (In `lib/`)

#### `lib/db.js`
- **Purpose**: MongoDB connection handler with robust error management
- **Features**:
  - Connects to MongoDB using `MONGO_URI` from `.env.local`
  - Normalizes connection string (trims surrounding quotes)
  - Masks password in console logs
  - Provides helpful error messages for auth failures
  - Throws if MONGO_URI contains placeholder `<db_password>`
  - Caches connection to avoid reconnecting
- **Exports**: `dbConnect()` async function
- **Used by**: All API routes that query the database

#### `lib/email.js`
- **Purpose**: Email sending via Nodemailer
- **Configuration**: Reads SMTP settings from `.env.local`
  - `EMAIL_HOST`: SMTP server (e.g., smtp.gmail.com)
  - `EMAIL_PORT`: Port (e.g., 587 for Gmail)
  - `EMAIL_USER`: SMTP username
  - `EMAIL_PASSWORD`: SMTP password (app password for Gmail)
  - `EMAIL_FROM`: From address (e.g., your-email@gmail.com)
- **Fallback**: If SMTP not configured, logs to console
- **Exports**: `sendOtpEmail(email, otp)` async function
- **Used by**: Registration endpoint to send OTP

#### `lib/webrtcConfig.js`
- **Purpose**: WebRTC configuration constants (STUN/TURN servers, constraints)
- **Future**: Will define ICE servers, codec preferences, bandwidth limits

#### `lib/peerConnectionHelpers.js` (Placeholder)
- **Purpose**: WebRTC peer connection utilities
- **Future**: Will handle offer/answer creation, ICE candidates, connection management

#### `lib/signalingServer.js` (Placeholder)
- **Purpose**: WebRTC signaling server logic
- **Future**: Will handle SDP exchange and ICE candidate routing between peers

---

### **Frontend Utilities** (In `app/utils/`)

#### `app/utils/auth.js`
- **Purpose**: Authentication helper functions
- **Functions** (if any):
  - Token validation
  - User info retrieval from localStorage
  - Auth state checks

#### `app/utils/db.js`
- **Purpose**: Frontend database wrapper
- **Note**: Delegates to `lib/db.js` for backend usage (mostly backend helper)

#### `app/utils/helpers.js`
- **Purpose**: General utility functions
- **Possible functions**: Date formatting, string manipulation, etc.

#### `app/utils/logout.js`
- **Purpose**: Logout handler
- **Function**: `logout()`
  - Clears `token` from localStorage
  - Clears `user` from localStorage
  - Navigates to home page `/`

---

## Data Flow & Architecture

### **Authentication Flow**
```
User Registration:
  1. User fills form (email, password, name)
  2. Frontend: POST /api/auth/register
  3. Backend: Generate OTP, send email, store OTP in DB
  4. Frontend: Show OTP input with countdown
  5. User enters OTP code
  6. Frontend: POST /api/auth/verify with email + OTP
  7. Backend: Verify OTP, hash password, create User, generate JWT
  8. Frontend: Store token + user in localStorage
  9. Redirect to /room/join

User Login:
  1. User fills form (email, password)
  2. Frontend: POST /api/auth/login
  3. Backend: Find user, verify password with bcrypt, generate JWT
  4. Frontend: Store token + user in localStorage
  5. Redirect to /room/join
```

### **Room Creation & Joining Flow**
```
Create Room:
  1. User fills form (room name, max participants)
  2. Frontend: POST /api/room/create with JWT token
  3. Backend: Delete any previous active rooms for user (one-room-per-user)
  4. Backend: Create new room with auto-generated code
  5. Backend: Add creator as first participant
  6. Frontend: Show room code on success screen (for copying)
  7. User can copy code or enter room directly

Join by Code (Recipient):
  1. User gets room code from creator (email, chat, etc.)
  2. User enters code on /room/join page
  3. Frontend: POST /api/room/join with code + JWT token
  4. Backend: Find room by code
  5. Backend: Add user to participants array
  6. Backend: If first participant, set sessionStarted=true, sessionStartedAt=now
  7. Frontend: Redirect to /room/[roomId]
  8. User enters room, media stream starts

In Room:
  1. Room page loads room details and local media
  2. Display participants, session status, room info
  3. If user is host: Show "End Room" button
  4. If user is participant: Show "Leave Room" button
  5. WebRTC signaling begins (future) for video/audio connection
  6. Host can end room: DELETE /api/room/[roomId] → all participants disconnected
  7. Participant can leave: Navigate to /room/join
```

---

## Environment Variables (.env.local)

```env
# MongoDB
MONGO_URI=mongodb://username:password@localhost:27017/watchparty
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/watchparty

# JWT Secret (for token signing/verification)
JWT_SECRET=your-secret-key-at-least-32-chars

# Email / SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # Gmail: Use app password, not regular password
EMAIL_FROM=your-email@gmail.com

# Optional: For Mailtrap (testing SMTP without real email)
# EMAIL_HOST=sandbox.smtp.mailtrap.io
# EMAIL_PORT=2525
# EMAIL_USER=your-mailtrap-user
# EMAIL_PASSWORD=your-mailtrap-password
```

---

## Key Features & Implementation Status

| Feature | Status | Files Involved |
|---------|--------|-----------------|
| User Registration with OTP | ✅ Complete | auth/register, auth/verify, models/User, models/Otp, lib/email.js |
| User Login | ✅ Complete | auth/login, models/User |
| Room Creation | ✅ Complete | room/create, models/Room |
| Room Code Generation | ✅ Complete | models/Room (uuid field) |
| Join by Code | ✅ Complete | room/join, app/api/room/join |
| One Room Per User | ✅ Complete | app/api/room/create (deleteMany logic) |
| Session Start on Join | ✅ Complete | models/Room (sessionStarted fields), room/join API |
| Host End Room | ✅ Complete | app/api/room/[roomId] (DELETE), room/[roomId] page |
| Delete from Join Page | ✅ Complete | room/join page, room/[roomId] DELETE API |
| Room Code Migration | ✅ Complete | app/api/room/migrate-codes |
| WebRTC Video/Audio | 🔄 In Progress | useWebRTCStream hook, CallWindow component |
| WebRTC Signaling | ⏳ TODO | lib/signalingServer, useWebRTCSignal hook |
| Movie Playback Sync | ⏳ TODO | Will use data channel or websocket |
| Chat/Messaging | ⏳ TODO | Data channel or new API route |

---

## How to Use This Documentation

1. **New Developer?** Start with the "Overview" and "Project Structure" sections to understand the layout.
2. **Debugging an Issue?** Look up the feature in the status table, then read the relevant "Core Files Explained" sections.
3. **Adding a Feature?** Check the "Data Flow & Architecture" diagrams to understand where your code fits.
4. **API Integration?** Copy the endpoint path from "Core Files" and check request/response formats and error cases.
5. **Frontend Development?** Look at the "Frontend Pages" and "Reusable Components" sections to understand UI patterns.

---

## Quick Reference: Common Tasks

### To Add a New API Endpoint
1. Create file: `app/api/route-name/route.js`
2. Import: `dbConnect`, any Models needed, `jwt` for auth
3. Export async function: `GET`, `POST`, `DELETE`, etc.
4. Verify JWT token from Authorization header
5. Query/modify database as needed
6. Return `NextResponse.json({ ... }, { status: 200 })`

### To Add a New Frontend Page
1. Create file: `app/feature-name/page.jsx` (or subdirectory for dynamic routes)
2. Use `'use client'` at top (for interactivity)
3. Import hooks: `useState`, `useEffect`, `useRouter`, `useParams` as needed
4. Fetch data from API routes using `fetch()` with JWT token from localStorage
5. Manage form state and error states
6. Render JSX using Tailwind CSS classes

### To Debug a Room Not Found Error
1. Ensure the room code is valid (created recently)
2. If room was created before the `code` field was added, run migration: `POST /api/room/migrate-codes`
3. Check browser console and server logs for exact error message
4. Verify user is authenticated (valid JWT token in localStorage)
5. Try creating a new room and using that code (guarantees code field exists)

### To Verify Database Connection
1. Check `.env.local` has valid `MONGO_URI` (not placeholder `<db_password>`)
2. Check server logs for connection status
3. Look for helpful error messages (auth failed, host unreachable, etc.)
4. Try connecting from MongoDB Compass with the same URI to verify manually

### To Test Email Sending
1. Configure `.env.local` with SMTP settings (Gmail, Mailtrap, etc.)
2. Restart dev server (`npm run dev`)
3. Register a new user (triggers OTP email)
4. Check email inbox or Mailtrap dashboard
5. If not received, check server logs for Nodemailer errors
6. Fallback: OTP will be logged to console if SMTP not configured

---

## Performance & Scalability Considerations

- **Database Indexing**: Room `code` field is indexed for fast lookups
- **One-room-per-user**: Deletes old rooms to prevent unlimited accumulation
- **Room Expiry**: Rooms auto-expire after 24 hours (can be cleaned up with a cron job)
- **Participant Limits**: Max 10 per room by default (configurable at creation)
- **Session Tracking**: Lightweight session state (just a timestamp) in room record
- **JWT Tokens**: Stateless, no server-side session storage needed

---

## Security Best Practices Implemented

✅ Passwords hashed with bcryptjs (not stored in plain text)
✅ JWT tokens for stateless authentication (not session cookies)
✅ HTTPS-ready (configure in production)
✅ Authorization checks (only host can end room)
✅ SQL injection prevention (Mongoose schema validation)
✅ CORS-ready (configure as needed)
✅ Password masking in logs (sensitive data not exposed)
✅ OTP expiry (5 minutes, one-time use)

---

## Next Steps & Roadmap

1. **WebRTC Integration** (High Priority):
   - Implement signaling server for peer discovery
   - Complete `useWebRTCSignal` hook
   - Set up ICE servers (STUN/TURN)

2. **Movie Playback Sync** (High Priority):
   - Add synchronized video player
   - Use WebRTC data channel or separate sync API
   - Handle play/pause/seek synchronization

3. **Enhancement Features** (Medium Priority):
   - Add chat/messaging via data channel
   - User profiles and settings
   - Room invite via email or link
   - Recording and playback history

4. **Operations** (Ongoing):
   - Set up CI/CD pipeline
   - Add end-to-end tests
   - Monitor error rates and performance
   - Scale database and signaling server as needed

---

**Last Updated**: December 7, 2025
**Project**: WatchParty (Real-time Collaborative Movie Streaming)
