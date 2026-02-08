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
3. **Firestore Database**: create database (Production or Test mode) and deploy `firestore.rules`.
4. Confirm `firebase-config.js` matches the same Firebase project used for Auth + Firestore.
5. If signup says error, check if the account was still created in Firebase Authentication (profile write can fail separately if Firestore is not ready).

## Admin account

Create the admin account securely in Firebase Auth (Email/Password), then assign admin custom claim using Firebase Admin SDK or Cloud Functions.

- Admin name: Divit Bansal
- Initial password placeholder: `root123` (change immediately in production)

Never store admin credentials in frontend code.

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
