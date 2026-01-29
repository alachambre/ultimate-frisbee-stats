# Deployment Status

**Last Updated**: 2026-01-29

## Current Status: Waiting for Railway GitHub OAuth Fix

Railway is experiencing GitHub OAuth issues. We're paused at Step 3 (Deploy Backend to Railway).

---

## ✅ What's Done

### Task 1: Code Preparation ✅
- Backend configured for PostgreSQL (psycopg2-binary already installed)
- `database.py` handles Supabase connection strings (postgres:// → postgresql://)
- CORS configured via `FRONTEND_URL` environment variable
- Procfile created for Railway deployment
- `.env.example` files created for backend and frontend
- `DEPLOYMENT.md` guide created with full instructions
- All changes committed and pushed to GitHub

### Task 2: Supabase Database ✅
- Supabase account created
- PostgreSQL database provisioned (EU-West region)
- Connection string obtained and saved
- **You have**: `postgresql://postgres.[ref]:[password]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`

---

## 🔄 What's In Progress

### Task 3: Deploy Backend to Railway (BLOCKED - GitHub OAuth Issue)

**Issue**: Railway's GitHub OAuth is currently broken (as of today)

**Workaround**: Login with email (✅ done), but need to connect GitHub account afterward

**When Railway OAuth is fixed, do this:**

1. **Connect GitHub to Railway:**
   - In Railway dashboard → Profile icon (top right) → **Account Settings**
   - Find **Connected Accounts** or **Integrations**
   - Click **Connect GitHub** → Authorize Railway

2. **Create New Project:**
   - Click **New Project** → **Deploy from GitHub repo**
   - Select **ultimate-frisbee-stats**

3. **Configure Root Directory:**
   - Click on service → **Settings** tab
   - **Root Directory**: Change from `/` to **`backend`**

4. **Add Environment Variables** (Variables tab):
   ```bash
   DATABASE_URL=<your Supabase connection string>
   FRONTEND_URL=http://localhost:5173
   ```
   (We'll update FRONTEND_URL after deploying frontend)

5. **Wait for Deployment** (2-3 minutes)
   - Watch logs for "Build successful" and "Deployment successful"

6. **Generate Domain:**
   - Settings → Networking → **Generate Domain**
   - Save the URL (e.g., `https://ultimate-frisbee-stats-production.up.railway.app`)

7. **Test Backend:**
   - Open Railway URL in browser
   - Should see: `{"message": "Ultimate Frisbee Stats API", "version": "1.0.0"}`

---

## ⏳ What's Next (After Railway Backend is Deployed)

### Task 4: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → Login with GitHub
2. **New Project** → Import **ultimate-frisbee-stats**
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variable**:
     ```bash
     VITE_API_BASE_URL=<your Railway backend URL>
     ```
4. Click **Deploy**
5. Save your Vercel URL (e.g., `https://ultimate-frisbee-stats.vercel.app`)

### Task 5: Update Backend CORS

1. Go back to Railway
2. Update `FRONTEND_URL` variable to your Vercel URL
3. Railway will auto-redeploy

### Task 6: Test Everything

1. Open Vercel URL
2. Create team, competition, game
3. Track points
4. View statistics

---

## Important Information to Keep

### Supabase Connection String
```
postgresql://postgres.[ref]:[password]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```
(You have this saved somewhere safe)

### GitHub Repository
- Repo: `alachambre/ultimate-frisbee-stats` (or your repo name)
- Branch: `main`
- Latest commit: `dd80342` - "Prepare backend and frontend for production deployment"

### Railway Account
- Login method: Email (GitHub OAuth broken, need to connect later)
- Status: Waiting to connect GitHub

### Files Ready for Deployment
- `backend/Procfile` - Tells Railway how to run the app
- `backend/.env.example` - Documents environment variables
- `frontend/.env.example` - Documents frontend variables
- `DEPLOYMENT.md` - Complete step-by-step guide

---

## Quick Resume Instructions

**When Railway GitHub OAuth is fixed:**

1. ✅ Login to Railway (you already have account with email)
2. Connect GitHub account (Settings → Connected Accounts)
3. Follow "Task 3" steps above to deploy backend
4. Get Railway backend URL
5. Deploy frontend to Vercel with Railway URL
6. Update CORS in Railway with Vercel URL
7. Test! 🎉

---

## Estimated Time Remaining

- Railway backend deployment: 10 minutes
- Vercel frontend deployment: 5 minutes
- Final testing: 5 minutes

**Total: ~20 minutes** (once Railway OAuth is working)

---

## Helpful Links

- **Full Guide**: `DEPLOYMENT.md`
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Railway Dashboard**: https://railway.app/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Status**: Check if others report Railway OAuth issues

---

## Notes

- Local development still works perfectly with SQLite (no changes needed)
- All tests passing (266 frontend, 357 backend)
- Code is production-ready, just waiting on Railway OAuth fix
- Expected total cost: **$5/month** (Railway only, others free)
