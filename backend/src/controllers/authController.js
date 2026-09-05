import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";

import User from "../models/User.js";

const FRONTEND_URL =
  process.env.CLIENT_URL ||
  process.env.FRONTEND_URL ||
  "http://localhost:5173";

const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID;

const GOOGLE_CLIENT_SECRET =
  process.env.GOOGLE_CLIENT_SECRET;

const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ||
  "http://localhost:5000/api/auth/google/callback";

const sign = (user) =>
  jwt.sign(
    {
      id: user._id,

      tokenVersion:
        Number(
          user.tokenVersion || 0
        ),
    },

    process.env.JWT_SECRET,

    {
      expiresIn: "7d",
    }
  );

const publicUser = (user) => ({
  id: user._id,

  name: user.name,

  email: user.email,

  role: user.role,

  avatar: user.avatar || "",
});

const normalizeEmail = (
  email
) =>
  String(
    email || ""
  )
    .trim()
    .toLowerCase();

const escapeHtml = (
  value
) =>
  String(
    value || ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

const createTransporter = () => {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    throw new Error(
      "SMTP configuration is missing."
    );
  }

  return nodemailer.createTransport(
    {
      host:
        process.env.SMTP_HOST,

      port:
        Number(
          process.env.SMTP_PORT ||
            587
        ),

      secure:
        String(
          process.env.SMTP_PORT ||
            587
        ) === "465",

      auth: {
        user:
          process.env.SMTP_USER,

        pass:
          process.env.SMTP_PASS,
      },
    }
  );
};

export const register = async (
  req,
  res
) => {
  try {
    const name =
      String(
        req.body.name || ""
      ).trim();

    const email =
      normalizeEmail(
        req.body.email
      );

    const password =
      String(
        req.body.password || ""
      );

    const role =
      req.body.role ===
      "recruiter"
        ? "recruiter"
        : "candidate";

    if (
      !name ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        message:
          "Name, email and password are required",
      });
    }

    if (
      name.length < 2 ||
      name.length > 100
    ) {
      return res.status(400).json({
        message:
          "Name must be between 2 and 100 characters.",
      });
    }

    if (
      password.length < 8
    ) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters.",
      });
    }

    const existingUser =
      await User.findOne({
        email,
      });

    if (existingUser) {
      return res.status(409).json({
        message:
          "Email already registered",
      });
    }

    const user =
      await User.create({
        name,

        email,

        password:
          await bcrypt.hash(
            password,
            12
          ),

        role,

        authProvider:
          "local",
      });

    return res
      .status(201)
      .json({
        token:
          sign(user),

        user:
          publicUser(user),
      });
  } catch (error) {
    console.error(
      "Register Error:",
      error
    );

    return res.status(500).json({
      message:
        "Registration failed",
    });
  }
};

export const login = async (
  req,
  res
) => {
  try {
    const email =
      normalizeEmail(
        req.body.email
      );

    const password =
      String(
        req.body.password || ""
      );

    if (
      !email ||
      !password
    ) {
      return res.status(400).json({
        message:
          "Email and password are required",
      });
    }

    const user =
      await User.findOne({
        email,
      }).select(
        "+password +googleId +authProvider"
      );

    if (!user) {
      return res.status(401).json({
        message:
          "Invalid credentials",
      });
    }

    if (
      user.accountStatus ===
      "deleted"
    ) {
      return res.status(403).json({
        message:
          "This account has been deleted.",
      });
    }

    if (
      user.accountStatus ===
      "deactivated"
    ) {
      return res.status(403).json({
        message:
          "This account is deactivated. Please contact support to reactivate it.",
      });
    }

    if (!user.password) {
      return res.status(401).json({
        message:
          "This account uses Google sign-in. Continue with Google to sign in.",
      });
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatches) {
      return res.status(401).json({
        message:
          "Invalid credentials",
      });
    }

    return res
      .status(200)
      .json({
        token:
          sign(user),

        user:
          publicUser(user),
      });
  } catch (error) {
    console.error(
      "Login Error:",
      error
    );

    return res.status(500).json({
      message:
        "Login failed",
    });
  }
};

export const googleStart = async (
  req,
  res
) => {
  try {
    if (
      !GOOGLE_CLIENT_ID ||
      !GOOGLE_CLIENT_SECRET
    ) {
      return res
        .status(500)
        .send(
          "Google OAuth is not configured on the server."
        );
    }

    const role =
      req.query.role ===
      "recruiter"
        ? "recruiter"
        : "candidate";

    const state =
      jwt.sign(
        {
          role,

          purpose:
            "google-oauth",
        },

        process.env.JWT_SECRET,

        {
          expiresIn:
            "10m",
        }
      );

    const params =
      new URLSearchParams({
        client_id:
          GOOGLE_CLIENT_ID,

        redirect_uri:
          GOOGLE_CALLBACK_URL,

        response_type:
          "code",

        scope:
          "openid email profile",

        access_type:
          "offline",

        prompt:
          "select_account",

        state,
      });

    return res.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    );
  } catch (error) {
    console.error(
      "Google Start Error:",
      error
    );

    return res
      .status(500)
      .send(
        "Unable to start Google sign-in."
      );
  }
};

export const googleCallback =
  async (
    req,
    res
  ) => {
    try {
      const {
        code,
        state,
        error,
      } = req.query;

      if (error) {
        return res.redirect(
          `${FRONTEND_URL}/login?google_error=${encodeURIComponent(
            "Google sign-in was cancelled."
          )}`
        );
      }

      if (
        !code ||
        !state
      ) {
        return res.redirect(
          `${FRONTEND_URL}/login?google_error=${encodeURIComponent(
            "Invalid Google sign-in response."
          )}`
        );
      }

      const decodedState =
        jwt.verify(
          state,
          process.env.JWT_SECRET
        );

      if (
        decodedState.purpose !==
        "google-oauth"
      ) {
        throw new Error(
          "Invalid OAuth state"
        );
      }

      const tokenResponse =
        await fetch(
          "https://oauth2.googleapis.com/token",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded",
            },

            body:
              new URLSearchParams({
                code,

                client_id:
                  GOOGLE_CLIENT_ID,

                client_secret:
                  GOOGLE_CLIENT_SECRET,

                redirect_uri:
                  GOOGLE_CALLBACK_URL,

                grant_type:
                  "authorization_code",
              }),
          }
        );

      if (
        !tokenResponse.ok
      ) {
        throw new Error(
          `Google token exchange failed: ${tokenResponse.status}`
        );
      }

      const googleTokens =
        await tokenResponse.json();

      if (
        !googleTokens.id_token ||
        !googleTokens.access_token
      ) {
        throw new Error(
          "Google did not return the required tokens."
        );
      }

      const googleClient =
        new OAuth2Client(
          GOOGLE_CLIENT_ID
        );

      const ticket =
        await googleClient.verifyIdToken(
          {
            idToken:
              googleTokens.id_token,

            audience:
              GOOGLE_CLIENT_ID,
          }
        );

      const verifiedPayload =
        ticket.getPayload();

      const googleUserResponse =
        await fetch(
          `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${encodeURIComponent(
            googleTokens.access_token
          )}`
        );

      if (
        !googleUserResponse.ok
      ) {
        throw new Error(
          "Unable to fetch Google profile."
        );
      }

      const googleUser =
        await googleUserResponse.json();

      if (
        !googleUser.sub ||
        !googleUser.email ||
        googleUser.email_verified !==
          true
      ) {
        throw new Error(
          "Google account email could not be verified."
        );
      }

      if (
        !verifiedPayload ||
        verifiedPayload.sub !==
          googleUser.sub
      ) {
        throw new Error(
          "Google identity verification failed."
        );
      }

      if (
        verifiedPayload.email &&
        normalizeEmail(
          verifiedPayload.email
        ) !==
          normalizeEmail(
            googleUser.email
          )
      ) {
        throw new Error(
          "Google email verification failed."
        );
      }

      const email =
        normalizeEmail(
          googleUser.email
        );

      let user =
        await User.findOne({
          $or: [
            {
              googleId:
                googleUser.sub,
            },

            {
              email,
            },
          ],
        }).select(
          "+password +googleId +authProvider"
        );

      if (!user) {
        user =
          await User.create({
            name:
              googleUser.name ||
              email.split(
                "@"
              )[0],

            email,

            role:
              decodedState.role ===
              "recruiter"
                ? "recruiter"
                : "candidate",

            avatar:
              googleUser.picture ||
              "",

            googleId:
              googleUser.sub,

            authProvider:
              "google",
          });
      } else {
        if (
          user.accountStatus ===
          "deleted"
        ) {
          return res.redirect(
            `${FRONTEND_URL}/login?google_error=${encodeURIComponent(
              "This account has been deleted."
            )}`
          );
        }

        if (
          user.accountStatus ===
          "deactivated"
        ) {
          return res.redirect(
            `${FRONTEND_URL}/login?google_error=${encodeURIComponent(
              "This account is deactivated. Please contact support to reactivate it."
            )}`
          );
        }

        let changed =
          false;

        if (!user.googleId) {
          user.googleId =
            googleUser.sub;

          changed =
            true;
        }

        if (
          !user.authProvider ||
          user.authProvider ===
            "local"
        ) {
          // Keep local password login
          // available for an existing account.
          user.authProvider =
            user.password
              ? "local"
              : "google";

          changed =
            true;
        }

        if (
          !user.avatar &&
          googleUser.picture
        ) {
          user.avatar =
            googleUser.picture;

          changed =
            true;
        }

        if (
          !user.name &&
          googleUser.name
        ) {
          user.name =
            googleUser.name;

          changed =
            true;
        }

        if (changed) {
          await user.save();
        }
      }

      const token =
        sign(user);

      return res.redirect(
        `${FRONTEND_URL}/login?google_success=1&token=${encodeURIComponent(
          token
        )}`
      );
    } catch (error) {
      console.error(
        "Google Callback Error:",
        error
      );

      return res.redirect(
        `${FRONTEND_URL}/login?google_error=${encodeURIComponent(
          "Google sign-in failed. Please try again."
        )}`
      );
    }
  };

export const forgotPassword =
  async (
    req,
    res
  ) => {
    const genericMessage =
      "If an account exists for this email, a password reset link has been sent.";

    try {
      const email =
        normalizeEmail(
          req.body.email
        );

      if (!email) {
        return res
          .status(400)
          .json({
            message:
              "Email address is required.",
          });
      }

      const user =
        await User.findOne({
          email,
        }).select(
          "+password +googleId +passwordResetToken +passwordResetExpires"
        );

      // Never reveal whether an email exists.
      if (!user) {
        return res
          .status(200)
          .json({
            message:
              genericMessage,
          });
      }

      if (
        !user.password &&
        user.googleId
      ) {
        return res
          .status(200)
          .json({
            message:
              genericMessage,
          });
      }

      const rawToken =
        crypto.randomBytes(
          32
        ).toString("hex");

      const hashedToken =
        crypto
          .createHash(
            "sha256"
          )
          .update(
            rawToken
          )
          .digest("hex");

      user.passwordResetToken =
        hashedToken;

      user.passwordResetExpires =
        new Date(
          Date.now() +
            15 *
              60 *
              1000
        );

      await user.save();

      const resetUrl =
        `${FRONTEND_URL}/reset-password/${rawToken}`;

      const transporter =
        createTransporter();

      await transporter.sendMail(
        {
          from:
            process.env.SMTP_FROM ||
            process.env.SMTP_USER,

          to:
            user.email,

          subject:
            "Reset your TrackJobs password",

          text:
            `Reset your TrackJobs password using this link: ${resetUrl}\n\nThis link expires in 15 minutes. If you did not request this, you can ignore this email.`,

          html:
            `
            <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#222;line-height:1.6">
              <h2>Reset your TrackJobs password</h2>

              <p>
                We received a request to reset the password for your TrackJobs account.
              </p>

              <p>
                <a
                  href="${escapeHtml(
                    resetUrl
                  )}"
                  style="display:inline-block;padding:12px 18px;background:#5b4de6;color:#fff;text-decoration:none;border-radius:8px"
                >
                  Reset password
                </a>
              </p>

              <p>
                This link expires in
                <strong>
                  15 minutes
                </strong>
                and can be used once.
              </p>

              <p>
                If you did not request this reset,
                you can safely ignore this email.
              </p>
            </div>
            `,
        }
      );

      return res
        .status(200)
        .json({
          message:
            genericMessage,
        });
    } catch (error) {
      console.error(
        "Forgot Password Error:",
        error
      );

      // Do not expose SMTP/database
      // details to the client.
      return res
        .status(200)
        .json({
          message:
            genericMessage,
        });
    }
  };

export const resetPassword =
  async (
    req,
    res
  ) => {
    try {
      const token =
        String(
          req.body.token || ""
        ).trim();

      const password =
        String(
          req.body.password || ""
        );

      if (
        !token ||
        !password
      ) {
        return res
          .status(400)
          .json({
            message:
              "Reset token and new password are required.",
          });
      }

      if (
        password.length < 8
      ) {
        return res
          .status(400)
          .json({
            message:
              "Password must be at least 8 characters.",
          });
      }

      const hashedToken =
        crypto
          .createHash(
            "sha256"
          )
          .update(token)
          .digest("hex");

      const user =
        await User.findOne({
          passwordResetToken:
            hashedToken,

          passwordResetExpires:
            {
              $gt:
                new Date(),
            },
        }).select(
          "+passwordResetToken +passwordResetExpires +password"
        );

      if (!user) {
        return res
          .status(400)
          .json({
            message:
              "This reset link is invalid or has expired. Please request a new one.",
          });
      }

      user.password =
        await bcrypt.hash(
          password,
          12
        );

      user.passwordResetToken =
        "";

      user.passwordResetExpires =
        null;

      user.authProvider =
        "local";

      await user.save();

      return res
        .status(200)
        .json({
          message:
            "Password reset successful. You can now sign in with your new password.",
        });
    } catch (error) {
      console.error(
        "Reset Password Error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Unable to reset password.",
        });
    }
  };

export const me = async (
  req,
  res
) => {
  try {
    return res
      .status(200)
      .json({
        user:
          req.user,
      });
  } catch (error) {
    console.error(
      "Me Error:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Failed to fetch current user",
      });
  }
};