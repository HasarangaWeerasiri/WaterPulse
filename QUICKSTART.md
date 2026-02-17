# 🚀 Quick Start Guide

## One-Minute Setup

### Step 1: Backend Setup (Terminal 1)
```bash
cd backend
npm run seed          # ← Creates dummy users
npm start             # ← Starts server on port 5000
```

### Step 2: Frontend Setup (Terminal 2)
```bash
cd frontend
npm run dev           # ← Starts on http://localhost:5173
```

### Step 3: Open Browser
Visit: **http://localhost:5173**

## 🔑 Demo Login Credentials

Copy & paste to test immediately:

### Citizen User
- **Email:** `citizen@test.com`
- **Password:** `password123`
- **Access:** Home dashboard, report issues, view alerts

### Authority User
- **Email:** `authority@test.com`
- **Password:** `password123`
- **Access:** Authority dashboard, manage issues

### Admin User
- **Email:** `admin@test.com`
- **Password:** `password123`
- **Access:** Admin dashboard, create users

## 📱 Test Flows

### 1. Register as Citizen
1. Click "Create New Account"
2. Fill in details (any valid email, password123)
3. Auto-login, redirected to `/home`
4. See citizen dashboard

### 2. Test Admin Features
1. Login with `admin@test.com`
2. Click "Create Admin/Authority" tab
3. Fill form to create new authority user
4. Success message confirms creation

### 3. Test Authority Features
1. Login with `authority@test.com`
2. View dashboard with district info
3. Click "Manage Issues" tab
4. See sample water issues to manage

## 🔍 Key Features to Test

| Feature | How to Test | Expected Result |
|---------|------------|-----------------|
| Signup | Register page → fill form → submit | Redirect to `/home` |
| Login | Try wrong password | Error message shown |
| Role-based redirect | Login as admin/authority/citizen | Different dashboard |
| Logout | Click logout button | Redirected to `/login` |
| Protected routes | Manually visit `/admin-dashboard` as citizen | Redirect to unauthorized |
| Session persistence | Refresh page while logged in | Stay logged in |

## 🛠️ Troubleshooting

**Issue:** Can't connect to MongoDB
- **Fix:** Check `MONGO_URI` in `.env`
- Check network access credentials

**Issue:** Backend won't start
- **Fix:** Run `npm install` in backend folder
- Ensure port 5000 is free

**Issue:** Frontend won't load
- **Fix:** Run `npm install` in frontend folder
- Check `http://localhost:5173` not 5000

**Issue:** Login fails
- **Fix:** Run `npm run seed` to create demo users
- Check browser console for error details

## 📂 Important Files

### Backend
- **server.js** - Main Express server & routes setup
- **controllers/authController.js** - Login/register logic
- **middleware/authMiddleware.js** - JWT verification
- **seed.js** - Creates dummy data

### Frontend
- **App.jsx** - Route configuration
- **context/AuthContext.jsx** - Auth state management
- **pages/user/LoginPage.jsx** - Login UI
- **pages/dashboard/** - Role-based dashboards

## ✅ Next Steps

After confirming everything works:

1. **Add more features** to dashboard (your custom features)
2. **Connect real database** (update MONGO_URI)
3. **Deploy** (Vercel for frontend, Heroku for backend)
4. **Implement** additional endpoints (reports, alerts, etc)

## 🆘 Need Help?

Check these files for documentation:
- `SETUP_GUIDE.md` - Detailed setup & API docs
- `backend/server.js` - Backend structure
- `frontend/src/context/AuthContext.jsx` - Frontend auth logic

---

**You're all set! Happy developing! 🎉**
