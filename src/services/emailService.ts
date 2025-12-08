/**
 * Email Service
 * Handles sending emails via Firebase Cloud Functions or external email service
 */

import { auth } from "../config/firebase";

/**
 * Send campground invitation email
 * This would typically call a Cloud Function or external API to send the email
 */
export async function sendCampgroundInvitation(
  recipientEmail: string,
  recipientName: string,
  inviterName: string
): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Must be authenticated to send invitation");
    }

    // TODO: In production, this should call a Cloud Function or external email API
    // For now, we'll just log the email that would be sent
    console.log("[EmailService] Campground invitation would be sent:");
    console.log({
      to: recipientEmail,
      recipientName,
      inviterName,
      subject: `${inviterName} invited you to join their campground on Tent & Lantern`,
      body: `
Hi ${recipientName},

${inviterName} has invited you to join their campground on Tent & Lantern - the complete camping app!

By joining their campground, you'll be included in all their camping trip plans and details. You can coordinate trips, share packing lists, meal plans, and more.

Download the Tent & Lantern app to get started:
• iOS: [App Store Link]
• Android: [Play Store Link]

Once you've installed the app, sign up with this email address (${recipientEmail}) to automatically join ${inviterName}'s campground.

Happy camping!
The Tent & Lantern Team
      `,
    });

    // In production, you would make an API call here:
    // const response = await fetch('YOUR_CLOUD_FUNCTION_URL', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     to: recipientEmail,
    //     recipientName,
    //     inviterName,
    //     templateType: 'campground-invitation',
    //   }),
    // });
    //
    // if (!response.ok) {
    //   throw new Error('Failed to send invitation email');
    // }

    console.log("[EmailService] Invitation email logged successfully");
  } catch (error) {
    console.error("[EmailService] Error sending invitation:", error);
    throw error;
  }
}
