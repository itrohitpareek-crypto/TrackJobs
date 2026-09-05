import { Router } from "express";

import {
  register,
  login,
  me,
  googleStart,
  googleCallback,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

import { auth } from "../middleware/auth.js";

const r = Router();


/* =========================================================
   LOCAL AUTH
========================================================= */

r.post(
  "/register",
  register
);

r.post(
  "/login",
  login
);

r.get(
  "/me",
  auth,
  me
);


/* =========================================================
   GOOGLE AUTH
========================================================= */

r.get(
  "/google",
  googleStart
);

r.get(
  "/google/callback",
  googleCallback
);


/* =========================================================
   PASSWORD RESET
========================================================= */

r.post(
  "/forgot-password",
  forgotPassword
);

r.post(
  "/reset-password",
  resetPassword
);


export default r;