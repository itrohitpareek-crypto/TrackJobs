import express from "express";

import {
  getAdminStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllJobs,
  updateJobStatus,
  deleteJob,
  getAllApplications,
} from "../controllers/adminController.js";

import {
  auth,
  roles,
} from "../middleware/auth.js";

const router = express.Router();

const adminOnly = [
  auth,
  roles("admin"),
];

router.get(
  "/stats",
  ...adminOnly,
  getAdminStats
);

router.get(
  "/users",
  ...adminOnly,
  getAllUsers
);

router.patch(
  "/users/:id/role",
  ...adminOnly,
  updateUserRole
);

router.delete(
  "/users/:id",
  ...adminOnly,
  deleteUser
);

router.get(
  "/jobs",
  ...adminOnly,
  getAllJobs
);

router.patch(
  "/jobs/:id/status",
  ...adminOnly,
  updateJobStatus
);

router.delete(
  "/jobs/:id",
  ...adminOnly,
  deleteJob
);

router.get(
  "/applications",
  ...adminOnly,
  getAllApplications
);

export default router;