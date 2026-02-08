# Affiliate Start Website

Modern conversion-focused course site with Firebase Authentication, Firestore-backed plan purchases, and a restricted admin workflow.

## Features

- Mobile-first landing page with trust-focused copy and honest messaging.
- Plans: Free (₹0), Basic (₹10), Plus (₹50), Pro (₹150).
- Clear note that **every paid plan includes the full course**.
- UPI transaction submission and manual verification workflow.
- Role-aware interface:
  - Guest: landing + free content only.
  - User: paid content only when payment is approved.
  - Admin: transaction verification panel.
- Generic authentication error messages to avoid account enumeration.
- Firestore Security Rules for server-side enforcement.

## Setup

1. Create a Firebase project.
2. Enable Email/Password authentication.
3. Copy `firebase-config.example.js` to `firebase-config.js` and fill credentials.
4. Deploy Firestore rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
5. Host static site.


## GitHub Pages deployment (fixes 404)

If you are seeing a GitHub Pages **404 File not found**, it usually means Pages is not publishing this repository root yet.

This repo now includes:
- `.github/workflows/deploy-pages.yml` to deploy the project root via GitHub Actions Pages.
- `.nojekyll` to avoid Jekyll processing side effects.

Steps:
1. Push your branch to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Wait for the `Deploy static site to GitHub Pages` workflow to finish.
4. Open your Pages URL again.

5. If it still shows 404, check **Actions** tab and confirm the `Deploy static site to GitHub Pages` workflow completed successfully.
6. Use the correct URL format:
   - User/Org site: `https://<username>.github.io/`
   - Project site: `https://<username>.github.io/<repo-name>/`

This repo also deploys a `404.html` fallback (same as `index.html`) to reduce route-level 404 issues on direct URL access.

## If login/signup shows generic auth error

The UI intentionally shows a generic message for security. To debug safely, open browser console and check `[auth:*]` error codes.

Checklist:
1. **Authentication → Sign-in method**: Email/Password must be enabled.
2. **Authentication → Settings → Authorized domains**: add your deployed domain (e.g. `<username>.github.io`) and any custom domain.
3. **Google Cloud Console → APIs & Services**: ensure **Identity Toolkit API** is enabled for this Firebase project.
4. If API key restrictions are enabled, allow your web referrer domain (`https://<username>.github.io/*`) or temporarily remove restrictions for testing.
5. **Firestore Database**: create database (Production or Test mode) and deploy `firestore.rules`.
6. Confirm `firebase-config.js` matches the same Firebase project used for Auth + Firestore.
7. If signup says error, check if the account was still created in Firebase Authentication (profile write can fail separately if Firestore is not ready).


Quick mapping for debug codes:
- `auth/unauthorized-domain` → Add your exact host to **Authorized domains** (for GitHub Pages usually `username.github.io`).
- `auth/operation-not-allowed` → Enable **Email/Password** provider.
- `auth/app-not-authorized` or `auth/invalid-api-key` → Check API key restrictions and project config mismatch.


If you still get errors, read the **Debug code** shown under the login message and apply the matching fix immediately:
- `auth/unauthorized-domain`: add your current host in Authorized domains.
- `auth/operation-not-allowed`: enable Email/Password provider.
- `auth/app-not-authorized` or `auth/invalid-api-key`: fix API key restrictions/project mismatch.

## Admin account

Use the secure server-side bootstrap script to create/update the admin and apply custom claim `admin: true`.

### Required admin credentials (as requested)
- Admin name: `DivitNAdmin7`
- Admin password: `rootpassadmin142637`
- Admin login email (required by Firebase Auth): `DivitNAdmin7@gmail.com`

### Step-by-step setup (do this locally, not in browser)
1. In Firebase Console, open **Project Settings → Service accounts**.
2. Click **Generate new private key** and save as `serviceAccountKey.json` in repo root (gitignored).
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create/update admin user and claim:
   ```bash
   SERVICE_ACCOUNT_PATH=./serviceAccountKey.json \
ADMIN_EMAIL=DivitNAdmin7@gmail.com \
ADMIN_PASSWORD='rootpassadmin142637' \
ADMIN_DISPLAY_NAME='DivitNAdmin7' \
npm run admin:create
   ```
5. Verify user exists + admin claim:
   ```bash
   SERVICE_ACCOUNT_PATH=./serviceAccountKey.json \
ADMIN_EMAIL=DivitNAdmin7@gmail.com \
npm run admin:check
   ```
   Expected output includes:
   - `Admin user found.`
   - `admin claim: true`
6. Login on website with:
   - Email: `DivitNAdmin7@gmail.com`
   - Password: `rootpassadmin142637`


PowerShell (Windows) equivalent:
```powershell
$env:SERVICE_ACCOUNT_PATH = "./serviceAccountKey.json"
$env:ADMIN_EMAIL = "DivitNAdmin7@gmail.com"
$env:ADMIN_PASSWORD = "rootpassadmin142637"
$env:ADMIN_DISPLAY_NAME = "DivitNAdmin7"
npm run admin:create
npm run admin:check
```

If still not visible in Firebase Authentication list:
- Make sure service account belongs to the **same project** as `firebase-config.js` (`course-1-66b94`).
- Hard refresh Firebase Console users page.
- Re-run `npm run admin:create` then `npm run admin:check`.

Notes:
- Admin route visibility in UI depends on Firebase custom claim `admin: true`.
- Keep admin credentials private and rotate password after first successful login.

## Firestore data model

- `users/{uid}`
  - `email`, `displayName`, `role`, `createdAt`
- `purchases/{uid}`
  - `uid`, `plan`, `transactionId`, `status`, `updatedAt`, `verifiedAt`
- `courseContent/{docId}`
  - `tier: "free" | "paid"`, `title`, `body`

## Security notes

- Passwords are handled only by Firebase Auth and never stored in plaintext.
- Access control is based on auth state + Firestore rules + custom admin claim.
- No localStorage-based authorization logic is used.
