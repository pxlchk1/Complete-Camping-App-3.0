/**
 * Test Script: Campground Invite Matching
 * 
 * This script helps verify that the invite cross-reference system is working.
 * 
 * Usage:
 *   cd functions && npx ts-node ../scripts/test-invite-matching.ts [command]
 * 
 * Commands:
 *   list-pending     - List all pending invites
 *   check <email>    - Check if there's a pending invite for an email
 *   create-test      - Create a test invite (for testing purposes)
 *   simulate <email> - Simulate what would happen if a user signed up with this email
 */

import * as admin from 'firebase-admin';
import * as path from 'path';

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (error) {
  console.error('Error loading service account key:');
  console.error('Make sure serviceAccountKey.json exists in the project root.');
  console.error('Download it from Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

const db = admin.firestore();

interface CampgroundInvite {
  inviterUid: string;
  inviterName: string;
  inviteeEmail?: string;
  inviteePhone?: string;
  campgroundId: string;
  token: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  createdAt: admin.firestore.Timestamp;
  expiresAt: admin.firestore.Timestamp;
}

async function listPendingInvites(): Promise<void> {
  console.log('\n📋 Listing all pending invites...\n');
  
  const snapshot = await db.collection('campgroundInvites')
    .where('status', '==', 'pending')
    .get();
  
  if (snapshot.empty) {
    console.log('No pending invites found.');
    return;
  }
  
  console.log(`Found ${snapshot.size} pending invite(s):\n`);
  
  snapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot, index: number) => {
    const data = doc.data() as CampgroundInvite;
    const expiresAt = data.expiresAt?.toDate?.() || 'N/A';
    const createdAt = data.createdAt?.toDate?.() || 'N/A';
    
    console.log(`${index + 1}. Invite ID: ${doc.id}`);
    console.log(`   Invitee Email: ${data.inviteeEmail || 'N/A'}`);
    console.log(`   Inviter Name: ${data.inviterName}`);
    console.log(`   Inviter UID: ${data.inviterUid}`);
    console.log(`   Created: ${createdAt}`);
    console.log(`   Expires: ${expiresAt}`);
    console.log(`   Status: ${data.status}`);
    console.log('');
  });
}

async function checkEmail(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  console.log(`\n🔍 Checking for invites to: ${normalizedEmail}\n`);
  
  // Exact match query (what the function uses)
  const exactSnapshot = await db.collection('campgroundInvites')
    .where('inviteeEmail', '==', normalizedEmail)
    .where('status', '==', 'pending')
    .get();
  
  console.log(`Exact match query results: ${exactSnapshot.size} invite(s)`);
  
  if (!exactSnapshot.empty) {
    console.log('\n✅ Found matching invite(s):');
    exactSnapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
      const data = doc.data() as CampgroundInvite;
      console.log(`   - ID: ${doc.id}`);
      console.log(`     Inviter: ${data.inviterName} (${data.inviterUid})`);
      console.log(`     Expires: ${data.expiresAt?.toDate?.() || 'N/A'}`);
    });
  } else {
    console.log('\n❌ No matching invites found.');
    
    // Check for case-sensitivity issues
    const allPendingSnapshot = await db.collection('campgroundInvites')
      .where('status', '==', 'pending')
      .get();
    
    console.log(`\n📊 Total pending invites in database: ${allPendingSnapshot.size}`);
    
    // Check for similar emails
    const similarEmails = allPendingSnapshot.docs
      .map((d: admin.firestore.QueryDocumentSnapshot) => d.data().inviteeEmail as string | undefined)
      .filter((e: string | undefined) => e && e.toLowerCase().includes(email.split('@')[0].toLowerCase()));
    
    if (similarEmails.length > 0) {
      console.log(`\n⚠️  Similar emails found (possible case mismatch?):`);
      similarEmails.forEach((e: string | undefined) => console.log(`   - ${e}`));
    }
  }
}

async function simulateSignup(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  console.log(`\n🧪 Simulating signup for: ${normalizedEmail}\n`);
  
  const snapshot = await db.collection('campgroundInvites')
    .where('inviteeEmail', '==', normalizedEmail)
    .where('status', '==', 'pending')
    .get();
  
  if (snapshot.empty) {
    console.log('❌ No pending invites found. User would sign up without auto-matching.');
    return;
  }
  
  console.log(`✅ Found ${snapshot.size} pending invite(s). Here's what would happen:\n`);
  
  for (const doc of snapshot.docs) {
    const invite = doc.data() as CampgroundInvite;
    const now = admin.firestore.Timestamp.now();
    
    // Check expiration
    if (invite.expiresAt && invite.expiresAt.toMillis() < now.toMillis()) {
      console.log(`⏰ Invite ${doc.id} would be marked EXPIRED (expired on ${invite.expiresAt.toDate()})`);
      continue;
    }
    
    console.log(`📝 Invite ${doc.id} would be ACCEPTED:`);
    console.log(`   - New user would be added to ${invite.inviterName}'s campground`);
    console.log(`   - ${invite.inviterName} would be added to new user's campground`);
    console.log(`   - Invite status would change to 'accepted'`);
    console.log('');
  }
}

async function createTestInvite() {
  console.log('\n🆕 Creating a test invite...\n');
  
  const testEmail = `test-${Date.now()}@example.com`;
  const token = `test-${Math.random().toString(36).substring(7)}`;
  
  const inviteData: CampgroundInvite = {
    inviterUid: 'TEST_INVITER_UID',
    inviterName: 'Test Inviter',
    inviteeEmail: testEmail,
    campgroundId: 'TEST_CAMPGROUND',
    token,
    status: 'pending',
    createdAt: admin.firestore.Timestamp.now(),
    expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
  };
  
  const docRef = await db.collection('campgroundInvites').add(inviteData);
  
  console.log('✅ Test invite created:');
  console.log(`   ID: ${docRef.id}`);
  console.log(`   Invitee Email: ${testEmail}`);
  console.log(`   Token: ${token}`);
  console.log(`\nTo test: Sign up with email "${testEmail}" and check the logs.`);
  console.log(`To clean up: Delete document "${docRef.id}" from campgroundInvites collection.`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list-pending';
  
  try {
    switch (command) {
      case 'list-pending':
        await listPendingInvites();
        break;
      
      case 'check':
        if (!args[1]) {
          console.error('Please provide an email: npx ts-node scripts/test-invite-matching.ts check <email>');
          process.exit(1);
        }
        await checkEmail(args[1]);
        break;
      
      case 'simulate':
        if (!args[1]) {
          console.error('Please provide an email: npx ts-node scripts/test-invite-matching.ts simulate <email>');
          process.exit(1);
        }
        await simulateSignup(args[1]);
        break;
      
      case 'create-test':
        await createTestInvite();
        break;
      
      default:
        console.log('Unknown command. Available commands:');
        console.log('  list-pending  - List all pending invites');
        console.log('  check <email> - Check if there\'s a pending invite for an email');
        console.log('  simulate <email> - Simulate what would happen if a user signed up');
        console.log('  create-test   - Create a test invite');
    }
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

main();
