import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const auth = async (
  req,
  res,
  next
) => {
  try {
    const token =
      (
        req.headers.authorization ||
        ""
      )
        .replace(
          /^Bearer\s+/i,
          ""
        )
        .trim();

    if (!token) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    const user =
      await User.findById(
        decoded.id
      ).select("-password");

    if (!user) {
      return res.status(401).json({
        message:
          "User not found",
      });
    }

    if (
      user.accountStatus ===
      "deleted"
    ) {
      return res.status(401).json({
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

    const tokenVersion =
      Number(
        decoded.tokenVersion || 0
      );

    if (
      tokenVersion !==
      Number(
        user.tokenVersion || 0
      )
    ) {
      return res.status(401).json({
        message:
          "Your session has expired. Please sign in again.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message:
        "Invalid or expired token",
    });
  }
};

export const roles =
  (...allowed) =>
  (req, res, next) => {
    if (
      allowed.includes(
        req.user.role
      )
    ) {
      return next();
    }

    return res.status(403).json({
      message:
        "Access denied",
    });
  };