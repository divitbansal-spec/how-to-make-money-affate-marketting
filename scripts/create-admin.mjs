/**
 * Server-side admin bootstrap script.
 *
 * Usage:
 *   SERVICE_ACCOUNT_PATH=./serviceAccountKey.json \
 *   ADMIN_EMAIL=DivitNAdmin7@gmail.com \
 *   ADMIN_PASSWORD='rootpassadmin142637' \
 *   ADMIN_DISPLAY_NAME='DivitNAdmin7' \
 *   node scripts/create-admin.mjs
 */

import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH;
if (!serviceAccountPath) {
  throw new Error("Missing SERVICE_ACCOUNT_PATH env var.");
}

const adminEmail = process.env.ADMIN_EMAIL || "DivitNAdmin7@gmail.com";
const adminPassword = process.env.ADMIN_PASSWORD;
const adminDisplayName = process.env.ADMIN_DISPLAY_NAME || "DivitNAdmin7";

if (!adminPassword) {
  throw new Error("Missing ADMIN_PASSWORD env var.");
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();

async function upsertAdminUser() {
  let userRecord;

  try {
    userRecord = await auth.getUserByEmail(adminEmail);
    await auth.updateUser(userRecord.uid, {
      password: adminPassword,
      displayName: adminDisplayName
    });
    console.log(`Updated existing admin user: ${adminEmail}`);
  } catch (error) {
    if (error?.code !== "auth/user-not-found") throw error;

    userRecord = await auth.createUser({
      email: adminEmail,
      password: adminPassword,
      displayName: adminDisplayName,
      emailVerified: true
    });
    console.log(`Created new admin user: ${adminEmail}`);
  }

  await auth.setCustomUserClaims(userRecord.uid, { admin: true });
  console.log(`Applied custom claim { admin: true } to uid: ${userRecord.uid}`);
}

upsertAdminUser().catch((error) => {
  console.error("Failed to bootstrap admin user.", error);
  process.exit(1);
});
