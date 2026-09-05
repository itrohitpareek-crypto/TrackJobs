import {
  Router,
} from "express";

import {
  auth,
  roles,
} from "../middleware/auth.js";

import {
  listJobs,
  createJob,
  myJobs,
  getJob,
  updateJob,
  deleteJob,
  updateJobStatus,
  saveJob,
  unsaveJob,
  savedJobs,
} from "../controllers/jobController.js";

const router = Router();

// =====================================================
// PUBLIC
// =====================================================

router.get(
  "/",
  listJobs
);

// =====================================================
// CANDIDATE SAVED JOBS
// IMPORTANT: named routes BEFORE /:id
// =====================================================

router.get(
  "/saved/list",
  auth,
  roles("candidate"),
  savedJobs
);

// =====================================================
// RECRUITER JOBS
// =====================================================

router.get(
  "/mine/list",
  auth,
  roles(
    "recruiter",
    "admin"
  ),
  myJobs
);

// =====================================================
// RECRUITER CREATE
// =====================================================

router.post(
  "/",
  auth,
  roles(
    "recruiter",
    "admin"
  ),
  createJob
);

// =====================================================
// SAVED JOB ACTIONS
// =====================================================

router.post(
  "/:id/save",
  auth,
  roles("candidate"),
  saveJob
);

router.delete(
  "/:id/save",
  auth,
  roles("candidate"),
  unsaveJob
);

// =====================================================
// RECRUITER UPDATE STATUS
// =====================================================

router.patch(
  "/:id/status",
  auth,
  roles(
    "recruiter",
    "admin"
  ),
  updateJobStatus
);

// =====================================================
// RECRUITER UPDATE
// =====================================================

router.put(
  "/:id",
  auth,
  roles(
    "recruiter",
    "admin"
  ),
  updateJob
);

// =====================================================
// RECRUITER DELETE
// =====================================================

router.delete(
  "/:id",
  auth,
  roles(
    "recruiter",
    "admin"
  ),
  deleteJob
);

// =====================================================
// SINGLE JOB
// MUST BE AFTER NAMED ROUTES
// =====================================================

router.get(
  "/:id",
  getJob
);

export default router;