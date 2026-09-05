import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  MapPin,
  Search,
  XCircle,
} from "lucide-react";

import { Link } from "react-router-dom";
import api from "../services/api";

const statuses = [
  "All",
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview Scheduled",
  "Interviewed",
  "Selected",
  "Rejected",
  "Withdrawn",
];

const statusClass = (status) =>
  `candidate-status status-${status
    ?.toLowerCase()
    .replaceAll(" ", "-")}`;

export default function Applications() {
  const [applications, setApplications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("All");

  const [selected, setSelected] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [withdrawing, setWithdrawing] =
    useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const response = await api.get(
        "/applications/my"
      );

      setApplications(
        response.data?.applications ||
          response.data ||
          []
      );
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to load applications."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const job = application.job;

      const matchesSearch =
        !search.trim() ||
        job?.title
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        job?.company
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        status === "All" ||
        application.status === status;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    applications,
    search,
    status,
  ]);

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

      rejected: applications.filter(
        (item) =>
          item.status === "Rejected"
      ).length,
    };
  }, [applications]);

  const withdraw = async (application) => {
    const confirmed = window.confirm(
      "Are you sure you want to withdraw this application?"
    );

    if (!confirmed) return;

    try {
      setWithdrawing(true);

      await api.patch(
        `/applications/${application._id}/withdraw`,
        {
          reason:
            "Candidate withdrew the application",
        }
      );

      setMessage(
        "Application withdrawn successfully."
      );

      setSelected(null);

      await loadApplications();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to withdraw application."
      );
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <main className="container">
        <div className="empty">
          Loading applications...
        </div>
      </main>
    );
  }

  return (
    <main className="container applications-page">
      <div className="page-head">
        <div>
          <span className="eyebrow">
            Candidate workspace
          </span>

          <h1>Track your applications.</h1>

          <p>
            Follow every opportunity from application
            to final decision.
          </p>
        </div>
      </div>

      {message && (
        <div className="success">
          {message}
        </div>
      )}

      <div className="application-stat-grid">
        <div>
          <Briefcase />
          <strong>{stats.total}</strong>
          <span>Total applications</span>
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

        <div>
          <XCircle />
          <strong>{stats.rejected}</strong>
          <span>Rejected</span>
        </div>
      </div>

      <div className="application-toolbar">
        <div className="application-search">
          <Search size={18} />

          <input
            placeholder="Search applications..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value)
          }
        >
          {statuses.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          ))}
        </select>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="empty application-empty">
          <Briefcase size={30} />

          <h3>
            No applications found
          </h3>

          <p>
            Apply to jobs and they will appear here.
          </p>

          <Link
            to="/jobs"
            className="btn"
          >
            Browse jobs
          </Link>
        </div>
      ) : (
        <div className="applications-list">
          {filteredApplications.map(
            (application) => {
              const job = application.job;

              return (
                <article
                  className="application-card"
                  key={application._id}
                >
                  <div className="application-company-logo">
                    {job?.company
                      ?.charAt(0)
                      ?.toUpperCase() || "J"}
                  </div>

                  <div className="application-main">
                    <div className="application-top">
                      <div>
                        <h3>
                          {job?.title ||
                            "Job unavailable"}
                        </h3>

                        <p>
                          {job?.company ||
                            "Company"}
                        </p>
                      </div>

                      <span
                        className={statusClass(
                          application.status
                        )}
                      >
                        {application.status}
                      </span>
                    </div>

                    <div
                      className="application-meta"
                      style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        flexWrap: "wrap",
                        gap: "8px 18px",
                        textAlign: "left",
                      }}
                    >
                      {job?.location && (
                        <span>
                          <MapPin size={14} />
                          {job.location}
                        </span>
                      )}

                      <span>
                        Applied{" "}
                        {new Date(
                          application.createdAt
                        ).toLocaleDateString(
                          "en-IN"
                        )}
                      </span>

                      {application.matchScore > 0 && (
                        <span>
                          {application.matchScore}%
                          skill match
                        </span>
                      )}
                    </div>

                    <div className="application-actions">
                      {job?._id && (
                        <Link
                          to={`/jobs/${job._id}`}
                          className="outline"
                        >
                          View job
                        </Link>
                      )}

                      <button
                        className="outline"
                        onClick={() =>
                          setSelected(
                            application
                          )
                        }
                      >
                        <Eye size={15} />
                        Details
                      </button>

                      {![
                        "Selected",
                        "Rejected",
                        "Withdrawn",
                      ].includes(
                        application.status
                      ) && (
                        <button
                          className="danger-button"
                          onClick={() =>
                            withdraw(
                              application
                            )
                          }
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}

      {selected && (
        <div
          className="modal-bg"
          onClick={() =>
            setSelected(null)
          }
        >
          <div
            className="modal wide application-detail-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="close"
              onClick={() =>
                setSelected(null)
              }
            >
              ×
            </button>

            <span className="eyebrow">
              Application details
            </span>

            <h2>
              {selected.job?.title}
            </h2>

            <p className="modal-subtitle">
              {selected.job?.company}
            </p>

            <div className="application-detail-grid">
              <div>
                <span>Status</span>

                <strong>
                  {selected.status}
                </strong>
              </div>

              <div>
                <span>Applied on</span>

                <strong>
                  {new Date(
                    selected.createdAt
                  ).toLocaleDateString(
                    "en-IN"
                  )}
                </strong>
              </div>

              <div>
                <span>Skill match</span>

                <strong>
                  {selected.matchScore || 0}%
                </strong>
              </div>

              <div>
                <span>Work mode</span>

                <strong>
                  {selected.job?.workMode ||
                    "Not specified"}
                </strong>
              </div>
            </div>

            {selected.interview?.date && (
              <section className="application-interview-box">
                <h3>
                  Interview scheduled
                </h3>

                <p>
                  {new Date(
                    selected.interview.date
                  ).toLocaleString(
                    "en-IN"
                  )}
                </p>

                {selected.interview.mode && (
                  <span>
                    Mode:{" "}
                    {selected.interview.mode}
                  </span>
                )}

                {selected.interview.notes && (
                  <p>
                    {selected.interview.notes}
                  </p>
                )}
              </section>
            )}

            {selected.coverLetter && (
              <section>
                <h3>Cover letter</h3>

                <p className="long">
                  {selected.coverLetter}
                </p>
              </section>
            )}

            {![
              "Selected",
              "Rejected",
              "Withdrawn",
            ].includes(
              selected.status
            ) && (
              <button
                className="danger-button"
                disabled={withdrawing}
                onClick={() =>
                  withdraw(selected)
                }
              >
                {withdrawing
                  ? "Withdrawing..."
                  : "Withdraw application"}
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}