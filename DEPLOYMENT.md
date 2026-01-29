# Deployment Guide

This guide walks through deploying the Ultimate Frisbee Stats application to production using:
- **Vercel** for the frontend (React PWA)
- **Railway** for the backend (FastAPI)
- **Supabase** for the database (PostgreSQL)

**Total Cost: $5/month** (Railway backend only, others free)

## Prerequisites

- GitHub account
- Git repository with this code
- Accounts created on:
  - [Supabase](https://supabase.com) (free)
  - [Railway](https://railway.app) (free tier available)
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
   - **Save this** - you'll need it for Railway

## Step 2: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Connect your repository and select it
4. Railway will detect it's a Python app
5. Configure the service:
   - Click on your service
   - Go to **Settings** → **Root Directory** → Set to `backend`
   - Go to **Variables** tab and add:
     ```
     DATABASE_URL=<your Supabase connection string from Step 1>
     FRONTEND_URL=https://your-app.vercel.app
     ```
     (We'll update FRONTEND_URL after deploying to Vercel in Step 3)

6. Railway will automatically deploy
7. Once deployed, go to **Settings** → **Networking** → **Generate Domain**
8. **Save your Railway URL** (e.g., `https://your-backend.up.railway.app`)

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
     VITE_API_BASE_URL=<your Railway backend URL from Step 2>
     ```
     Example: `VITE_API_BASE_URL=https://your-backend.up.railway.app`

5. Click **Deploy**
6. Once deployed, Vercel will give you a URL (e.g., `https://your-app.vercel.app`)

## Step 4: Update Backend CORS

1. Go back to **Railway**
2. Update the `FRONTEND_URL` environment variable with your Vercel URL:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
3. Railway will automatically redeploy with the new variable

## Step 5: Test Your Deployment

1. Open your Vercel URL in a browser
2. Try creating a team, competition, and game
3. Track some points
4. View statistics

**Your app is live!** 🎉

## Automatic Deployments

Both Vercel and Railway are now connected to your GitHub repository:
- **Push to `main`** → Both services automatically redeploy
- **No manual deployment needed**

## Environment Variables Summary

### Backend (Railway)
```bash
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend (Vercel)
```bash
VITE_API_BASE_URL=https://your-backend.up.railway.app
```

## Costs

- **Supabase**: Free (500MB database, plenty for your needs)
- **Railway**: $5/month (includes $5 free credit, so essentially free for first month)
- **Vercel**: Free (100GB bandwidth, more than enough)

**Total: $5/month**

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
- Check that `FRONTEND_URL` in Railway matches your Vercel URL
- Ensure Railway redeployed after changing the variable

### "Database connection failed"
- Verify `DATABASE_URL` in Railway is correct
- Check Supabase project is running
- Ensure connection string uses `postgresql://` (not `postgres://`)

### "API not found" errors
- Verify `VITE_API_BASE_URL` in Vercel points to Railway backend
- Check Railway backend is deployed and running
- Test Railway API directly: `https://your-backend.up.railway.app`

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
