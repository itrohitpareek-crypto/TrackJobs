import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar || "",
});

const sign = (user) =>
  jwt.sign(
    {
      id: user._id,
      tokenVersion: Number(user.tokenVersion || 0),
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

const booleanValue = (value, fallback) => {
  if (typeof value === "boolean") return value;
  return fallback;
};

export const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "Account not found." });
    }

    return res.json({
      account: {
        ...publicUser(user),
        authProvider: user.authProvider || "local",
        accountStatus: user.accountStatus || "active",
        createdAt: user.createdAt,
        hasPassword: Boolean(user.password),
      },

      notifications: {
        applicationUpdates:
          user.notificationPreferences?.applicationUpdates ?? true,

        messages:
          user.notificationPreferences?.messages ?? true,

        jobAlerts:
          user.notificationPreferences?.jobAlerts ?? true,

        marketingEmails:
          user.notificationPreferences?.marketingEmails ?? false,
      },

      privacy: {
        profileVisibility:
          user.privacySettings?.profileVisibility ||
          user.profileVisibility ||
          "public",

        allowRecruiterMessages:
          user.privacySettings?.allowRecruiterMessages ?? true,
      },

      security: {
        hasPassword: Boolean(user.password),
        authProvider: user.authProvider || "local",
      },
    });
  } catch (error) {
    console.error("Get Settings Error:", error);

    return res.status(500).json({
      message: "Unable to load account settings.",
    });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const {
      notifications = {},
      privacy = {},
    } = req.body || {};

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "Account not found.",
      });
    }

    if (
      notifications &&
      typeof notifications === "object"
    ) {
      user.notificationPreferences = {
        applicationUpdates: booleanValue(
          notifications.applicationUpdates,
          user.notificationPreferences?.applicationUpdates ?? true
        ),

        messages: booleanValue(
          notifications.messages,
          user.notificationPreferences?.messages ?? true
        ),

        jobAlerts: booleanValue(
          notifications.jobAlerts,
          user.notificationPreferences?.jobAlerts ?? true
        ),

        marketingEmails: booleanValue(
          notifications.marketingEmails,
          user.notificationPreferences?.marketingEmails ?? false
        ),
      };
    }

    if (
      privacy &&
      typeof privacy === "object"
    ) {
      const profileVisibility =
        privacy.profileVisibility === "private"
          ? "private"
          : "public";

      user.privacySettings = {
        profileVisibility,

        allowRecruiterMessages: booleanValue(
          privacy.allowRecruiterMessages,
          user.privacySettings?.allowRecruiterMessages ?? true
        ),
      };

      // Keep the existing profile visibility field
      // synchronized so existing profile/search features
      // continue to work without a breaking change.
      user.profileVisibility =
        profileVisibility;
    }

    await user.save();

    return res.json({
      message:
        "Account settings updated successfully.",

      notifications:
        user.notificationPreferences,

      privacy:
        user.privacySettings,
    });
  } catch (error) {
    console.error(
      "Update Settings Error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to update account settings.",
    });
  }
};

export const changePassword = async (
  req,
  res
) => {
  try {
    const currentPassword =
      String(
        req.body.currentPassword || ""
      );

    const newPassword =
      String(
        req.body.newPassword || ""
      );

    if (!newPassword) {
      return res.status(400).json({
        message:
          "New password is required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message:
          "New password must be at least 8 characters.",
      });
    }

    const user =
      await User.findById(
        req.user._id
      ).select(
        "+password +googleId tokenVersion authProvider"
      );

    if (!user) {
      return res.status(404).json({
        message:
          "Account not found.",
      });
    }

    // Local accounts must prove knowledge
    // of the current password.
    //
    // Google-only accounts can create a password
    // while already authenticated.
    if (user.password) {
      if (!currentPassword) {
        return res.status(400).json({
          message:
            "Current password is required.",
        });
      }

      const matches =
        await bcrypt.compare(
          currentPassword,
          user.password
        );

      if (!matches) {
        return res.status(401).json({
          message:
            "Current password is incorrect.",
        });
      }
    }

    if (user.password) {
      const samePassword =
        await bcrypt.compare(
          newPassword,
          user.password
        );

      if (samePassword) {
        return res.status(400).json({
          message:
            "New password must be different from your current password.",
        });
      }
    }

    user.password =
      await bcrypt.hash(
        newPassword,
        12
      );

    user.tokenVersion =
      Number(
        user.tokenVersion || 0
      ) + 1;

    await user.save();

    return res.json({
      message:
        "Password changed successfully. Other active sessions have been signed out.",

      token: sign(user),
    });
  } catch (error) {
    console.error(
      "Change Password Error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to change password.",
    });
  }
};

export const signOutAll = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.user._id
      );

    if (!user) {
      return res.status(404).json({
        message:
          "Account not found.",
      });
    }

    user.tokenVersion =
      Number(
        user.tokenVersion || 0
      ) + 1;

    await user.save();

    return res.json({
      message:
        "All other sessions have been signed out.",

      token: sign(user),
    });
  } catch (error) {
    console.error(
      "Sign Out All Error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to sign out other sessions.",
    });
  }
};

export const deactivateAccount = async (
  req,
  res
) => {
  try {
    const password =
      String(
        req.body.password || ""
      );

    const confirmation =
      String(
        req.body.confirmation || ""
      ).trim();

    const user =
      await User.findById(
        req.user._id
      ).select("+password");

    if (!user) {
      return res.status(404).json({
        message:
          "Account not found.",
      });
    }

    if (user.password) {
      if (!password) {
        return res.status(400).json({
          message:
            "Enter your password to deactivate the account.",
        });
      }

      const matches =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!matches) {
        return res.status(401).json({
          message:
            "Password is incorrect.",
        });
      }
    } else if (
      confirmation !== "DEACTIVATE"
    ) {
      return res.status(400).json({
        message:
          "Type DEACTIVATE to confirm account deactivation.",
      });
    }

    user.accountStatus =
      "deactivated";

    user.deactivatedAt =
      new Date();

    user.tokenVersion =
      Number(
        user.tokenVersion || 0
      ) + 1;

    await user.save();

    return res.json({
      message:
        "Your account has been deactivated.",
    });
  } catch (error) {
    console.error(
      "Deactivate Account Error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to deactivate account.",
    });
  }
};

export const deleteAccount = async (
  req,
  res
) => {
  try {
    const confirmation =
      String(
        req.body.confirmation || ""
      ).trim();

    const password =
      String(
        req.body.password || ""
      );

    if (confirmation !== "DELETE") {
      return res.status(400).json({
        message:
          "Type DELETE to confirm permanent account deletion.",
      });
    }

    const user =
      await User.findById(
        req.user._id
      ).select("+password");

    if (!user) {
      return res.status(404).json({
        message:
          "Account not found.",
      });
    }

    if (user.password) {
      if (!password) {
        return res.status(400).json({
          message:
            "Enter your password to delete the account.",
        });
      }

      const matches =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!matches) {
        return res.status(401).json({
          message:
            "Password is incorrect.",
        });
      }
    }

    // Soft-delete + anonymize the identity
    // so historical applications/jobs can keep
    // their references without leaving personal
    // data active.
    user.name =
      "Deleted User";

    user.email =
      `deleted-${user._id}@deleted.trackjobs.local`;

    user.phone = "";
    user.location = "";
    user.bio = "";
    user.headline = "";
    user.skills = [];
    user.education = [];
    user.experience = [];

    user.resumeUrl = "";
    user.resumeOriginalName = "";

    user.linkedinUrl = "";
    user.githubUrl = "";
    user.portfolioUrl = "";

    user.avatar = "";

    // Keep a non-usable password hash because
    // the schema requires a password whenever
    // googleId is absent.
    //
    // accountStatus blocks sign-in.
    user.password =
      await bcrypt.hash(
        crypto.randomUUID(),
        12
      );

    user.googleId =
      undefined;

    user.authProvider =
      "local";

    user.accountStatus =
      "deleted";

    user.deletedAt =
      new Date();

    user.deactivatedAt =
      null;

    user.tokenVersion =
      Number(
        user.tokenVersion || 0
      ) + 1;

    await user.save({
      validateBeforeSave: true,
    });

    return res.json({
      message:
        "Your TrackJobs account has been permanently deleted.",
    });
  } catch (error) {
    console.error(
      "Delete Account Error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to delete account.",
    });
  }
};

export const exportAccountData = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.user._id
      ).select(
        "-password -googleId -passwordResetToken -passwordResetExpires -tokenVersion"
      );

    if (!user) {
      return res.status(404).json({
        message:
          "Account not found.",
      });
    }

    const payload = {
      exportedAt:
        new Date().toISOString(),

      account:
        user.toObject(),
    };

    res.setHeader(
      "Content-Type",
      "application/json"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="trackjobs-account-data.json"`
    );

    return res
      .status(200)
      .send(
        JSON.stringify(
          payload,
          null,
          2
        )
      );
  } catch (error) {
    console.error(
      "Export Account Data Error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to export account data.",
    });
  }
};