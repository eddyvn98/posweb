# Firebase Hosting Deployment Guide

## Step 1: Setup Firebase Project

### 1.1 Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Create a project" or "Add project"
3. Project name: `OpenPOS` (or your name)
4. Accept default settings
5. Click "Create project" (wait 1-2 min)

### 1.2 Get Project ID
After creation, you'll see your project ID at the top.

Example: `openos-12345`

### 1.3 Update .firebaserc
Edit `.firebaserc` in project root:
```json
{
  "projects": {
    "default": "openos-12345"
  }
}
```

Replace `openos-12345` with your actual project ID.

---

## Step 2: Install Firebase CLI

### Windows (PowerShell as Admin)
```powershell
npm install -g firebase-tools
```

### Verify Installation
```bash
firebase --version
```

---

## Step 3: Login to Firebase

```bash
firebase login
```

This opens browser for authentication. Sign in with your Google account.

---

## Step 4: Add Environment Variables

Create `.env.production` (DO NOT commit):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get these from Supabase: https://supabase.com → Dashboard → Settings → API

---

## Step 5: Build for Production

```bash
npm run build
```

This creates `dist/` folder with optimized code.

---

## Step 6: Deploy to Firebase

```bash
firebase deploy
```

Deployment takes 30-60 seconds.

**Success Output:**
```
✔  Deploy complete!
✔  Hosting URL: https://openos-12345.web.app
✔  Site URL: https://openos-12345.firebaseapp.com
```

---

## Step 7: Test Production

Visit your deployment URL and test:
- [ ] App loads
- [ ] Login works
- [ ] Main features work (Bán, Sản phẩm, Báo cáo)
- [ ] Mobile bottom bar works
- [ ] No console errors (F12)

---

## Environment Variables Setup

Firebase uses `.env.production` for build time variables.

### Create `.env.production`
```env
VITE_SUPABASE_URL=https://cwrguitcveqofbelewrn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cmd1aXRjdmVxb2ZiZWxld3JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mjc2MzIsImV4cCI6MjA4MzIwMzYzMn0.VZSSzR92meXp4WYA9sDQgyiTgdzSWBDpsACrUIxppgc
```

---

## Deployment Checklist

- [ ] `.firebaserc` updated with project ID
- [ ] `firebase-tools` installed globally
- [ ] `firebase login` done
- [ ] `.env.production` configured
- [ ] `npm run build` succeeds
- [ ] No errors in `dist/` folder
- [ ] `firebase deploy` succeeds
- [ ] App works on Firebase URL

---

## Redeploy After Changes

Every time you change code:

```bash
# 1. Build
npm run build

# 2. Deploy
firebase deploy
```

That's it! Firebase auto-uploads dist/ folder.

---

## Useful Firebase Commands

### Check Project
```bash
firebase projects:list
```

### View Hosting Logs
```bash
firebase hosting:disable
firebase hosting:enable
```

### Delete Deployment (if needed)
```bash
firebase hosting:delete
```

---

## Troubleshooting

### Firebase Not Found
```bash
firebase --version
# If not recognized, install globally:
npm install -g firebase-tools
```

### Login Issues
```bash
firebase logout
firebase login
```

### Build Fails
```bash
# Check Node version
node --version  # Should be 18+

# Clear cache
npm cache clean --force
npm ci  # Clean install

# Try build again
npm run build
```

### Already Deployed Somewhere Else
Just run `firebase deploy` - it will overwrite previous version.

---

## Custom Domain (Optional)

After first deployment:

1. Firebase Console → Hosting → Connect domain
2. Add your custom domain
3. Add DNS records (Firebase will show them)
4. Wait 24 hours for propagation

---

## Summary

**Quick Deploy:**
```bash
npm run build
firebase deploy
```

**URL:** https://your-project-id.web.app

Done! 🚀
