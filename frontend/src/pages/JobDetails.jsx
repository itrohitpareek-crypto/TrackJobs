import {
  ArrowLeft,
  Bookmark,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MapPin,
  Share2,
  Send,
  Users,
} from "lucide-react";


import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";


import {
  useEffect,
  useState,
} from "react";


import api from "../services/api";


import {
  useAuth,
} from "../context/AuthContext";


export default function JobDetails() {

  const {
    id,
  } = useParams();


  const {
    user,
  } = useAuth();


  const navigate =
    useNavigate();


  const [
    job,
    setJob,
  ] = useState(null);


  const [
    letter,
    setLetter,
  ] = useState("");


  const [
    message,
    setMessage,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    applying,
    setApplying,
  ] = useState(false);


  const [
    saved,
    setSaved,
  ] = useState(false);


  useEffect(() => {

    const loadJob =
      async () => {

        try {
          const response =
            await api.get(
              `/jobs/${id}`
            );


          setJob(
            response.data
          );
        } catch (error) {
          console.error(
            "Job details error:",
            error
          );
        } finally {
          setLoading(false);
        }
      };


    loadJob();

  }, [id]);


  useEffect(() => {

    const loadSaved =
      async () => {

        if (
          !user ||
          user.role !==
            "candidate"
        ) {
          return;
        }


        try {
          const response =
            await api.get(
              "/jobs/saved/list"
            );


          setSaved(
            (
              response.data
                .jobs ||
              response.data ||
              []
            ).some(
              (item) =>
                item._id === id
            )
          );
        } catch (error) {
          console.error(
            "Saved status error:",
            error
          );
        }
      };


    loadSaved();

  }, [
    user,
    id,
  ]);


  if (loading) {
    return (
      <div className="empty">
        Loading job...
      </div>
    );
  }


  if (!job) {
    return (
      <div className="empty">
        <h3>
          Job not found
        </h3>

        <Link
          to="/jobs"
          className="btn"
        >
          Back to jobs
        </Link>
      </div>
    );
  }


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


  const canApply =
    job.status ===
      "active" &&
    !deadlinePassed &&
    !limitReached;


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


  const toggleSave =
    async () => {

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

        if (saved) {

          await api.delete(
            `/jobs/${id}/save`
          );


          setSaved(false);

        } else {

          await api.post(
            `/jobs/${id}/save`
          );


          setSaved(true);
        }

      } catch (error) {

        setMessage(
          error.response
            ?.data
            ?.message ||
            "Could not save job."
        );
      }
    };


  const shareJob =
    async () => {

      const url =
        window.location.href;


      try {

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


          setMessage(
            "Job link copied to clipboard."
          );
        }

      } catch (error) {

        if (
          error?.name !==
          "AbortError"
        ) {
          console.error(
            error
          );
        }
      }
    };


  const apply =
    async () => {

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
        setMessage(
          "Only candidates can apply for jobs."
        );

        return;
      }


      if (!canApply) {
        return;
      }


      try {

        setApplying(true);

        setMessage("");


        await api.post(
          `/applications/job/${id}`,
          {
            coverLetter:
              letter,
          }
        );


        setMessage(
          "Application submitted successfully."
        );

      } catch (error) {

        setMessage(
          error.response
            ?.data
            ?.message ||
            "Could not submit application."
        );

      } finally {

        setApplying(false);
      }
    };


  return (
    <main className="container detail-page">

      <Link
        to="/jobs"
        className="back"
      >

        <ArrowLeft
          size={17}
        />

        Back to jobs

      </Link>


      <div className="detail-grid">

        <article className="detail-main premium-detail-card">

          <div className="detail-company-head">

            <div className="company-logo big">

              {job.company
                ?.charAt(0)
                ?.toUpperCase() ||
                "J"}

            </div>


            <div className="detail-company-copy">

              <div className="detail-badge-row">

                <span className="pill">
                  {job.type}
                </span>


                <span className="pill">
                  {job.workMode ||
                    "On-site"}
                </span>


                <span className="verified-detail">

                  <CheckCircle2
                    size={14}
                  />

                  Verified

                </span>

              </div>


              <h1>
                {job.title}
              </h1>


              <p className="company detail-company-name">

                <Building2
                  size={17}
                />

                {job.company}

              </p>

            </div>


            <div className="detail-top-actions">

              {user?.role ===
                "candidate" && (

                <button
                  type="button"
                  className={`job-action-button ${
                    saved
                      ? "saved"
                      : ""
                  }`}
                  onClick={
                    toggleSave
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

                  {saved
                    ? "Saved"
                    : "Save"}

                </button>

              )}


              <button
                type="button"
                className="job-action-button"
                onClick={
                  shareJob
                }
              >

                <Share2
                  size={18}
                />

                Share

              </button>

            </div>

          </div>


          <div className="detail-meta-grid">

            <div>

              <MapPin
                size={18}
              />

              <span>
                <small>
                  Location
                </small>

                <strong>
                  {job.location ||
                    "Multiple locations"}
                </strong>
              </span>

            </div>


            <div>

              <Clock3
                size={18}
              />

              <span>
                <small>
                  Experience
                </small>

                <strong>
                  {job.experience ||
                    "0-2 years"}
                </strong>
              </span>

            </div>


            <div>

              <Building2
                size={18}
              />

              <span>
                <small>
                  Work mode
                </small>

                <strong>
                  {job.workMode ||
                    "On-site"}
                </strong>
              </span>

            </div>


            <div>

              <Users
                size={18}
              />

              <span>
                <small>
                  Applicants
                </small>

                <strong>
                  {job.applicationsCount ||
                    0}

                  {job.applicationLimit >
                    0 &&
                    ` / ${job.applicationLimit}`}
                </strong>
              </span>

            </div>

          </div>


          <section className="detail-section">

            <h2>
              About the role
            </h2>

            <p className="long">
              {job.description ||
                "The recruiter has not provided a detailed description yet."}
            </p>

          </section>


          <section className="detail-section">

            <h2>
              Skills you'll use
            </h2>


            <div className="skills bigskills">

              {job.skills?.map(
                (
                  skill
                ) => (

                  <span
                    key={
                      skill
                    }
                  >
                    {skill}
                  </span>

                )
              )}

            </div>

          </section>


          {job.requirements
            ?.length >
            0 && (

            <section className="detail-section">

              <h2>
                Requirements
              </h2>


              <div className="requirements-list">

                {job.requirements.map(
                  (
                    requirement,
                    index
                  ) => (

                    <div
                      className="requirement-item"
                      key={
                        `${requirement}-${index}`
                      }
                    >

                      <CheckCircle2
                        size={17}
                      />

                      <span>
                        {
                          requirement
                        }
                      </span>

                    </div>

                  )
                )}

              </div>

            </section>

          )}


          <section className="detail-section">

            <h2>
              Application timeline
            </h2>


            <div className="timeline-card">

              <CalendarDays
                size={20}
              />

              <div>

                <strong>
                  Application deadline
                </strong>

                <span>
                  {deadline
                    ? deadline.toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )
                    : "No fixed deadline"}
                </span>

              </div>


              {daysLeft !==
                null && (

                <b>
                  {daysLeft ===
                  0
                    ? "Today"
                    : `${daysLeft} days left`}
                </b>

              )}

            </div>

          </section>


          {(job.externalApplyUrl ||
            job.linkedinUrl) && (

            <section className="external-apply-box">

              <div>

                <ExternalLink
                  size={20}
                />

                <div>

                  <strong>
                    Apply through recruiter
                  </strong>

                  <span>
                    This role also accepts
                    applications through
                    an external platform.
                  </span>

                </div>

              </div>


              <a
                href={
                  job.externalApplyUrl ||
                  job.linkedinUrl
                }
                target="_blank"
                rel="noreferrer"
                className="outline"
              >

                Open application

                <ExternalLink
                  size={15}
                />

              </a>

            </section>

          )}

        </article>


        <aside className="apply-card premium-apply-card">

          <div className="apply-card-status">

            <span
              className={
                canApply
                  ? "status-dot active"
                  : "status-dot"
              }
            />

            <span>
              {canApply
                ? "Applications open"
                : "Applications closed"}
            </span>

          </div>


          <h3>
            Apply for this role
          </h3>


          <p>
            Your profile skills
            will be matched
            against this
            opportunity.
          </p>


          <div className="apply-summary">

            <div>

              <span>
                Salary
              </span>

              <strong>
                {job.salary ||
                  "Competitive"}
              </strong>

            </div>


            <div>

              <span>
                Experience
              </span>

              <strong>
                {job.experience ||
                  "0-2 years"}
              </strong>

            </div>

          </div>


          {user?.role ===
            "candidate" ? (

            <>

              <label className="apply-label">
                Cover letter
              </label>


              <textarea
                value={
                  letter
                }
                onChange={(
                  event
                ) =>
                  setLetter(
                    event.target.value
                  )
                }
                placeholder="Tell the recruiter why you're a great fit..."
              />


              <button
                type="button"
                className="btn full"
                onClick={
                  apply
                }
                disabled={
                  applying ||
                  !canApply
                }
              >

                <Send
                  size={17}
                />

                {applying
                  ? "Submitting..."
                  : canApply
                  ? "Submit application"
                  : "Applications closed"}

              </button>

            </>

          ) : user ? (

            <div className="login-apply-note">

              <p>
                Recruiter accounts
                cannot apply to jobs.
              </p>

            </div>

          ) : (

            <Link
              className="btn full"
              to="/login"
            >

              Sign in to apply

            </Link>

          )}


          {message && (

            <div
              className={
                message.includes(
                  "successfully"
                ) ||
                message.includes(
                  "copied"
                )
                  ? "success"
                  : "error"
              }
            >
              {message}
            </div>

          )}

        </aside>

      </div>

    </main>
  );
}