import express from "express";

import {
  apply,
  myApplications,
  getMyApplication,
  withdrawApplication,
  applicants,
  updateStatus,
  dashboard,
  downloadCandidateResume,
  getRecruiterApplication,
} from "../controllers/applicationController.js";

import {
  auth,
  roles,
} from "../middleware/auth.js";

const router =
  express.Router();

// ==========================================
// CANDIDATE
// ==========================================

// Apply to job
router.post(
  "/job/:jobId",
  auth,
  roles("candidate"),
  apply
);

// Candidate's applications
router.get(
  "/my",
  auth,
  roles("candidate"),
  myApplications
);

// ==========================================
// RECRUITER / ADMIN
// ==========================================

// Dashboard
router.get(
  "/dashboard",
  auth,
  roles(
    "recruiter",
    "admin"
  ),
  dashboard
);

// Applicants for a particular job
router.get(
  "/job/:jobId",
  auth,
  roles(
    "recruiter",
    "admin"
  ),
  applicants
);

// Fresh recruiter application
// IMPORTANT:
// Keep this before "/:id"
router.get(
  "/:id/recruiter",
  auth,
  roles(
    "recruiter",
    "admin"
  ),
  getRecruiterApplication
);

// Download candidate resume
router.get(
  "/:id/resume/download",
  auth,
  roles(
    "recruiter",
    "admin"
  ),
  downloadCandidateResume
);

// Update application status
router.patch(
  "/:id/status",
  auth,
  roles(
    "recruiter",
    "admin"
  ),
  updateStatus
);

// ==========================================
// CANDIDATE PARAM ROUTES
// ==========================================

// Get single candidate application
router.get(
  "/:id",
  auth,
  roles("candidate"),
  getMyApplication
);

// Withdraw application
router.patch(
  "/:id/withdraw",
  auth,
  roles("candidate"),
  withdrawApplication
);

export default router;