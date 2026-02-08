/**
 * Verify admin user + claim server-side.
 *
 * Usage:
 *   SERVICE_ACCOUNT_PATH=./serviceAccountKey.json \
 *   ADMIN_EMAIL=DivitNAdmin7@gmail.com \
 *   node scripts/check-admin.mjs
 */

import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH;
if (!serviceAccountPath) {
  throw new Error("Missing SERVICE_ACCOUNT_PATH env var.");
}

const adminEmail = process.env.ADMIN_EMAIL || "DivitNAdmin7@gmail.com";

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();

try {
  const user = await auth.getUserByEmail(adminEmail);
  const isAdmin = Boolean(user.customClaims?.admin);

  console.log("Admin user found.");
  console.log(`Email: ${user.email}`);
  console.log(`UID: ${user.uid}`);
  console.log(`admin claim: ${isAdmin}`);

  if (!isAdmin) {
    console.error("User exists but admin claim is missing. Run create-admin script again.");
    process.exit(2);
  }
} catch (error) {
  if (error?.code === "auth/user-not-found") {
    console.error(`No user found for email: ${adminEmail}`);
    process.exit(3);
  }

  console.error("Failed to check admin user.", error);
  process.exit(1);
}
