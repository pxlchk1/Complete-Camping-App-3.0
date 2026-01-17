/**
 * Admin Claim Utility Script
 *
 * Sets the `admin: true` custom claim on a Firebase Auth user.
 * This is required for users to call the awardSubscription HTTP endpoint.
 *
 * USAGE:
 * ------
 * 1. Navigate to the functions directory:
 *    cd functions
 *
 * 2. Install dependencies if not already installed:
 *    npm install
 *
 * 3. Make sure you're authenticated with Firebase:
 *    Option A: Use Application Default Credentials (ADC)
 *      - Run: gcloud auth application-default login
 *
 *    Option B: Use a service account key
 *      - Download service account JSON from Firebase Console
 *      - Set env: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
 *
 * 4. Run the script with ts-node:
 *    npx ts-node scripts/setAdminClaim.ts <uid-or-email>
 *
 * EXAMPLES:
 * ---------
 *    npx ts-node scripts/setAdminClaim.ts abc123xyz
 *    npx ts-node scripts/setAdminClaim.ts admin@example.com
 *
 * The script will:
 *   - Look up the user by UID or email
 *   - Set custom claim { admin: true }
 *   - Print confirmation
 *
 * NOTE: The user must sign out and back in for claims to take effect in their
 * ID token, or force a token refresh in the app.
 */

import * as admin from "firebase-admin";

// Initialize Firebase Admin with ADC or GOOGLE_APPLICATION_CREDENTIALS
admin.initializeApp();

async function setAdminClaim(identifier: string): Promise<void> {
  let user: admin.auth.UserRecord;

  // Try to determine if identifier is an email or UID
  if (identifier.includes("@")) {
    // Lookup by email
    console.log(`Looking up user by email: ${identifier}`);
    user = await admin.auth().getUserByEmail(identifier);
  } else {
    // Lookup by UID
    console.log(`Looking up user by UID: ${identifier}`);
    user = await admin.auth().getUser(identifier);
  }

  console.log(`Found user: ${user.email || user.uid}`);
  console.log(`  UID: ${user.uid}`);
  console.log(`  Email: ${user.email || "(no email)"}`);
  console.log(`  Display Name: ${user.displayName || "(no display name)"}`);

  // Get current claims
  const currentClaims = user.customClaims || {};
  console.log(`  Current claims: ${JSON.stringify(currentClaims)}`);

  // Set admin claim
  await admin.auth().setCustomUserClaims(user.uid, {
    ...currentClaims,
    admin: true,
  });

  console.log(`\n✅ Successfully set admin=true claim for ${user.email || user.uid}`);
  console.log("\nIMPORTANT: The user must sign out and back in for the claim to take effect.");
  console.log("Alternatively, call getIdToken(true) in the app to force a token refresh.");
}

// Main execution
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: npx ts-node scripts/setAdminClaim.ts <uid-or-email>");
  console.error("Example: npx ts-node scripts/setAdminClaim.ts admin@example.com");
  process.exit(1);
}

const identifier = args[0];

setAdminClaim(identifier)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error setting admin claim:", error.message);
    if (error.code === "auth/user-not-found") {
      console.error("User not found. Make sure the UID or email is correct.");
    }
    process.exit(1);
  });
