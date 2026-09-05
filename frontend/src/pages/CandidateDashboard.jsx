import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  UserRound,
  ArrowRight,
  CalendarDays,
} from "lucide-react";

import { Link } from "react-router-dom";

import api from "../services/api";

import "../styles/profile.css";

export default function CandidateDashboard() {
  const [profile, setProfile] =
    useState(null);

  const [applications, setApplications] =
    useState([]);

  const [jobs, setJobs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [
        profileResponse,
        applicationsResponse,
        jobsResponse,
      ] = await Promise.all([
        api.get("/profile"),
        api.get("/applications/my"),
        api.get("/jobs?limit=6"),
      ]);

      const user =
        profileResponse.data?.profile ||
        profileResponse.data;

      const apps =
        applicationsResponse.data?.applications ||
        applicationsResponse.data ||
        [];

      const jobsData =
        jobsResponse.data?.jobs ||
        jobsResponse.data?.data ||
        jobsResponse.data ||
        [];

      setProfile(user);
      setApplications(
        Array.isArray(apps) ? apps : []
      );

      setJobs(
        Array.isArray(jobsData)
          ? jobsData
          : []
      );
    } catch (error) {
      console.error(
        "Candidate Dashboard Error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const profileCompletion = useMemo(() => {
    if (!profile) return 0;

    const fields = [
      profile.name,
      profile.phone,
      profile.location,
      profile.headline,
      profile.bio,
      profile.skills?.length,
      profile.education?.length,
      profile.experience?.length,
      profile.resumeUrl,
      profile.linkedinUrl,
    ];

    const completed =
      fields.filter(Boolean).length;

    return Math.round(
      (completed / fields.length) * 100
    );
  }, [profile]);

  const stats = useMemo(() => {
    return {
      total: applications.length,

      active: applications.filter((item) =>
        [
          "Applied",
          "Under Review",
          "Shortlisted",
          "Interview Scheduled",
          "Interviewed",
        ].includes(item.status)
      ).length,

      interviews: applications.filter(
        (item) =>
          item.status ===
          "Interview Scheduled"
      ).length,

      selected: applications.filter(
        (item) =>
          item.status === "Selected"
      ).length,
    };
  }, [applications]);

  const upcomingInterview =
    applications.find(
      (item) =>
        item.status ===
          "Interview Scheduled" &&
        item.interview?.date
    );

  if (loading) {
    return (
      <main className="container">
        <div className="empty">
          Loading dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="container candidate-dashboard">
      <div className="candidate-welcome">
        <div>
          <span className="eyebrow">
            Candidate dashboard
          </span>

          <h1>
            Welcome back,{" "}
            {profile?.name?.split(" ")[0] ||
              "Candidate"}
            .
          </h1>

          <p>
            Keep your profile strong and stay on top
            of your job search.
          </p>
        </div>

        <Link
          to="/profile"
          className="btn"
        >
          <UserRound size={17} />
          Edit profile
        </Link>
      </div>

      <div className="candidate-dashboard-grid">
        <div className="profile-strength-card">
          <div className="profile-strength-circle">
            <strong>
              {profileCompletion}%
            </strong>
          </div>

          <div>
            <span className="eyebrow">
              Profile strength
            </span>

            <h3>
              {profileCompletion >= 80
                ? "Recruiter ready"
                : "Complete your profile"}
            </h3>

            <p>
              A complete profile improves your
              chances of getting noticed.
            </p>

            <Link to="/profile">
              Complete profile{" "}
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="candidate-stat-grid">
          <div>
            <Briefcase />
            <strong>{stats.total}</strong>
            <span>Applications</span>
          </div>

          <div>
            <Clock3 />
            <strong>{stats.active}</strong>
            <span>In progress</span>
          </div>

          <div>
            <CalendarDays />
            <strong>{stats.interviews}</strong>
            <span>Interviews</span>
          </div>

          <div>
            <CheckCircle2 />
            <strong>{stats.selected}</strong>
            <span>Selected</span>
          </div>
        </div>
      </div>

      {upcomingInterview && (
        <section className="dashboard-section">
          <div className="dashboard-section-head">
            <div>
              <span className="eyebrow">
                Next step
              </span>

              <h2>
                Upcoming interview
              </h2>
            </div>
          </div>

          <div className="upcoming-interview-card">
            <CalendarDays size={24} />

            <div>
              <strong>
                {upcomingInterview.job?.title}
              </strong>

              <span>
                {upcomingInterview.job?.company}
              </span>
            </div>

            <div>
              <strong>
                {new Date(
                  upcomingInterview.interview.date
                ).toLocaleString(
                  "en-IN"
                )}
              </strong>

              <span>
                {upcomingInterview.interview.mode ||
                  "Interview"}
              </span>
            </div>

            <Link
              to="/applications"
              className="outline"
            >
              View application
            </Link>
          </div>
        </section>
      )}

      <section className="dashboard-section">
        <div className="dashboard-section-head">
          <div>
            <span className="eyebrow">
              Application pipeline
            </span>

            <h2>
              Recent applications
            </h2>
          </div>

          <Link
            to="/applications"
            className="outline"
          >
            View all
            <ArrowRight size={15} />
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="dashboard-empty">
            <FileText size={30} />

            <h3>
              No applications yet
            </h3>

            <p>
              Find a role that matches your skills and
              start applying.
            </p>

            <Link
              to="/jobs"
              className="btn"
            >
              Browse jobs
            </Link>
          </div>
        ) : (
          <div className="dashboard-application-list">
            {applications
              .slice(0, 5)
              .map((application) => (
                <div
                  className="dashboard-application-item"
                  key={application._id}
                >
                  <div className="company-logo">
                    {application.job?.company
                      ?.charAt(0)
                      ?.toUpperCase() || "J"}
                  </div>

                  <div>
                    <strong>
                      {application.job?.title}
                    </strong>

                    <span>
                      {application.job?.company}
                    </span>
                  </div>

                  <span className="candidate-status">
                    {application.status}
                  </span>

                  <Link
                    to="/applications"
                    className="outline"
                  >
                    Details
                  </Link>
                </div>
              ))}
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-head">
          <div>
            <span className="eyebrow">
              Discover opportunities
            </span>

            <h2>
              Latest jobs
            </h2>
          </div>

          <Link
            to="/jobs"
            className="outline"
          >
            Browse all
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="recommended-job-grid">
          {jobs.slice(0, 6).map((job) => (
            <Link
              className="recommended-job-card"
              to={`/jobs/${job._id}`}
              key={job._id}
            >
              <div className="company-logo">
                {job.company
                  ?.charAt(0)
                  ?.toUpperCase() || "J"}
              </div>

              <h3>{job.title}</h3>

              <p>
                {job.company}
              </p>

              {job.location && (
                <span>
                  <MapPin size={14} />
                  {job.location}
                </span>
              )}

              <div className="recommended-job-bottom">
                <span>
                  {job.type}
                </span>

                <span>
                  {job.workMode}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}