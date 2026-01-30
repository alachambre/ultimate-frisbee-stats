# Deployment Status

**Last Updated**: 2026-01-30

## Current Status: ✅ DEPLOYED AND LIVE

The application is fully deployed and operational!

---

## 🌐 Live URLs

- **Frontend**: https://ultimate-frisbee-stats.vercel.app (or your custom Vercel URL)
- **Backend**: https://ultimate-frisbee-stats-production.up.railway.app

---

## ✅ Deployment Complete

### Infrastructure
- **Frontend**: Vercel (React PWA)
- **Backend**: Railway (FastAPI)
- **Database**: Supabase (PostgreSQL)

### Environment Variables

#### Railway (Backend)
```bash
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
FRONTEND_URL=https://ultimate-frisbee-stats.vercel.app
```

#### Vercel (Frontend)
```bash
VITE_API_BASE_URL=https://ultimate-frisbee-stats-production.up.railway.app
```

---

## 🔧 Issues Fixed During Deployment

1. **Supabase connection**: Use Transaction Pooler URL (port 6543) not Direct connection (port 5432)
2. **TypeScript build errors**: Fixed unused imports and MUI Grid v7 API (`item` → `size`)
3. **SPA routing on Vercel**: Added `vercel.json` with rewrites for client-side routing
4. **CORS errors**: Set `FRONTEND_URL` with `https://` prefix in Railway
5. **API service hardcoded URLs**: Fixed `statistics.ts`, `calls.ts`, `turnovers.ts` to use shared `apiClient`
6. **PostgreSQL compatibility**: Fixed `player_number` sorting with `None` values
7. **Response schema validation**: Made `player_number` optional in `PlayerGameStats` schema

---

## 📊 Costs

| Service | Cost |
|---------|------|
| Supabase | Free (500MB database) |
| Railway | ~$5/month |
| Vercel | Free (100GB bandwidth) |
| **Total** | **~$5/month** |

---

## 🔄 Auto-Deployment

Both platforms auto-deploy when you push to `main`:
- Push to GitHub → Railway rebuilds backend
- Push to GitHub → Vercel rebuilds frontend

---

## 🧪 Local Development

Local development still works with SQLite (no changes needed):

```bash
# Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# Frontend
cd frontend
npm run dev
```

---

## 📋 Useful Links

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Railway Dashboard**: https://railway.app/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Repo**: https://github.com/alachambre/ultimate-frisbee-stats
