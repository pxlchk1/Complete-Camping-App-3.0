/**
 * Firebase Cloud Functions for Complete Camping App
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Resend } from "resend";

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Resend (you'll need to add your API key to Firebase config)
const resend = new Resend(functions.config().resend?.apikey || process.env.RESEND_API_KEY);

interface CampgroundInvitation {
  recipientEmail: string;
  recipientName: string;
  inviterName: string;
  inviterId: string;
  invitationToken: string;
}

/**
 * Send campground invitation email
 * Called via HTTPS request from the app
 */
export const sendCampgroundInvitation = functions.https.onCall(
  async (data: CampgroundInvitation, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated to send invitations"
      );
    }

    const { recipientEmail, recipientName, inviterName, inviterId, invitationToken } = data;

    // Validate input
    if (!recipientEmail || !recipientName || !inviterName) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields"
      );
    }

    // Verify inviter is the authenticated user
    if (context.auth.uid !== inviterId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Can only send invitations as yourself"
      );
    }

    try {
      // Create deep link for the invitation
      const deepLink = `tentlantern://invite/${invitationToken}`;
      const webLink = `https://tentlantern.app/invite/${invitationToken}`;
      const iosLink = "https://apps.apple.com/app/tent-lantern/id123456789"; // TODO: Update with real App Store ID

      // Send email using Resend
      const emailResult = await resend.emails.send({
        from: "The Complete Camping App <invites@tentlantern.app>",
        to: recipientEmail,
        subject: `🏕️ ${inviterName} invited you to their campground!`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #2C3A2F;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #F4EBD0;
    }
    .container {
      background-color: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #2C3A2F 0%, #5A7356 100%);
      color: #F4EBD0;
      padding: 30px;
      border-radius: 12px 12px 0 0;
      margin: -40px -40px 30px -40px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      margin: 10px 0 0 0;
      opacity: 0.9;
      font-size: 16px;
    }
    .content {
      font-size: 16px;
    }
    .cta-button {
      display: inline-block;
      background-color: #7B9971;
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .app-links {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #E5DCC5;
    }
    .app-link {
      display: inline-block;
      margin: 10px 10px 10px 0;
      padding: 12px 24px;
      background-color: #F4EBD0;
      color: #2C3A2F;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      border: 2px solid #E5DCC5;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #E5DCC5;
      font-size: 14px;
      color: #8B9689;
      text-align: center;
    }
    .features {
      background-color: #F9F6EE;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .features li {
      margin: 10px 0;
    }
    .app-link.disabled {
      background-color: #E8E8E8;
      color: #999;
      border-color: #CCC;
      cursor: not-allowed;
      opacity: 0.6;
    }
    .coming-soon {
      font-size: 12px;
      color: #999;
      font-style: italic;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏕️ You're Invited!</h1>
      <p>Join ${inviterName}'s campground</p>
    </div>
    
    <div class="content">
      <p>Hi ${recipientName},</p>
      
              <p><strong>${inviterName}</strong> has invited you to join their campground on <strong>The Complete Camping App</strong>!</p>      <div class="features">
        <p><strong>As part of their campground, you'll be able to:</strong></p>
        <ul>
          <li>🗓️ Coordinate camping trips together</li>
          <li>📋 Share packing lists and meal plans</li>
          <li>⛺ Get updates on trip details and changes</li>
          <li>🎒 Manage gear and supplies as a group</li>
          <li>🌲 Discover new campgrounds and trails</li>
        </ul>
      </div>
      
      <div style="text-align: center;">
        <a href="${webLink}" class="cta-button">Accept Invitation</a>
      </div>
      
      <div class="app-links">
        <p style="margin-bottom: 10px;"><strong>Download the app:</strong></p>
        <a href="${iosLink}" class="app-link">📱 Download for iOS</a>
        <div>
          <span class="app-link disabled">🤖 Download for Android</span>
          <div class="coming-soon">Coming soon</div>
        </div>
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        <strong>Important:</strong> Sign up with this email address (<strong>${recipientEmail}</strong>) to automatically join ${inviterName}'s campground.
      </p>
    </div>
    
    <div class="footer">
      <p>Happy camping! 🏕️</p>
      <p style="margin-top: 10px;">© 2025 Tent and Lantern. All rights reserved.</p>
      <p style="margin-top: 10px; font-size: 12px;">
        This invitation was sent by ${inviterName}. If you didn't expect this email, you can safely ignore it.
      </p>
    </div>
  </div>
</body>
</html>
        `,
      });

      // Store invitation in Firestore
      const invitationRef = admin.firestore().collection("campgroundInvitations").doc(invitationToken);
      await invitationRef.set({
        recipientEmail: recipientEmail.toLowerCase(),
        recipientName,
        inviterId,
        inviterName,
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        ),
      });

      functions.logger.info("Campground invitation sent", {
        recipientEmail,
        inviterId,
        emailId: emailResult.data?.id,
      });

      return {
        success: true,
        message: "Invitation sent successfully",
        emailId: emailResult.data?.id,
      };
    } catch (error: any) {
      functions.logger.error("Error sending invitation", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to send invitation email",
        error.message
      );
    }
  }
);

/**
 * Check and accept pending invitation when user signs up
 * Triggered on user creation
 */
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  if (!user.email) return;

  const email = user.email.toLowerCase();

  try {
    // Check for pending invitations
    const invitationsSnapshot = await admin
      .firestore()
      .collection("campgroundInvitations")
      .where("recipientEmail", "==", email)
      .where("status", "==", "pending")
      .get();

    if (invitationsSnapshot.empty) {
      functions.logger.info("No pending invitations found", { email });
      return;
    }

    // Process all pending invitations
    const batch = admin.firestore().batch();

    for (const invitationDoc of invitationsSnapshot.docs) {
      const invitation = invitationDoc.data();
      const inviterId = invitation.inviterId;

      // Add user to inviter's campground contacts
      const contactRef = admin
        .firestore()
        .collection("campgroundContacts")
        .doc();

      batch.set(contactRef, {
        userId: inviterId,
        contactName: invitation.recipientName,
        contactEmail: email,
        contactUserId: user.uid,
        addedAt: admin.firestore.FieldValue.serverTimestamp(),
        addedVia: "invitation",
        invitationId: invitationDoc.id,
      });

      // Mark invitation as accepted
      batch.update(invitationDoc.ref, {
        status: "accepted",
        acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        acceptedByUserId: user.uid,
      });

      functions.logger.info("Auto-accepted campground invitation", {
        email,
        inviterId,
        invitationId: invitationDoc.id,
      });
    }

    await batch.commit();
  } catch (error) {
    functions.logger.error("Error processing invitations on user creation", error);
    // Don't throw - we don't want to block user creation
  }
});

/**
 * Send reminder email for pending invitations
 * Run daily via Cloud Scheduler
 */
export const sendInvitationReminders = functions.pubsub
  .schedule("0 10 * * *") // Run daily at 10 AM
  .timeZone("America/New_York")
  .onRun(async (context) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const pendingInvitations = await admin
      .firestore()
      .collection("campgroundInvitations")
      .where("status", "==", "pending")
      .where("createdAt", "<=", admin.firestore.Timestamp.fromDate(sevenDaysAgo))
      .where("reminderSent", "==", false)
      .limit(100)
      .get();

    if (pendingInvitations.empty) {
      functions.logger.info("No pending invitations needing reminders");
      return;
    }

    const batch = admin.firestore().batch();

    for (const invitationDoc of pendingInvitations.docs) {
      const invitation = invitationDoc.data();

      try {
        // Send reminder email
        await resend.emails.send({
          from: "Tent & Lantern <invites@tentlantern.app>",
          to: invitation.recipientEmail,
          subject: `Reminder: ${invitation.inviterName} is waiting for you on Tent & Lantern! 🏕️`,
          html: `
            <p>Hi ${invitation.recipientName},</p>
            <p>${invitation.inviterName} invited you to join their campground on Tent & Lantern a week ago.</p>
            <p>Don't miss out on coordinating camping trips together!</p>
            <p><a href="https://tentlantern.app/invite/${invitationDoc.id}">Accept Invitation</a></p>
          `,
        });

        batch.update(invitationDoc.ref, {
          reminderSent: true,
          reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        functions.logger.info("Sent invitation reminder", {
          invitationId: invitationDoc.id,
          recipientEmail: invitation.recipientEmail,
        });
      } catch (error) {
        functions.logger.error("Error sending reminder", { invitationId: invitationDoc.id, error });
      }
    }

    await batch.commit();
  });
