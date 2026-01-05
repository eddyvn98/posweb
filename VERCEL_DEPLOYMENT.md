# 🚀 Vercel Deployment Guide

## Prerequisites
- GitHub account with repo: https://github.com/eddyvn98/posweb
- Vercel account: https://vercel.com
- Supabase project with connection details
- Google OAuth Client ID

## Step 1: Push to GitHub

```bash
cd d:\posweb
git add .
git commit -m "feat: Google Drive Backup (EPIC 10) - Production Ready"
git remote add origin https://github.com/eddyvn98/posweb.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

### Via Web Dashboard
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import Git Repository
4. Select: **eddyvn98/posweb**
5. Click "Import"

### Configure Environment Variables
In Project Settings → Environment Variables, add:

```
VITE_GOOGLE_CLIENT_ID = YOUR_CLIENT_ID.apps.googleusercontent.com
VITE_SUPABASE_URL = https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY = your-anon-key
```

### Build Settings (should auto-detect)
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## Step 3: Custom Domain (Optional)

1. In Vercel Project Settings → Domains
2. Add your domain: `yourdomain.com`
3. Update Google OAuth in Google Console:
   - Add: `https://yourdomain.com`
   - Add: `https://www.yourdomain.com`

## Step 4: Post-Deployment

### Update Google OAuth for Production
1. Go to Google Cloud Console
2. Update OAuth Credential with production URLs:
   ```
   https://posweb.vercel.app
   https://yourdomain.com
   ```

### Test on Production
1. Visit deployed app
2. Test Settings → Google Drive Backup
3. Test export → Drive backup flow
4. Check backup_logs in Supabase

## Environment Variables Checklist

- [ ] VITE_GOOGLE_CLIENT_ID (from Google Cloud)
- [ ] VITE_SUPABASE_URL (from Supabase dashboard)
- [ ] VITE_SUPABASE_ANON_KEY (from Supabase dashboard)

## Deployment Verification

After deployment, verify:

✅ App loads without 404 errors
✅ Login works
✅ Settings page loads
✅ Google Drive Backup section visible
✅ Can click "Sign in with Google"
✅ Export → Drive backup works
✅ Console has no errors (F12)
✅ Supabase backup_logs table receives entries

## Troubleshooting

### Build fails
```bash
npm run build  # Test locally first
```

### Environment variables not loaded
- Check Vercel Project Settings
- Redeploy: Settings → Deployments → ... → Redeploy

### Google OAuth not working
- Check `VITE_GOOGLE_CLIENT_ID` in Vercel env vars
- Verify domain in Google Console OAuth settings

### Supabase connection error
- Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Verify network access in Supabase settings

## Performance Tips

- Images are optimized by Vercel CDN
- Code splitting handled by Vite
- Monitor Analytics in Vercel dashboard

## Monitoring

After deployment, monitor:
- Vercel Analytics dashboard
- Supabase database logs
- Error tracking (Vercel Monitoring)

---

**Status**: Ready to deploy
**Estimated Deployment Time**: 5-10 minutes
**Roll-back**: Vercel automatically keeps previous deployments
