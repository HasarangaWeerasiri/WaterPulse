# 🚀 GETTING STARTED - WATERPULSE

## ⏱️ Time to Get Running: 5 Minutes

---

## STEP 1: Open Two Terminals

### Terminal 1 → Backend
```bash
cd c:\Users\amindu\Desktop\Other\Projects\WaterPulse\WaterPulse\backend
```

### Terminal 2 → Frontend
```bash
cd c:\Users\amindu\Desktop\Other\Projects\WaterPulse\WaterPulse\frontend
```

---

## STEP 2: Start Backend (Terminal 1)

```bash
npm run seed
npm start
```

**Expected Output:**
```
✓ Created 5 dummy users
✓ Citizen: citizen@test.com
✓ Authority: authority@test.com
✓ Admin: admin@test.com

Server is running on port 5000
```

**Note:** If seed fails, that's okay - backend still starts. Just skip to login.

---

## STEP 3: Start Frontend (Terminal 2)

```bash
npm run dev
```

**Expected Output:**
```
VITE v7.3.1  ready in 1234 ms

➜  Local:   http://localhost:5173/
```

---

## STEP 4: Open Browser

```
http://localhost:5173
```

You should see the WaterPulse login page! ✅

---

## STEP 5: Login & Test

### Test as Citizen
1. Email: `citizen@test.com`
2. Password: `password123`
3. Click "Sign In"
4. You'll see the **Citizen Home Dashboard** ✅

### Test as Authority
1. Logout (click Logout button)
2. Email: `authority@test.com`
3. Password: `password123`
4. You'll see the **Authority Dashboard** ✅

### Test as Admin
1. Logout
2. Email: `admin@test.com`
3. Password: `password123`
4. You'll see the **Admin Dashboard** ✅

---

## 🎯 Try These Features

### As Citizen
- [ ] Click "Report Issue" tab → Fill form
- [ ] Click "My Reports" tab → See samples
- [ ] Click "Alerts" tab → See notifications
- [ ] Logout → Redirected to login

### As Authority
- [ ] View dashboard overview
- [ ] Click "Manage Issues" → See issue list
- [ ] Try taking action on issues

### As Admin
- [ ] View dashboard overview
- [ ] Click "Create Admin/Authority" tab
- [ ] Try creating a new authority user
- [ ] Fill form & submit

---

## 📝 Try Registration

1. At login page, click "Create New Account"
2. Fill in any details (new email required)
3. Password: `password123`
4. Click "Create Account"
5. **Auto-login as citizen** → See home dashboard ✅

---

## ✅ What's Working

- ✅ JWT Authentication
- ✅ Password Hashing
- ✅ Role-Based Access
- ✅ Session Persistence
- ✅ Modern UI
- ✅ All Dashboards
- ✅ Form Validation
- ✅ Error Handling

---

## 🐛 Trouble? Try This

### Backend won't start
```bash
# In terminal 1
cd backend
npm install    # Make sure dependencies installed
npm start
```

### Frontend won't load
```bash
# In terminal 2
cd frontend
npm install    # Make sure dependencies installed
npm run dev
```

### Login fails
1. Check backend console for errors
2. Try demo credentials exactly as shown
3. Open DevTools (F12) → Console → Check errors

### Can't connect to MongoDB
- That's OK for testing locally - seed may fail but backend still works
- Test with demo credentials anyway

---

## 📚 Read These Next

After confirming everything works, read these in order:

1. **QUICKSTART.md** - More detailed quick start
2. **SETUP_GUIDE.md** - Complete documentation
3. **STATUS.md** - What was completed

---

## 🔧 Useful Commands

```bash
# Backend - Create demo users
npm run seed

# Backend - Start server
npm start

# Frontend - Start dev server
npm run dev

# Frontend - Build for production
npm run build

# Check both services are running
# Backend: http://localhost:5000/api/health
# Frontend: http://localhost:5173
```

---

## 💾 If You Want to Reset

```bash
# Clear all demo data
cd backend
npm run seed     # Creates fresh demo users

# Clear token from browser
# Open DevTools (F12) → Application → LocalStorage → Remove token
# Or just logout
```

---

## 🎓 Understanding the Flow

### Simple User Journey
```
Open Browser
    ↓
Login Page Appears
    ↓
Enter Credentials (citizen@test.com / password123)
    ↓
Backend Verifies Password
    ↓
Backend Creates JWT Token
    ↓
Token Sent to Browser
    ↓
Browser Stores in LocalStorage
    ↓
Redirected to Citizen Dashboard
    ↓
All API Calls Include Token
    ↓
You Can Browse Dashboards
```

---

## 🔐 Where Password Security Happens

1. **Registration** → Password hashed with bcrypt before storing
2. **Login** → Input password compared with hashed password
3. **Token** → Only token stored on browser (not password!)
4. **API Calls** → Token (not password) sent with each request
5. **Server** → Server verifies token signature

---

## 🚀 Ready to Extend?

Once everything works, you can:

1. Add real issue reporting
2. Connect real database credentials
3. Add more features to dashboards
4. Deploy to production
5. Add more user roles
6. Create admin features

**See SETUP_GUIDE.md for production checklist**

---

## 📞 Quick Reference

| What | Where |
|------|-------|
| Login instructions | This file (above) |
| Detailed setup | SETUP_GUIDE.md |
| Fast start | QUICKSTART.md |
| Project info | README.md |
| Completion details | COMPLETION.md |
| API testing | WaterPulse_API.postman_collection.json |

---

## 🎉 You're All Set!

Follow the 5 steps above and you'll have:
- ✅ Running backend
- ✅ Running frontend  
- ✅ Working login
- ✅ Three dashboards
- ✅ Demo accounts

**Go to Step 1 now!** 👆

---

**Happy coding!** 🚀
