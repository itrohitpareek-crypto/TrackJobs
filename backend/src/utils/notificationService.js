import Notification from "../models/Notification.js";
import User from "../models/User.js";
import {
  sendNotificationEmail,
} from "./emailService.js";


// =====================================================
// CREATE NOTIFICATION + EMAIL
// =====================================================

export const createNotificationWithEmail =
  async ({
    recipient,

    type = "system",

    title,

    message,

    link = "/notifications",

    relatedId,

    eventKey,

    preference =
      "applicationUpdates",
  }) => {
    try {
      const user =
        await User.findById(
          recipient
        ).select(
          "name email notificationPreferences"
        );

      if (!user) {
        return null;
      }

      // Respect user's email/in-app notification preference.
      if (
        preference &&
        user.notificationPreferences &&
        user.notificationPreferences[
          preference
        ] === false
      ) {
        return null;
      }

      // =================================================
      // IMPORTANT:
      // CHAT / MESSAGE EMAILS ARE DISABLED.
      // =================================================

      if (
        type === "message"
      ) {
        return null;
      }

      let notification;

      try {
        notification =
          await Notification.create(
            {
              recipient,

              type,

              title,

              message,

              link,

              relatedId,

              eventKey,
            }
          );
      } catch (error) {
        // Duplicate event should never break
        // the original action.
        if (
          error.code === 11000
        ) {
          return null;
        }

        throw error;
      }

      // =================================================
      // SEND EMAIL
      // =================================================

      // Email failure should NOT break the main
      // application/interview/status action.

      try {
        await sendNotificationEmail(
          {
            user,

            title,

            message,

            link,
          }
        );
      } catch (emailError) {
        console.error(
          "Notification email failed:",
          emailError?.message ||
            emailError
        );
      }

      return notification;
    } catch (error) {
      console.error(
        "Notification creation error:",
        error?.message ||
          error
      );

      return null;
    }
  };