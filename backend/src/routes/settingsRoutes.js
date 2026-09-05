import { Router } from "express";

import { auth } from "../middleware/auth.js";

import {
  getSettings,
  updateSettings,
  changePassword,
  signOutAll,
  deactivateAccount,
  deleteAccount,
  exportAccountData,
} from "../controllers/settingsController.js";

const router = Router();

router.get(
  "/",
  auth,
  getSettings
);

router.patch(
  "/",
  auth,
  updateSettings
);

router.post(
  "/change-password",
  auth,
  changePassword
);

router.post(
  "/sign-out-all",
  auth,
  signOutAll
);

router.post(
  "/deactivate",
  auth,
  deactivateAccount
);

router.post(
  "/delete",
  auth,
  deleteAccount
);

router.get(
  "/export",
  auth,
  exportAccountData
);

export default router;