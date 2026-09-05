import {
  Bookmark,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MapPin,
  Share2,
  Users,
} from "lucide-react";


import {
  Link,
  useNavigate,
} from "react-router-dom";


import {
  useState,
} from "react";


import {
  useAuth,
} from "../context/AuthContext";


import api from "../services/api";


export default function JobCard({
  job,
  initialSaved = false,
  onSavedChange,
}) {

  const {
    user,
  } = useAuth();


  const navigate =
    useNavigate();


  const [
    saved,
    setSaved,
  ] = useState(
    initialSaved
  );


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    sharing,
    setSharing,
  ] = useState(false);


  const deadline =
    job.deadline
      ? new Date(
          job.deadline
        )
      : null;


  const deadlinePassed =
    deadline &&
    deadline <
      new Date();


  const limitReached =
    job.applicationLimit >
      0 &&
    job.applicationsCount >=
      job.applicationLimit;


  const isClosed =
    job.status !==
      "active" ||
    deadlinePassed ||
    limitReached;


  const daysLeft =
    deadline &&
    !deadlinePassed
      ? Math.ceil(
          (
            deadline.getTime() -
            Date.now()
          ) /
            86400000
        )
      : null;


  const handleSave =
    async (
      event
    ) => {
      event.preventDefault();

      event.stopPropagation();


      if (!user) {
        navigate(
          "/login"
        );

        return;
      }


      if (
        user.role !==
        "candidate"
      ) {
        return;
      }


      try {
        setSaving(true);


        if (saved) {
          await api.delete(
            `/jobs/${job._id}/save`
          );

          setSaved(false);

          onSavedChange?.(
            job._id,
            false
          );
        } else {
          await api.post(
            `/jobs/${job._id}/save`
          );

          setSaved(true);

          onSavedChange?.(
            job._id,
            true
          );
        }
      } catch (error) {
        console.error(
          "Save job error:",
          error
        );
      } finally {
        setSaving(false);
      }
    };


  const handleShare =
    async (
      event
    ) => {
      event.preventDefault();

      event.stopPropagation();


      try {
        setSharing(true);


        const url =
          `${window.location.origin}/jobs/${job._id}`;


        if (
          navigator.share
        ) {
          await navigator.share({
            title:
              job.title,
            text:
              `${job.title} at ${job.company}`,
            url,
          });
        } else {
          await navigator.clipboard.writeText(
            url
          );

          window.alert(
            "Job link copied!"
          );
        }
      } catch (error) {
        if (
          error?.name !==
          "AbortError"
        ) {
          console.error(
            "Share error:",
            error
          );
        }
      } finally {
        setSharing(false);
      }
    };


  return (
    <article
      className={`job-card premium-job-card ${
        isClosed
          ? "job-card-closed"
          : ""
      }`}
    >

      <div className="job-card-header">

        <div className="job-company-block">

          <div className="company-logo">

            {job.company
              ?.charAt(0)
              ?.toUpperCase() ||
              "J"}

          </div>

          <div>

            <p className="company-name">
              {job.company}
            </p>

            <span className="job-posted">
              {job.createdAt
                ? new Date(
                    job.createdAt
                  ).toLocaleDateString(
                    "en-IN",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }
                  )
                : "Recently posted"}
            </span>

          </div>

        </div>


        <div className="job-card-actions">

          {user?.role ===
            "candidate" && (

            <button
              type="button"
              className={`job-icon-btn ${
                saved
                  ? "saved"
                  : ""
              }`}
              onClick={
                handleSave
              }
              disabled={saving}
              title={
                saved
                  ? "Remove saved job"
                  : "Save job"
              }
            >

              <Bookmark
                size={18}
                fill={
                  saved
                    ? "currentColor"
                    : "none"
                }
              />

            </button>

          )}


          <button
            type="button"
            className="job-icon-btn"
            onClick={
              handleShare
            }
            disabled={
              sharing
            }
            title="Share job"
          >

            <Share2
              size={17}
            />

          </button>

        </div>

      </div>


      <Link
        to={`/jobs/${job._id}`}
        className="job-card-main-link"
      >

        <div className="job-title-row">

          <h3>
            {job.title}
          </h3>

          <span
            className={`job-status-pill ${
              isClosed
                ? "closed"
                : "active"
            }`}
          >

            {isClosed
              ? "Closed"
              : "Actively hiring"}

          </span>

        </div>


        <div className="job-primary-meta">

          <span>
            <MapPin
              size={15}
            />

            {job.location ||
              "Multiple locations"}

          </span>


          <span>
            <Clock3
              size={15}
            />

            {job.experience ||
              "0-2 years"}

          </span>


          <span>
            <Building2
              size={15}
            />

            {job.workMode ||
              "On-site"}

          </span>

        </div>


        <div className="job-detail-chips">

          <span>
            {job.type}
          </span>


          {job.workMode && (
            <span>
              {job.workMode}
            </span>
          )}


          {job.salary && (
            <span className="salary-chip">
              {job.salary}
            </span>
          )}

        </div>


        <div className="skills">

          {job.skills
            ?.slice(0, 5)
            .map(
              (skill) => (
                <span
                  key={skill}
                >
                  {skill}
                </span>
              )
            )}


          {job.skills?.length >
            5 && (
            <span>
              +
              {job.skills.length -
                5}
            </span>
          )}

        </div>


        <div className="job-card-bottom">

          <div className="job-card-stats">

            <span>
              <Users
                size={14}
              />

              {job.applicationsCount ||
                0}{" "}
              applicants
            </span>


            {job.applicationLimit >
              0 && (

              <span>
                Limit:{" "}
                {
                  job.applicationLimit
                }
              </span>

            )}

          </div>


          <div className="job-deadline">

            {deadlinePassed ? (
              <span className="deadline-danger">
                Deadline passed
              </span>
            ) : limitReached ? (
              <span className="deadline-danger">
                Applications full
              </span>
            ) : daysLeft !==
              null ? (
              <span
                className={
                  daysLeft <= 3
                    ? "deadline-warning"
                    : ""
                }
              >
                {daysLeft === 0
                  ? "Ends today"
                  : `${daysLeft} days left`}
              </span>
            ) : (
              <span>
                No deadline
              </span>
            )}

          </div>

        </div>

      </Link>


      <div className="job-card-footer">

        <span className="verified-job">

          <CheckCircle2
            size={14}
          />

          Verified opportunity

        </span>


        {(job.externalApplyUrl ||
          job.linkedinUrl) && (

          <a
            href={
              job.externalApplyUrl ||
              job.linkedinUrl
            }
            target="_blank"
            rel="noreferrer"
            className="external-job-link"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            Apply externally

            <ExternalLink
              size={13}
            />

          </a>

        )}

      </div>

    </article>
  );
}