import express from "express";

import {
  getProfile,
  updateProfile,
  upload,
} from "../controllers/profileController.js";

import { auth } from "../middleware/auth.js";

const router = express.Router();

router.get(
  "/",
  auth,
  getProfile
);

router.put(
  "/",
  auth,
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "resume",
      maxCount: 1,
    },
  ]),
  updateProfile
);

export default router;