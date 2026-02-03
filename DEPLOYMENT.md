# Deployment Guide

This guide walks through deploying the Ultimate Frisbee Stats application to production using:
- **Vercel** for the frontend (React PWA)
- **Render** for the backend (FastAPI)
- **Supabase** for the database (PostgreSQL)

**Total Cost: FREE** (all services on free tier)

**⚠️ Note on Render Free Tier:**
- Backend spins down after 15 minutes of inactivity
- First request after inactivity takes ~30 seconds to wake up ("cold start")
- Subsequent requests are instant once the server is running
- Acceptable for personal/team use, but not ideal for high-traffic production

## Prerequisites

- GitHub account
- Git repository with this code
- Accounts created on:
  - [Supabase](https://supabase.com) (free)
  - [Render](https://render.com) (free tier)
  - [Vercel](https://vercel.com) (free)

## Step 1: Set Up Supabase (Database)

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
   - Choose a project name
   - Set a strong database password (save it!)
   - Choose a region close to your users (Europe for France)
3. Wait for the database to provision (~2 minutes)
4. Get your connection string:
   - Go to **Project Settings** → **Database**
   - Find **Connection string** → **URI**
   - Copy the connection string (it looks like: `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres`)
   - **Save this** - you'll need it for Render

## Step 2: Deploy Backend to Render

1. Go to [render.com](https://render.com) and sign up with GitHub
2. Click **New +** → **Web Service**
3. Connect your GitHub repository and select it
4. Configure the service:
   - **Name**: `ultimate-frisbee-stats-backend` (or your choice)
   - **Region**: Choose closest to you (e.g., Frankfurt for Europe)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: **Free**

5. Click **Advanced** and add Environment Variables:
   ```
   DATABASE_URL=<your Supabase connection string from Step 1>
   FRONTEND_URL=https://your-app.vercel.app
   ```
   (We'll update FRONTEND_URL after deploying to Vercel in Step 3)

6. Click **Create Web Service**
7. Render will automatically build and deploy (takes ~2-3 minutes)
8. Once deployed, copy your Render URL from the dashboard
9. **Save your Render URL** (e.g., `https://ultimate-frisbee-stats-backend.onrender.com`)

## Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     ```
     VITE_API_BASE_URL=<your Render backend URL from Step 2>
     ```
     Example: `VITE_API_BASE_URL=https://ultimate-frisbee-stats-backend.onrender.com`

5. Click **Deploy**
6. Once deployed, Vercel will give you a URL (e.g., `https://your-app.vercel.app`)

## Step 4: Update Backend CORS

1. Go back to **Render**
2. Go to your backend service → **Environment** tab
3. Update the `FRONTEND_URL` environment variable with your Vercel URL:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
4. Click **Save Changes** - Render will automatically redeploy

## Step 5: Test Your Deployment

1. Open your Vercel URL in a browser
2. Try creating a team, competition, and game
3. Track some points
4. View statistics

**Your app is live!** 🎉

## Automatic Deployments

Both Vercel and Render are now connected to your GitHub repository:
- **Push to `main`** → Both services automatically redeploy
- **No manual deployment needed**

## Environment Variables Summary

### Backend (Render)
```bash
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend (Vercel)
```bash
VITE_API_BASE_URL=https://ultimate-frisbee-stats-backend.onrender.com
```

## Costs

- **Supabase**: Free (500MB database, plenty for your needs)
- **Render**: Free (with cold starts after 15 min inactivity, 750 hours/month)
- **Vercel**: Free (100GB bandwidth, more than enough)

**Total: FREE** 🎉

### Render Free Tier Limitations

**Cold Starts:**
- Server spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds to wake up
- Once running, all subsequent requests are instant

**Keeping Server Awake (Optional):**
- Use a free cron service (e.g., cron-job.org) to ping your API every 14 minutes
- Example ping URL: `https://your-backend.onrender.com/docs`
- Recommended for game days when you need instant response

**Upgrade to Paid Plan:**
- Render Starter: $7/month for always-on, no cold starts
- Consider if cold starts become too annoying

## Local Development

Your local setup still works with SQLite:

```bash
# Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# Frontend
cd frontend
npm run dev
```

No environment variables needed for local development - defaults to SQLite and localhost.

## Troubleshooting

### "CORS error" in browser console
- Check that `FRONTEND_URL` in Render matches your Vercel URL
- Ensure Render redeployed after changing the variable

### "Database connection failed"
- Verify `DATABASE_URL` in Render is correct
- Check Supabase project is running
- Ensure connection string uses `postgresql://` (not `postgres://`)

### "API not found" errors
- Verify `VITE_API_BASE_URL` in Vercel points to Render backend
- Check Render backend is deployed and running
- Test Render API directly: `https://your-backend.onrender.com/docs`

### "Slow loading / 30 second delays"
- This is normal on Render's free tier (cold start after inactivity)
- See "Keeping Server Awake" section above for solutions
- Consider upgrading to Render Starter ($7/month) for always-on service

## Custom Domain (Optional)

### Frontend (Vercel)
1. Go to Vercel project **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. Update `FRONTEND_URL` in Railway to use new domain

### Backend (Railway)
1. Go to Railway project **Settings** → **Networking**
2. Add custom domain
3. Update DNS records as instructed
4. Update `VITE_API_BASE_URL` in Vercel to use new domain

## Database Backups

Supabase automatically backs up your database daily. To download a backup:
1. Go to Supabase project **Database** → **Backups**
2. Download the latest backup

## Monitoring

### Railway Logs
- View backend logs in Railway dashboard
- Check for errors during deployments

### Vercel Logs
- View frontend deployment logs in Vercel dashboard
- Check build errors if deployment fails

### Supabase Metrics
- Monitor database size and connections in Supabase dashboard
- Free tier: 500MB storage, 2GB bandwidth/month
