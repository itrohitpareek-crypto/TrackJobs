import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { createPortal } from "react-dom";

import {
  Plus,
  Users,
  Briefcase,
  CheckCircle,
  MapPin,
  Mail,
  FileText,
  Download,
  GraduationCap,
  Search,
  X,
  CalendarDays,
  Clock3,
  Video,
  Phone,
  Building2,
  ChevronRight,
  UserCheck,
  UserX,
  Eye,
  RefreshCw,
  BarChart3,
  CircleDot,
  BriefcaseBusiness,
} from "lucide-react";

import api, {
  getFileUrl,
} from "../services/api";

import "../styles/recruiterDashboard.css";

const statuses = [
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview Scheduled",
  "Interviewed",
  "Selected",
  "Rejected",
];

const emptyForm = {
  title: "",
  company: "",
  location: "",
  type: "Full-time",
  workMode: "On-site",
  department: "",
  industry: "",
  employmentLevel:
    "Mid-Senior level",
  openings: "1",
  salary: "",
  salaryMin: "",
  salaryMax: "",
  experience: "0-2 years",
  experienceMin: "0",
  experienceMax: "2",
  education: "",
  noticePeriod: "",
  skills: "",
  description: "",
  responsibilities: "",
  requirements: "",
  niceToHave: "",
  benefits: "",
  deadline: "",
  applicationLimit: "",
  externalApplyUrl: "",
  linkedinUrl: "",
  companyWebsite: "",
};

const splitLines = (value) =>
  String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const splitComma = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
};

const formatDateTime = (date) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

const statusClass = (status) =>
  status
    ?.toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z-]/g, "") ||
  "applied";

// Candidate experience is stored in MongoDB as an array of
// experience objects. React cannot render that array/object
// directly, so convert it into a readable total before rendering.
const getExperienceYears = (experience) => {
  // Backward compatibility in case older records contain a number/string.
  // Older data may contain a single experience object instead of an array.
  if (experience && typeof experience === "object" && !Array.isArray(experience)) {
    experience = [experience];
  }

  if (!Array.isArray(experience)) {
    const numericValue = Number(experience);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  if (!experience.length) return 0;

  let totalMonths = 0;

  experience.forEach((item) => {
    if (!item || typeof item !== "object") return;

    const start = item.startDate
      ? new Date(item.startDate)
      : null;

    const end = item.current
      ? new Date()
      : item.endDate
        ? new Date(item.endDate)
        : null;

    if (
      !start ||
      !end ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end < start
    ) {
      return;
    }

    const months =
      (end.getFullYear() - start.getFullYear()) *
        12 +
      (end.getMonth() - start.getMonth());

    totalMonths += Math.max(0, months);
  });

  const years = totalMonths / 12;

  if (years === 0) return 0;

  // Keep the UI clean: 1.5 instead of 1.500000...
  return Number(years.toFixed(1));
};

export default function Recruiter() {
  const [stats, setStats] =
    useState({});

  const [jobs, setJobs] =
    useState([]);

  const [selectedJob, setSelectedJob] =
    useState(null);

  const [apps, setApps] =
    useState([]);

  const [loadingApps, setLoadingApps] =
    useState(false);

  const [loadingDashboard, setLoadingDashboard] =
    useState(false);

  const [appSearch, setAppSearch] =
    useState("");

  const [appStatusFilter, setAppStatusFilter] =
    useState("All");

  const [profileCandidate, setProfileCandidate] =
    useState(null);

  const [selectedApplication, setSelectedApplication] =
    useState(null);

  const [showInterview, setShowInterview] =
    useState(false);

  const [savingInterview, setSavingInterview] =
    useState(false);

  const [interviewForm, setInterviewForm] =
    useState({
      date: "",
      mode: "Video call",
      notes: "",
    });

  const [notes, setNotes] =
    useState("");

  const [showJobForm, setShowJobForm] =
    useState(false);

  const [creating, setCreating] =
    useState(false);

  const [form, setForm] =
    useState(emptyForm);

  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  const load = async () => {
    try {
      setLoadingDashboard(true);

      const [
        dashboardResponse,
        jobsResponse,
      ] = await Promise.all([
        api.get(
          "/applications/dashboard"
        ),
        api.get(
          "/jobs/mine/list"
        ),
      ]);

      setStats(
        dashboardResponse.data || {}
      );

      const jobData =
        jobsResponse.data;

      setJobs(
        Array.isArray(jobData)
          ? jobData
          : jobData?.jobs || []
      );
    } catch (error) {
      console.error(
        "Recruiter dashboard load error:",
        error
      );
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // =====================================================
  // FORM UPDATE
  // =====================================================

  const updateForm = (
    key,
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // =====================================================
  // CREATE JOB
  // =====================================================

  const createJob = async (
    event
  ) => {
    event.preventDefault();

    if (creating) return;

    const title =
      form.title.trim();

    const company =
      form.company.trim();

    const location =
      form.location.trim();

    const description =
      form.description.trim();

    const skills =
      splitComma(form.skills);

    const responsibilities =
      splitLines(
        form.responsibilities
      );

    const requirements =
      splitLines(
        form.requirements
      );

    if (
      title.length < 3 ||
      !company ||
      !location
    ) {
      alert(
        "Please fill job title, company and location."
      );
      return;
    }

    if (description.length < 30) {
      alert(
        "Job description should contain at least 30 characters."
      );
      return;
    }

    if (!skills.length) {
      alert(
        "Please add at least one skill."
      );
      return;
    }

    if (!responsibilities.length) {
      alert(
        "Please add responsibilities, one per line."
      );
      return;
    }

    if (!requirements.length) {
      alert(
        "Please add requirements, one per line."
      );
      return;
    }

    const openings =
      Number(form.openings || 1);

    const salaryMin =
      form.salaryMin === ""
        ? 0
        : Number(form.salaryMin);

    const salaryMax =
      form.salaryMax === ""
        ? 0
        : Number(form.salaryMax);

    const experienceMin =
      form.experienceMin === ""
        ? 0
        : Number(form.experienceMin);

    const experienceMax =
      form.experienceMax === ""
        ? 0
        : Number(form.experienceMax);

    if (
      !Number.isInteger(openings) ||
      openings < 1
    ) {
      alert(
        "Openings must be at least 1."
      );
      return;
    }

    if (
      salaryMax > 0 &&
      salaryMax < salaryMin
    ) {
      alert(
        "Maximum salary cannot be less than minimum salary."
      );
      return;
    }

    if (
      experienceMax <
      experienceMin
    ) {
      alert(
        "Maximum experience cannot be less than minimum experience."
      );
      return;
    }

    let deadline = null;

    if (form.deadline) {
      deadline =
        `${form.deadline}T23:59:59`;

      if (
        new Date(deadline) <
        new Date()
      ) {
        alert(
          "Application deadline must be in the future."
        );
        return;
      }
    }

    const payload = {
      title,
      company,
      location,

      type: form.type,

      workMode:
        form.workMode,

      department:
        form.department.trim(),

      industry:
        form.industry.trim(),

      employmentLevel:
        form.employmentLevel,

      openings,

      salary:
        form.salary.trim() ||
        "Competitive",

      salaryMin,

      salaryMax,

      salaryCurrency:
        "INR",

      experience:
        form.experience.trim() ||
        `${experienceMin}-${experienceMax} years`,

      experienceMin,

      experienceMax,

      education:
        form.education.trim(),

      noticePeriod:
        form.noticePeriod.trim(),

      skills,

      description,

      responsibilities,

      requirements,

      niceToHave:
        splitLines(
          form.niceToHave
        ),

      benefits:
        splitLines(
          form.benefits
        ),

      deadline,

      applicationLimit:
        form.applicationLimit
          ? Number(
              form.applicationLimit
            )
          : 0,

      externalApplyUrl:
        form.externalApplyUrl.trim(),

      linkedinUrl:
        form.linkedinUrl.trim(),

      companyWebsite:
        form.companyWebsite.trim(),

      status: "active",
    };

    try {
      setCreating(true);

      await api.post(
        "/jobs",
        payload
      );

      alert(
        "Job published successfully."
      );

      setShowJobForm(false);

      setForm(emptyForm);

      await load();
    } catch (error) {
      console.error(
        "Create job error:",
        error
      );

      alert(
        error.response?.data
          ?.message ||
          "Failed to create job."
      );
    } finally {
      setCreating(false);
    }
  };

  // =====================================================
  // OPEN APPLICANTS
  // =====================================================

  const openApplicants = async (
    job
  ) => {
    try {
      setSelectedJob(job);

      setApps([]);

      setLoadingApps(true);

      setAppSearch("");

      setAppStatusFilter("All");

      const response =
        await api.get(
          `/applications/job/${job._id}`
        );

      /*
       * IMPORTANT FIX:
       * Backend returns:
       * { success, applications }
       *
       * Old code was doing:
       * setApps(response.data)
       *
       * which caused .map() crash.
       */

      const applications =
        response.data?.applications;

      setApps(
        Array.isArray(
          applications
        )
          ? applications
          : []
      );
    } catch (error) {
      console.error(
        "Load applicants error:",
        error
      );

      alert(
        error.response?.data
          ?.message ||
          "Unable to load applicants."
      );

      setApps([]);
    } finally {
      setLoadingApps(false);
    }
  };

  // =====================================================
  // CLOSE APPLICANTS
  // =====================================================

  const closeApplicants = () => {
    setSelectedJob(null);
    setApps([]);
    setSelectedApplication(null);
    setProfileCandidate(null);
    setShowInterview(false);
  };

  // =====================================================
  // FILTER APPLICANTS
  // =====================================================

  const filteredApps =
    useMemo(() => {
      return apps.filter(
        (application) => {
          const candidate =
            application.candidate ||
            {};

          const search =
            appSearch
              .trim()
              .toLowerCase();

          const matchesSearch =
            !search ||
            String(
              candidate.name || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              candidate.email || ""
            )
              .toLowerCase()
              .includes(search) ||
            (candidate.skills ||
              [])
              .some((skill) =>
                String(skill)
                  .toLowerCase()
                  .includes(search)
              );

          const matchesStatus =
            appStatusFilter ===
              "All" ||
            application.status ===
              appStatusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      apps,
      appSearch,
      appStatusFilter,
    ]);

  // =====================================================
  // UPDATE STATUS
  // =====================================================

  const updateApplicationStatus =
    async (
      application,
      value
    ) => {
      try {
        const response =
          await api.patch(
            `/applications/${application._id}/status`,
            {
              status: value,
              recruiterNotes:
                application.recruiterNotes ||
                "",
            }
          );

        const updated =
          response.data
            ?.application;

        if (updated) {
          setApps(
            (previous) =>
              previous.map(
                (item) =>
                  item._id ===
                  application._id
                    ? updated
                    : item
              )
          );

          setSelectedApplication(
            updated
          );
        }

        await load();
      } catch (error) {
        console.error(
          "Status update error:",
          error
        );

        alert(
          error.response?.data
            ?.message ||
            "Unable to update application status."
        );
      }
    };

  // =====================================================
  // SAVE RECRUITER NOTES
  // =====================================================

  const saveNotes = async () => {
    if (
      !selectedApplication
    ) {
      return;
    }

    try {
      const response =
        await api.patch(
          `/applications/${selectedApplication._id}/status`,
          {
            status:
              selectedApplication.status,
            recruiterNotes:
              notes,
            interview:
              selectedApplication.interview ||
              undefined,
          }
        );

      const updated =
        response.data
          ?.application;

      if (updated) {
        setApps(
          (previous) =>
            previous.map(
              (item) =>
                item._id ===
                updated._id
                  ? updated
                  : item
            )
        );

        setSelectedApplication(
          updated
        );
      }

      alert(
        "Recruiter notes saved."
      );
    } catch (error) {
      console.error(
        error
      );

      alert(
        error.response?.data
          ?.message ||
          "Unable to save notes."
      );
    }
  };

  // =====================================================
  // OPEN INTERVIEW SCHEDULER
  // =====================================================

  const openInterviewScheduler = () => {
    const existingDate =
      selectedApplication?.interview?.date;

    let dateValue = "";

    if (existingDate) {
      const parsed = new Date(existingDate);

      if (!Number.isNaN(parsed.getTime())) {
        const offset =
          parsed.getTimezoneOffset() * 60000;

        dateValue = new Date(
          parsed.getTime() - offset
        )
          .toISOString()
          .slice(0, 16);
      }
    }

    if (!dateValue) {
      const next = new Date();
      next.setMinutes(next.getMinutes() + 30);

      const offset =
        next.getTimezoneOffset() * 60000;

      dateValue = new Date(
        next.getTime() - offset
      )
        .toISOString()
        .slice(0, 16);
    }

    setInterviewForm({
      date: dateValue,
      mode:
        selectedApplication?.interview?.mode ||
        "Video call",
      notes:
        selectedApplication?.interview?.notes ||
        "",
    });

    setShowInterview(true);
  };

  // =====================================================
  // SCHEDULE / RESCHEDULE INTERVIEW
  // =====================================================

  const scheduleInterview = async () => {
    if (!selectedApplication || savingInterview) {
      return;
    }

    if (!interviewForm.date) {
      alert("Please select interview date and time.");
      return;
    }

    const interviewDate = new Date(
      interviewForm.date
    );

    if (
      Number.isNaN(interviewDate.getTime()) ||
      interviewDate.getTime() <= Date.now()
    ) {
      alert("Please select a future interview date and time.");
      return;
    }

    try {
      setSavingInterview(true);

      const response = await api.patch(
        `/applications/${selectedApplication._id}/status`,
        {
          status: "Interview Scheduled",
          recruiterNotes:
            selectedApplication.recruiterNotes || "",
          interview: {
            date: interviewDate.toISOString(),
            mode:
              interviewForm.mode?.trim() ||
              "Video call",
            notes:
              interviewForm.notes?.trim() || "",
          },
        }
      );

      const updated =
        response.data?.application;

      if (!updated) {
        throw new Error(
          "The server did not return the updated application."
        );
      }

      setApps((previous) =>
        previous.map((item) =>
          item._id === updated._id
            ? updated
            : item
        )
      );

      setSelectedApplication(updated);
      setShowInterview(false);

      await load();
    } catch (error) {
      console.error(
        "Interview scheduling error:",
        error
      );

      alert(
        error.response?.data?.message ||
          error.message ||
          "Unable to schedule interview."
      );
    } finally {
      setSavingInterview(false);
    }
  };

  // =====================================================
  // CANCEL SCHEDULED INTERVIEW
  // =====================================================

  const cancelInterview = async () => {
    if (
      !selectedApplication ||
      savingInterview
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Cancel the interview scheduled for ${
        selectedApplication.candidate?.name ||
        "this candidate"
      }?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setSavingInterview(true);

      const response = await api.patch(
        `/applications/${selectedApplication._id}/status`,
        {
          status: "Shortlisted",
          recruiterNotes:
            selectedApplication.recruiterNotes || "",
          interview: {
            date: null,
            mode: "",
            notes: "",
          },
        }
      );

      const updated =
        response.data?.application;

      if (!updated) {
        throw new Error(
          "The server did not return the updated application."
        );
      }

      setApps((previous) =>
        previous.map((item) =>
          item._id === updated._id
            ? updated
            : item
        )
      );

      setSelectedApplication(updated);

      await load();
    } catch (error) {
      console.error(
        "Interview cancellation error:",
        error
      );

      alert(
        error.response?.data?.message ||
          error.message ||
          "Unable to cancel interview."
      );
    } finally {
      setSavingInterview(false);
    }
  };

  // =====================================================
  // DOWNLOAD RESUME
  // =====================================================

  const downloadResume =
    async (
      applicationId,
      candidateName
    ) => {
      try {
        const response =
          await api.get(
            `/applications/${applicationId}/resume/download`,
            {
              responseType:
                "blob",
            }
          );

        const blob =
          new Blob([
            response.data,
          ]);

        const url =
          window.URL.createObjectURL(
            blob
          );

        const link =
          document.createElement(
            "a"
          );

        link.href = url;

        link.download =
          `${String(
            candidateName ||
              "Candidate"
          ).replace(
            /[^a-zA-Z0-9]/g,
            "-"
          )}-Resume`;

        document.body.appendChild(
          link
        );

        link.click();

        link.remove();

        window.URL.revokeObjectURL(
          url
        );
      } catch (error) {
        console.error(
          "Resume download error:",
          error
        );

        alert(
          error.response?.data
            ?.message ||
            "Unable to download resume."
        );
      }
    };

  // =====================================================
  // TOGGLE JOB
  // =====================================================

  const toggleJobStatus =
    async (job) => {
      const nextStatus =
        job.status === "active"
          ? "closed"
          : "active";

      try {
        await api.patch(
          `/jobs/${job._id}/status`,
          {
            status:
              nextStatus,
          }
        );

        await load();

        if (
          selectedJob?._id ===
          job._id
        ) {
          setSelectedJob(
            (previous) =>
              previous
                ? {
                    ...previous,
                    status:
                      nextStatus,
                  }
                : previous
          );
        }
      } catch (error) {
        console.error(
          error
        );

        alert(
          error.response?.data
            ?.message ||
            "Unable to update job status."
        );
      }
    };

  // =====================================================
  // OPEN APPLICATION DETAILS
  // =====================================================

  const openApplication =
    (application) => {
      setSelectedApplication(
        application
      );

      setNotes(
        application.recruiterNotes ||
          ""
      );

      setInterviewForm({
        date:
          application.interview
            ?.date
            ? new Date(
                application.interview.date
              )
                .toISOString()
                .slice(0, 16)
            : "",

        mode:
          application.interview
            ?.mode ||
          "Video call",

        notes:
          application.interview
            ?.notes ||
          "",
      });
    };

  return (
    <main className="container recruiter-dashboard-page">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <section className="recruiter-hero">

        <div>
          <span className="eyebrow">
            Recruiter workspace
          </span>

          <h1>
            Hiring command center.
          </h1>

          <p>
            Manage your jobs, discover strong
            candidates and move the right people
            through your hiring pipeline.
          </p>
        </div>

        <div className="recruiter-hero-actions">

          <button
            className="outline"
            type="button"
            onClick={load}
            disabled={
              loadingDashboard
            }
          >
            <RefreshCw
              size={16}
            />

            Refresh
          </button>

          <button
            className="btn"
            type="button"
            onClick={() =>
              setShowJobForm(true)
            }
          >
            <Plus
              size={18}
            />

            Post a job
          </button>

        </div>

      </section>

      {/* ================================================= */}
      {/* STATS */}
      {/* ================================================= */}

      <section className="recruiter-stat-grid">

        <div className="recruiter-stat-card">
          <div className="stat-icon">
            <Briefcase />
          </div>

          <span>
            Total jobs
          </span>

          <strong>
            {stats.totalJobs ||
              stats.jobs ||
              0}
          </strong>

          <small>
            All posted roles
          </small>
        </div>

        <div className="recruiter-stat-card">
          <div className="stat-icon">
            <BriefcaseBusiness />
          </div>

          <span>
            Active jobs
          </span>

          <strong>
            {stats.activeJobs ||
              0}
          </strong>

          <small>
            Currently accepting
            applications
          </small>
        </div>

        <div className="recruiter-stat-card">
          <div className="stat-icon">
            <Users />
          </div>

          <span>
            Applications
          </span>

          <strong>
            {stats.totalApplications ||
              stats.applications ||
              0}
          </strong>

          <small>
            Total candidates
          </small>
        </div>

        <div className="recruiter-stat-card">
          <div className="stat-icon">
            <UserCheck />
          </div>

          <span>
            Shortlisted
          </span>

          <strong>
            {stats.shortlisted ||
              0}
          </strong>

          <small>
            Strong candidates
          </small>
        </div>

        <div className="recruiter-stat-card">
          <div className="stat-icon">
            <CalendarDays />
          </div>

          <span>
            Interviews
          </span>

          <strong>
            {stats.interviews ||
              0}
          </strong>

          <small>
            Scheduled / completed
          </small>
        </div>

        <div className="recruiter-stat-card">
          <div className="stat-icon">
            <CheckCircle />
          </div>

          <span>
            Selected
          </span>

          <strong>
            {stats.selected ||
              0}
          </strong>

          <small>
            Successful hires
          </small>
        </div>

      </section>

      {/* ================================================= */}
      {/* PIPELINE */}
      {/* ================================================= */}

      <section className="pipeline-card">

        <div className="pipeline-heading">

          <div>
            <span className="eyebrow">
              Hiring pipeline
            </span>

            <h2>
              Candidate movement
            </h2>
          </div>

          <BarChart3
            size={24}
          />

        </div>

        <div className="pipeline">

          <div>
            <b>
              {stats.applications ||
                0}
            </b>
            <span>
              Applied
            </span>
          </div>

          <ChevronRight />

          <div>
            <b>
              {stats.underReview ||
                0}
            </b>
            <span>
              Under review
            </span>
          </div>

          <ChevronRight />

          <div>
            <b>
              {stats.shortlisted ||
                0}
            </b>
            <span>
              Shortlisted
            </span>
          </div>

          <ChevronRight />

          <div>
            <b>
              {stats.interviews ||
                0}
            </b>
            <span>
              Interview
            </span>
          </div>

          <ChevronRight />

          <div>
            <b>
              {stats.selected ||
                0}
            </b>
            <span>
              Selected
            </span>
          </div>

        </div>

      </section>

      {/* ================================================= */}
      {/* JOBS */}
      {/* ================================================= */}

      <section className="jobs-section">

        <div className="section-heading-row">

          <div>
            <span className="eyebrow">
              Recruitment
            </span>

            <h2 className="section-title">
              Your jobs
            </h2>
          </div>

          <span className="job-count">
            {jobs.length} roles
          </span>

        </div>

        <div className="recruiter-job-grid">

          {jobs.map(
            (job) => (
              <article
                className="recruiter-job-card"
                key={job._id}
              >

                <div className="job-card-top">

                  <div className="job-company-logo">
                    {job.company
                      ?.charAt(0)
                      ?.toUpperCase() ||
                      "J"}
                  </div>

                  <div className="job-status-row">

                    <span
                      className={
                        job.status ===
                        "active"
                          ? "job-live"
                          : "job-closed"
                      }
                    >
                      <CircleDot
                        size={10}
                      />

                      {job.status ===
                      "active"
                        ? "Active"
                        : "Closed"}
                    </span>

                  </div>

                </div>

                <h3>
                  {job.title}
                </h3>

                <p className="job-company">
                  <Building2
                    size={14}
                  />

                  {job.company}
                </p>

                <p className="job-location">
                  <MapPin
                    size={14}
                  />

                  {job.location ||
                    "Location not specified"}
                </p>

                <div className="job-pills">

                  <span>
                    {job.type}
                  </span>

                  <span>
                    {job.workMode ||
                      "On-site"}
                  </span>

                  <span>
                    {job.experience ||
                      "0-2 years"}
                  </span>

                </div>

                <div className="job-card-meta">

                  <div>
                    <Users
                      size={15}
                    />

                    <strong>
                      {job.applicationsCount ||
                        0}
                    </strong>

                    <span>
                      applicants
                    </span>
                  </div>

                  <small>
                    Posted{" "}
                    {formatDate(
                      job.createdAt
                    )}
                  </small>

                </div>

                <div className="job-card-actions">

                  <button
                    className="btn"
                    type="button"
                    onClick={() =>
                      openApplicants(
                        job
                      )
                    }
                  >
                    <Users
                      size={16}
                    />

                    View applicants
                  </button>

                  <button
                    className="outline"
                    type="button"
                    onClick={() =>
                      toggleJobStatus(
                        job
                      )
                    }
                  >
                    {job.status ===
                    "active"
                      ? "Close job"
                      : "Activate"}
                  </button>

                </div>

              </article>
            )
          )}

        </div>

        {!jobs.length && (
          <div className="recruiter-empty-state">

            <Briefcase
              size={36}
            />

            <h3>
              No jobs posted yet
            </h3>

            <p>
              Create your first job and
              start receiving applications.
            </p>

            <button
              className="btn"
              type="button"
              onClick={() =>
                setShowJobForm(true)
              }
            >
              <Plus
                size={17}
              />

              Post your first job
            </button>

          </div>
        )}

      </section>

      {/* ================================================= */}
      {/* APPLICANTS MODAL */}
      {/* ================================================= */}

      {selectedJob && (
        <div
          className="recruiter-modal-overlay"
          onClick={
            closeApplicants
          }
        >

          <section
            className="recruiter-applicants-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <header className="applicants-modal-header">

              <div>

                <span className="eyebrow">
                  Candidate management
                </span>

                <h2>
                  {selectedJob.title}
                </h2>

                <p>
                  {selectedJob.company}
                  {" · "}
                  {selectedJob.location}
                </p>

              </div>

              <button
                className="modal-close-button"
                type="button"
                onClick={
                  closeApplicants
                }
              >
                <X />
              </button>

            </header>

            {/* FILTERS */}

            <div className="applicant-toolbar">

              <div className="applicant-search">

                <Search
                  size={17}
                />

                <input
                  value={
                    appSearch
                  }
                  onChange={(event) =>
                    setAppSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search candidate by name, email or skill..."
                />

              </div>

              <select
                value={
                  appStatusFilter
                }
                onChange={(event) =>
                  setAppStatusFilter(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  All statuses
                </option>

                {statuses.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  )
                )}
              </select>

              <div className="applicant-result-count">
                {filteredApps.length}{" "}
                candidates
              </div>

            </div>

            {/* APPLICATIONS */}

            <div className="applicant-list">

              {loadingApps && (
                <div className="applicant-loading">

                  <RefreshCw
                    className="spin"
                    size={28}
                  />

                  <p>
                    Loading applicants...
                  </p>

                </div>
              )}

              {!loadingApps &&
                filteredApps.map(
                  (application) => {

                    const candidate =
                      application.candidate ||
                      {};

                    return (
                      <article
                        className="applicant-card-pro"
                        key={
                          application._id
                        }
                      >

                        <div className="candidate-main">

                          <div className="candidate-avatar">

                            {candidate.avatar ? (
                              <img
                                src={getFileUrl(
                                  candidate.avatar
                                )}
                                alt={
                                  candidate.name ||
                                  "Candidate"
                                }
                              />
                            ) : (
                              <span>
                                {candidate.name
                                  ?.charAt(
                                    0
                                  )
                                  ?.toUpperCase() ||
                                  "C"}
                              </span>
                            )}

                          </div>

                          <div className="candidate-content">

                            <div className="candidate-title-row">

                              <div>
                                <h3>
                                  {candidate.name ||
                                    "Candidate"}
                                </h3>

                                <p>
                                  <Mail
                                    size={13}
                                  />

                                  {candidate.email ||
                                    "Email unavailable"}
                                </p>
                              </div>

                              <span
                                className={`application-status ${statusClass(
                                  application.status
                                )}`}
                              >
                                {
                                  application.status
                                }
                              </span>

                            </div>

                            <div className="candidate-meta-row">

                              {candidate.phone && (
                                <span>
                                  <Phone
                                    size={13}
                                  />

                                  {
                                    candidate.phone
                                  }
                                </span>
                              )}

                              {candidate.location && (
                                <span>
                                  <MapPin
                                    size={13}
                                  />

                                  {
                                    candidate.location
                                  }
                                </span>
                              )}

                              <span>
                                <Briefcase
                                  size={13}
                                />

                                {getExperienceYears(
                                  candidate.experience
                                )}{" "}
                                years
                              </span>

                              <span>
                                <CalendarDays
                                  size={13}
                                />

                                Applied{" "}
                                {formatDate(
                                  application.createdAt
                                )}
                              </span>

                            </div>

                            <div className="candidate-skills">

                              {candidate.skills
                                ?.slice(
                                  0,
                                  7
                                )
                                .map(
                                  (
                                    skill
                                  ) => (
                                    <span
                                      key={
                                        skill
                                      }
                                    >
                                      {
                                        skill
                                      }
                                    </span>
                                  )
                                )}

                            </div>

                            <div className="candidate-bottom">

                              <div className="match-score">

                                <span>
                                  Match
                                </span>

                                <strong>
                                  {application.matchScore ||
                                    0}
                                  %
                                </strong>

                              </div>

                              {application.interview
                                ?.date && (
                                <div className="interview-mini">

                                  <CalendarDays
                                    size={14}
                                  />

                                  Interview:{" "}
                                  {formatDateTime(
                                    application
                                      .interview
                                      .date
                                  )}

                                </div>
                              )}

                            </div>

                          </div>

                        </div>

                        <div className="candidate-actions">

                          <select
                            value={
                              application.status
                            }
                            onChange={(
                              event
                            ) =>
                              updateApplicationStatus(
                                application,
                                event.target
                                  .value
                              )
                            }
                          >
                            {statuses.map(
                              (
                                status
                              ) => (
                                <option
                                  key={
                                    status
                                  }
                                  value={
                                    status
                                  }
                                >
                                  {status}
                                </option>
                              )
                            )}
                          </select>

                          <button
                            className="outline"
                            type="button"
                            onClick={() =>
                              openApplication(
                                application
                              )
                            }
                          >
                            <Eye
                              size={15}
                            />

                            Manage
                          </button>

                          <button
                            className="outline"
                            type="button"
                            onClick={() =>
                              setProfileCandidate(
                                candidate
                              )
                            }
                          >
                            <Users
                              size={15}
                            />

                            Profile
                          </button>

                          {candidate.resumeUrl && (
                            <>
                              <a
                                className="outline"
                                href={getFileUrl(
                                  candidate.resumeUrl
                                )}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <FileText
                                  size={15}
                                />

                                View Resume
                              </a>

                              <button
                                className="outline"
                                type="button"
                                onClick={() =>
                                  downloadResume(
                                    application._id,
                                    candidate.name
                                  )
                                }
                              >
                                <Download
                                  size={15}
                                />

                                Download
                              </button>
                            </>
                          )}

                        </div>

                      </article>
                    );
                  }
                )}

              {!loadingApps &&
                !filteredApps.length && (
                  <div className="applicant-empty">

                    <Users
                      size={38}
                    />

                    <h3>
                      No applicants found
                    </h3>

                    <p>
                      Try changing the search
                      or status filter.
                    </p>

                  </div>
                )}

            </div>

          </section>
        </div>
      )}

      {/* ================================================= */}
      {/* APPLICATION MANAGEMENT MODAL */}
      {/* ================================================= */}

      {selectedApplication && (
        <div
          className="recruiter-modal-overlay nested-overlay"
          onClick={() =>
            setSelectedApplication(
              null
            )
          }
        >

          <section
            className="application-management-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="modal-close-button"
              type="button"
              onClick={() =>
                setSelectedApplication(
                  null
                )
              }
            >
              <X />
            </button>

            <div className="management-header">

              <div className="management-avatar">

                {selectedApplication
                  .candidate
                  ?.avatar ? (
                  <img
                    src={getFileUrl(
                      selectedApplication
                        .candidate
                        .avatar
                    )}
                    alt=""
                  />
                ) : (
                  <span>
                    {selectedApplication
                      .candidate
                      ?.name
                      ?.charAt(
                        0
                      )
                      ?.toUpperCase() ||
                      "C"}
                  </span>
                )}

              </div>

              <div>

                <span className="eyebrow">
                  Application
                </span>

                <h2>
                  {
                    selectedApplication
                      .candidate
                      ?.name
                  }
                </h2>

                <p>
                  {
                    selectedApplication
                      .candidate
                      ?.email
                  }
                </p>

              </div>

              <span
                className={`application-status ${statusClass(
                  selectedApplication.status
                )}`}
              >
                {
                  selectedApplication.status
                }
              </span>

            </div>

            <div className="management-grid">

              <section className="management-card">

                <h3>
                  Application overview
                </h3>

                <div className="overview-grid">

                  <div>
                    <small>
                      Applied
                    </small>

                    <strong>
                      {formatDate(
                        selectedApplication.createdAt
                      )}
                    </strong>
                  </div>

                  <div>
                    <small>
                      Match score
                    </small>

                    <strong>
                      {selectedApplication.matchScore ||
                        0}
                      %
                    </strong>
                  </div>

                  <div>
                    <small>
                      Experience
                    </small>

                    <strong>
                      {getExperienceYears(
                        selectedApplication
                          .candidate
                          ?.experience
                      )}{" "}
                      years
                    </strong>
                  </div>

                  <div>
                    <small>
                      Location
                    </small>

                    <strong>
                      {selectedApplication
                        .candidate
                        ?.location ||
                        "Not provided"}
                    </strong>
                  </div>

                </div>

              </section>

              <section className="management-card">

                <h3>
                  Change status
                </h3>

                <select
                  className="large-status-select"
                  value={
                    selectedApplication.status
                  }
                  onChange={(event) =>
                    updateApplicationStatus(
                      selectedApplication,
                      event.target.value
                    )
                  }
                >
                  {statuses.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    )
                  )}
                </select>

              </section>

            </div>

            <section className="management-card">

              <div className="management-card-heading">

                <div>
                  <h3>
                    Interview
                  </h3>

                  <p>
                    Schedule or update the candidate
                    interview.
                  </p>
                </div>

                <button
                  className="btn"
                  type="button"
                  onClick={
                    openInterviewScheduler
                  }
                  disabled={savingInterview}
                >
                  <CalendarDays
                    size={16}
                  />

                  {selectedApplication
                    .interview?.date
                    ? "Reschedule interview"
                    : "Schedule interview"}
                </button>

              </div>

              {selectedApplication
                .interview
                ?.date ? (
                <div className="scheduled-interview">

                  <div>
                    <CalendarDays />

                    <div>
                      <small>
                        Interview
                      </small>

                      <strong>
                        {formatDateTime(
                          selectedApplication
                            .interview
                            .date
                        )}
                      </strong>
                    </div>
                  </div>

                  <div>
                    <Video />

                    <div>
                      <small>
                        Mode
                      </small>

                      <strong>
                        {selectedApplication
                          .interview
                          .mode ||
                          "Not specified"}
                      </strong>
                    </div>
                  </div>

                  <div className="scheduled-interview-actions">
                    <button
                      className="outline"
                      type="button"
                      onClick={
                        openInterviewScheduler
                      }
                      disabled={savingInterview}
                    >
                      <CalendarDays
                        size={15}
                      />
                      Reschedule
                    </button>

                    <button
                      className="danger-button"
                      type="button"
                      onClick={
                        cancelInterview
                      }
                      disabled={savingInterview}
                    >
                      Cancel interview
                    </button>
                  </div>

                </div>
              ) : (
                <div className="no-interview">
                  <Clock3
                    size={18}
                  />

                  No interview scheduled yet.
                </div>
              )}

            </section>

            <section className="management-card">

              <div className="management-card-heading">

                <div>
                  <h3>
                    Recruiter notes
                  </h3>

                  <p>
                    Private notes for your hiring team.
                  </p>
                </div>

                <button
                  className="outline"
                  type="button"
                  onClick={
                    saveNotes
                  }
                >
                  Save notes
                </button>

              </div>

              <textarea
                className="recruiter-notes"
                value={
                  notes
                }
                onChange={(event) =>
                  setNotes(
                    event.target.value
                  )
                }
                placeholder="Add interview feedback, candidate strengths, concerns, next steps..."
              />

            </section>

            <section className="management-card">

              <h3>
                Candidate documents
              </h3>

              <div className="document-actions">

                {selectedApplication
                  .candidate
                  ?.resumeUrl ? (
                  <>
                    <a
                      className="btn"
                      href={getFileUrl(
                        selectedApplication
                          .candidate
                          .resumeUrl
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FileText
                        size={17}
                      />

                      View resume
                    </a>

                    <button
                      className="outline"
                      type="button"
                      onClick={() =>
                        downloadResume(
                          selectedApplication._id,
                          selectedApplication
                            .candidate
                            ?.name
                        )
                      }
                    >
                      <Download
                        size={17}
                      />

                      Download resume
                    </button>
                  </>
                ) : (
                  <span className="no-resume">
                    Candidate has not uploaded a resume.
                  </span>
                )}

                <button
                  className="outline"
                  type="button"
                  onClick={() =>
                    setProfileCandidate(
                      selectedApplication.candidate
                    )
                  }
                >
                  <Users
                    size={17}
                  />

                  View full profile
                </button>

              </div>

            </section>

          </section>

        </div>
      )}

      {/* ================================================= */}
      {/* INTERVIEW MODAL */}
      {/* ================================================= */}

      {showInterview &&
        selectedApplication &&
        createPortal(
          <div
            className="recruiter-modal-overlay interview-scheduler-overlay"
            onClick={() =>
              !savingInterview &&
              setShowInterview(false)
            }
          >

            <section
              className="small-recruiter-modal interview-scheduler-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <button
                className="modal-close-button"
                type="button"
                onClick={() =>
                  setShowInterview(false)
                }
              >
                <X />
              </button>

              <span className="eyebrow">
                Interview scheduling
              </span>

              <h2>
                Schedule interview
              </h2>

              <p>
                Set interview details for{" "}
                <strong>
                  {
                    selectedApplication
                      .candidate
                      ?.name
                  }
                </strong>
                .
              </p>

              <div className="form-field">
                <label>
                  Date & time
                </label>

                <input
                  type="datetime-local"
                  value={
                    interviewForm.date
                  }
                  onChange={(event) =>
                    setInterviewForm(
                      (previous) => ({
                        ...previous,
                        date:
                          event.target
                            .value,
                      })
                    )
                  }
                />
              </div>

              <div className="form-field">
                <label>
                  Interview mode
                </label>

                <select
                  value={
                    interviewForm.mode
                  }
                  onChange={(event) =>
                    setInterviewForm(
                      (previous) => ({
                        ...previous,
                        mode:
                          event.target
                            .value,
                      })
                    )
                  }
                >
                  <option>
                    Video call
                  </option>

                  <option>
                    Phone call
                  </option>

                  <option>
                    In-office
                  </option>

                  <option>
                    Technical round
                  </option>

                  <option>
                    HR round
                  </option>
                </select>
              </div>

              <div className="form-field">
                <label>
                  Interview notes
                </label>

                <textarea
                  value={
                    interviewForm.notes
                  }
                  onChange={(event) =>
                    setInterviewForm(
                      (previous) => ({
                        ...previous,
                        notes:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="Meeting link, interviewer name, agenda..."
                />
              </div>

              <div className="interview-scheduler-footer">
                <button
                  className="outline"
                  type="button"
                  onClick={() =>
                    !savingInterview &&
                    setShowInterview(false)
                  }
                  disabled={savingInterview}
                >
                  Cancel
                </button>

                <button
                  className="btn"
                  type="button"
                  onClick={
                    scheduleInterview
                  }
                  disabled={savingInterview}
                >
                  <CalendarDays
                    size={17}
                  />

                  {savingInterview
                    ? "Saving..."
                    : selectedApplication
                        .interview?.date
                    ? "Save new time"
                    : "Schedule interview"}
                </button>
              </div>

            </section>

          </div>,
          document.body
        )}

      {/* ================================================= */}
      {/* CANDIDATE PROFILE */}
      {/* ================================================= */}

      {profileCandidate && (
        <div
          className="recruiter-modal-overlay nested-overlay"
          onClick={() =>
            setProfileCandidate(
              null
            )
          }
        >

          <section
            className="candidate-profile-pro-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="modal-close-button"
              type="button"
              onClick={() =>
                setProfileCandidate(
                  null
                )
              }
            >
              <X />
            </button>

            <div className="profile-pro-header">

              <div className="profile-pro-avatar">

                {profileCandidate.avatar ? (
                  <img
                    src={getFileUrl(
                      profileCandidate.avatar
                    )}
                    alt=""
                  />
                ) : (
                  <span>
                    {profileCandidate.name
                      ?.charAt(
                        0
                      )
                      ?.toUpperCase() ||
                      "C"}
                  </span>
                )}

              </div>

              <div>

                <span className="eyebrow">
                  Candidate profile
                </span>

                <h2>
                  {
                    profileCandidate.name
                  }
                </h2>

                <p>
                  <Mail
                    size={14}
                  />

                  {
                    profileCandidate.email
                  }
                </p>

                {profileCandidate.location && (
                  <p>
                    <MapPin
                      size={14}
                    />

                    {
                      profileCandidate.location
                    }
                  </p>
                )}

              </div>

            </div>

            <div className="profile-stat-row">

              <div>
                <strong>
                  {getExperienceYears(
                    profileCandidate.experience
                  )}
                </strong>

                <span>
                  Years experience
                </span>
              </div>

              <div>
                <strong>
                  {profileCandidate
                    .skills
                    ?.length ||
                    0}
                </strong>

                <span>
                  Skills
                </span>
              </div>

              <div>
                <strong>
                  {profileCandidate
                    .education
                    ?.length ||
                    0}
                </strong>

                <span>
                  Education
                </span>
              </div>

            </div>

            {profileCandidate.bio && (
              <section className="profile-pro-section">

                <h3>
                  About
                </h3>

                <p>
                  {
                    profileCandidate.bio
                  }
                </p>

              </section>
            )}

            <section className="profile-pro-section">

              <h3>
                Skills
              </h3>

              <div className="profile-skill-list">

                {profileCandidate.skills
                  ?.length ? (
                  profileCandidate.skills.map(
                    (skill) => (
                      <span
                        key={
                          skill
                        }
                      >
                        {skill}
                      </span>
                    )
                  )
                ) : (
                  <p>
                    No skills added.
                  </p>
                )}

              </div>

            </section>

            <section className="profile-pro-section">

              <h3>
                Education
              </h3>

              {profileCandidate.education
                ?.length ? (
                <div className="profile-education-list">

                  {profileCandidate.education.map(
                    (
                      education,
                      index
                    ) => (
                      <div
                        className="profile-education-item"
                        key={
                          education._id ||
                          index
                        }
                      >

                        <GraduationCap />

                        <div>

                          <strong>
                            {
                              education.degree
                            }
                          </strong>

                          <span>
                            {
                              education.institution
                            }
                          </span>

                          {education.fieldOfStudy && (
                            <small>
                              {
                                education.fieldOfStudy
                              }
                            </small>
                          )}

                          {(education.startYear ||
                            education.endYear) && (
                            <small>
                              {
                                education.startYear
                              }{" "}
                              -{" "}
                              {education.endYear ||
                                "Present"}
                            </small>
                          )}

                        </div>

                      </div>
                    )
                  )}

                </div>
              ) : (
                <p>
                  No education details available.
                </p>
              )}

            </section>

            <section className="profile-resume-box">

              <div>
                <FileText />

                <div>
                  <strong>
                    Resume
                  </strong>

                  <span>
                    {profileCandidate.resumeUrl
                      ? "Resume available"
                      : "No resume uploaded"}
                  </span>
                </div>
              </div>

              {profileCandidate.resumeUrl && (
                <a
                  className="btn"
                  href={getFileUrl(
                    profileCandidate.resumeUrl
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Eye
                    size={16}
                  />

                  View resume
                </a>
              )}

            </section>

          </section>

        </div>
      )}

      {/* ================================================= */}
      {/* CREATE JOB MODAL */}
      {/* ================================================= */}

      {showJobForm && (
        <div
          className="recruiter-modal-overlay"
          onClick={() =>
            !creating &&
            setShowJobForm(false)
          }
        >

          <form
            className="create-job-pro-modal"
            onSubmit={
              createJob
            }
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="modal-close-button"
              disabled={
                creating
              }
              onClick={() =>
                setShowJobForm(false)
              }
            >
              <X />
            </button>

            <span className="eyebrow">
              Recruiter
            </span>

            <h2>
              Create a new job
            </h2>

            <p>
              Add complete role details so candidates
              can understand the opportunity clearly.
            </p>

            <div className="create-job-section">

              <h3>
                Job basics
              </h3>

              <div className="create-job-grid">

                <div className="form-field">
                  <label>
                    Job title *
                  </label>

                  <input
                    required
                    value={
                      form.title
                    }
                    onChange={(event) =>
                      updateForm(
                        "title",
                        event.target.value
                      )
                    }
                    placeholder="Senior Backend Developer"
                  />
                </div>

                <div className="form-field">
                  <label>
                    Company *
                  </label>

                  <input
                    required
                    value={
                      form.company
                    }
                    onChange={(event) =>
                      updateForm(
                        "company",
                        event.target.value
                      )
                    }
                    placeholder="Company name"
                  />
                </div>

                <div className="form-field">
                  <label>
                    Location *
                  </label>

                  <input
                    required
                    value={
                      form.location
                    }
                    onChange={(event) =>
                      updateForm(
                        "location",
                        event.target.value
                      )
                    }
                    placeholder="Delhi / Bengaluru / Remote"
                  />
                </div>

                <div className="form-field">
                  <label>
                    Department
                  </label>

                  <input
                    value={
                      form.department
                    }
                    onChange={(event) =>
                      updateForm(
                        "department",
                        event.target.value
                      )
                    }
                    placeholder="Engineering"
                  />
                </div>

                <div className="form-field">
                  <label>
                    Industry
                  </label>

                  <input
                    value={
                      form.industry
                    }
                    onChange={(event) =>
                      updateForm(
                        "industry",
                        event.target.value
                      )
                    }
                    placeholder="Information Technology"
                  />
                </div>

                <div className="form-field">
                  <label>
                    Openings
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={
                      form.openings
                    }
                    onChange={(event) =>
                      updateForm(
                        "openings",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="form-field">
                  <label>
                    Job type
                  </label>

                  <select
                    value={
                      form.type
                    }
                    onChange={(event) =>
                      updateForm(
                        "type",
                        event.target.value
                      )
                    }
                  >
                    <option>
                      Full-time
                    </option>

                    <option>
                      Part-time
                    </option>

                    <option>
                      Contract
                    </option>

                    <option>
                      Internship
                    </option>
                  </select>
                </div>

                <div className="form-field">
                  <label>
                    Work mode
                  </label>

                  <select
                    value={
                      form.workMode
                    }
                    onChange={(event) =>
                      updateForm(
                        "workMode",
                        event.target.value
                      )
                    }
                  >
                    <option>
                      On-site
                    </option>

                    <option>
                      Hybrid
                    </option>

                    <option>
                      Remote
                    </option>
                  </select>
                </div>

                <div className="form-field">
                  <label>
                    Employment level
                  </label>

                  <select
                    value={
                      form.employmentLevel
                    }
                    onChange={(event) =>
                      updateForm(
                        "employmentLevel",
                        event.target.value
                      )
                    }
                  >
                    <option>
                      Internship
                    </option>

                    <option>
                      Entry level
                    </option>

                    <option>
                      Associate
                    </option>

                    <option>
                      Mid-Senior level
                    </option>

                    <option>
                      Director
                    </option>

                    <option>
                      Executive
                    </option>
                  </select>
                </div>

                <div className="form-field">
                  <label>
                    Education
                  </label>

                  <input
                    value={
                      form.education
                    }
                    onChange={(event) =>
                      updateForm(
                        "education",
                        event.target.value
                      )
                    }
                    placeholder="B.Tech / BCA / MCA"
                  />
                </div>

                <div className="form-field">
                  <label>
                    Notice period
                  </label>

                  <input
                    value={
                      form.noticePeriod
                    }
                    onChange={(event) =>
                      updateForm(
                        "noticePeriod",
                        event.target.value
                      )
                    }
                    placeholder="Immediate / 30 days"
                  />
                </div>

              </div>

            </div>

            <div className="create-job-section">

              <h3>
                Experience & salary
              </h3>

              <div className="create-job-grid">

                <div className="form-field">
                  <label>
                    Experience
                  </label>

                  <input
                    value={
                      form.experience
                    }
                    onChange={(event) =>
                      updateForm(
                        "experience",
                        event.target.value
                      )
                    }
                    placeholder="2-5 years"
                  />
                </div>

                <div className="form-field">
                  <label>
                    Minimum experience
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      form.experienceMin
                    }
                    onChange={(event) =>
                      updateForm(
                        "experienceMin",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="form-field">
                  <label>
                    Maximum experience
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      form.experienceMax
                    }
                    onChange={(event) =>
                      updateForm(
                        "experienceMax",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="form-field">
                  <label>
                    Salary display
                  </label>

                  <input
                    value={
                      form.salary
                    }
                    onChange={(event) =>
                      updateForm(
                        "salary",
                        event.target.value
                      )
                    }
                    placeholder="₹8-12 LPA"
                  />
                </div>

                <div className="form-field">
                  <label>
                    Minimum salary / year
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      form.salaryMin
                    }
                    onChange={(event) =>
                      updateForm(
                        "salaryMin",
                        event.target.value
                      )
                    }
                    placeholder="800000"
                  />
                </div>

                <div className="form-field">
                  <label>
                    Maximum salary / year
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      form.salaryMax
                    }
                    onChange={(event) =>
                      updateForm(
                        "salaryMax",
                        event.target.value
                      )
                    }
                    placeholder="1200000"
                  />
                </div>

              </div>

            </div>

            <div className="create-job-section">

              <h3>
                Skills
              </h3>

              <div className="form-field">

                <label>
                  Skills — comma separated
                </label>

                <input
                  value={
                    form.skills
                  }
                  onChange={(event) =>
                    updateForm(
                      "skills",
                      event.target.value
                    )
                  }
                  placeholder="Node.js, Express.js, MongoDB, REST API"
                />

              </div>

            </div>

            <div className="create-job-section">

              <h3>
                Job description
              </h3>

              <div className="form-field">

                <label>
                  Description *
                </label>

                <textarea
                  required
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    updateForm(
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Describe the role, team, product and responsibilities..."
                />

              </div>

              <div className="create-job-grid">

                <div className="form-field">
                  <label>
                    Responsibilities *
                  </label>

                  <textarea
                    required
                    value={
                      form.responsibilities
                    }
                    onChange={(event) =>
                      updateForm(
                        "responsibilities",
                        event.target.value
                      )
                    }
                    placeholder={
                      "Build backend APIs\nDesign scalable services\nWork with engineering team"
                    }
                  />
                </div>

                <div className="form-field">
                  <label>
                    Requirements *
                  </label>

                  <textarea
                    required
                    value={
                      form.requirements
                    }
                    onChange={(event) =>
                      updateForm(
                        "requirements",
                        event.target.value
                      )
                    }
                    placeholder={
                      "Strong JavaScript knowledge\nNode.js experience\nMongoDB knowledge"
                    }
                  />
                </div>

                <div className="form-field">
                  <label>
                    Nice to have
                  </label>

                  <textarea
                    value={
                      form.niceToHave
                    }
                    onChange={(event) =>
                      updateForm(
                        "niceToHave",
                        event.target.value
                      )
                    }
                    placeholder={
                      "AWS\nDocker\nRedis"
                    }
                  />
                </div>

                <div className="form-field">
                  <label>
                    Benefits & perks
                  </label>

                  <textarea
                    value={
                      form.benefits
                    }
                    onChange={(event) =>
                      updateForm(
                        "benefits",
                        event.target.value
                      )
                    }
                    placeholder={
                      "Health insurance\nFlexible work\nLearning budget"
                    }
                  />
                </div>

              </div>

            </div>

            <div className="create-job-section">

              <h3>
                Application settings
              </h3>

              <div className="create-job-grid">

                <div className="form-field">
                  <label>
                    Application deadline
                  </label>

                  <input
                    type="date"
                    value={
                      form.deadline
                    }
                    onChange={(event) =>
                      updateForm(
                        "deadline",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="form-field">
                  <label>
                    Application limit
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      form.applicationLimit
                    }
                    onChange={(event) =>
                      updateForm(
                        "applicationLimit",
                        event.target.value
                      )
                    }
                    placeholder="0 = unlimited"
                  />
                </div>

                <div className="form-field">
                  <label>
                    Company website
                  </label>

                  <input
                    type="url"
                    value={
                      form.companyWebsite
                    }
                    onChange={(event) =>
                      updateForm(
                        "companyWebsite",
                        event.target.value
                      )
                    }
                    placeholder="https://company.com"
                  />
                </div>

                <div className="form-field">
                  <label>
                    LinkedIn job link
                  </label>

                  <input
                    type="url"
                    value={
                      form.linkedinUrl
                    }
                    onChange={(event) =>
                      updateForm(
                        "linkedinUrl",
                        event.target.value
                      )
                    }
                    placeholder="https://linkedin.com/jobs/..."
                  />
                </div>

                <div className="form-field">
                  <label>
                    External apply URL
                  </label>

                  <input
                    type="url"
                    value={
                      form.externalApplyUrl
                    }
                    onChange={(event) =>
                      updateForm(
                        "externalApplyUrl",
                        event.target.value
                      )
                    }
                    placeholder="https://..."
                  />
                </div>

              </div>

            </div>

            <div className="create-job-footer">

              <button
                type="button"
                className="outline"
                disabled={
                  creating
                }
                onClick={() =>
                  setShowJobForm(false)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn"
                disabled={
                  creating
                }
              >
                <Plus
                  size={17}
                />

                {creating
                  ? "Publishing..."
                  : "Publish job"}
              </button>

            </div>

          </form>

        </div>
      )}

    </main>
  );
}