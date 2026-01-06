# Quick Firebase Deployment (3 Steps)

## Step 1: Setup (5 mins)

```bash
# Install Firebase CLI (run once)
npm install -g firebase-tools

# Login
firebase login

# Edit .firebaserc - replace YOUR_FIREBASE_PROJECT_ID
# Get ID from: https://console.firebase.google.com
```

## Step 2: Build (2 mins)

```bash
npm run build
```

## Step 3: Deploy (1 min)

```bash
firebase deploy
```

**Done!** Your app is live at: `https://YOUR_PROJECT_ID.web.app`

---

See `FIREBASE_DEPLOYMENT.md` for detailed guide.
