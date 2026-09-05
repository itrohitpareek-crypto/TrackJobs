import {
  useEffect,
  useState,
} from "react";

import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ClipboardList,
  Code2,
  Headset,
  LineChart,
  Megaphone,
  Palette,
  Quote,
  Rocket,
  Search,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  Zap,
  ArrowRight,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import JobCard from "../components/JobCard";
import api from "../services/api";


const CATEGORIES = [
  {
    label: "Software Development",
    query: "Software Developer",
    icon: Code2,
    count: "1,200+ jobs",
  },
  {
    label: "Design",
    query: "Product Designer",
    icon: Palette,
    count: "310+ jobs",
  },
  {
    label: "Marketing",
    query: "Marketing",
    icon: Megaphone,
    count: "480+ jobs",
  },
  {
    label: "Sales & Business",
    query: "Sales",
    icon: LineChart,
    count: "540+ jobs",
  },
  {
    label: "Finance",
    query: "Finance",
    icon: Wallet,
    count: "260+ jobs",
  },
  {
    label: "Customer Support",
    query: "Customer Support",
    icon: Headset,
    count: "190+ jobs",
  },
];


const STEPS = [
  {
    icon: UserCheck,
    title: "Create your profile",
    text: "Add your skills, education, and resume once — reuse it for every application.",
  },
  {
    icon: SearchCheck,
    title: "Find the right role",
    text: "Filter by skills, salary, work mode, and experience to see only relevant openings.",
  },
  {
    icon: ClipboardList,
    title: "Apply in one click",
    text: "Track every application's status from a single dashboard, end to end.",
  },
  {
    icon: Rocket,
    title: "Get hired",
    text: "Chat with recruiters, schedule interviews, and land the offer.",
  },
];


const TESTIMONIALS = [
  {
    quote:
      "I found my current role within two weeks of signing up. The skill-match scoring actually pointed me to jobs I was a strong fit for.",
    name: "Ananya Sharma",
    role: "Frontend Engineer, hired via JobTrack Pro",
  },
  {
    quote:
      "As a recruiter, the applicant pipeline saved us hours every week. We could see match scores and resumes without leaving the dashboard.",
    name: "Rohan Mehta",
    role: "Talent Lead, Nova Labs",
  },
  {
    quote:
      "Clean interface, real job postings, and I always knew exactly where my application stood. No more guessing games.",
    name: "Priya Nair",
    role: "Backend Developer",
  },
];


export default function Home() {
  const navigate = useNavigate();

  const [
    latestJobs,
    setLatestJobs,
  ] = useState([]);

  const [
    jobsLoading,
    setJobsLoading,
  ] = useState(true);

  const [
    stats,
    setStats,
  ] = useState({
    totalJobs: null,
    companies: null,
  });


  useEffect(() => {

    let active = true;

    const loadLatestJobs = async () => {

      try {

        const response = await api.get(
          "/jobs?limit=6"
        );

        if (!active) return;

        const jobs =
          response.data?.jobs || [];

        setLatestJobs(jobs);

        const companies = new Set(
          jobs.map((job) => job.company)
        );

        setStats({
          totalJobs:
            response.data?.total ?? jobs.length,
          companies: companies.size,
        });

      } catch (error) {

        console.error(
          "Latest jobs error:",
          error
        );

      } finally {
        if (active) setJobsLoading(false);
      }
    };

    loadLatestJobs();

    return () => {
      active = false;
    };

  }, []);


  const handleSearch = (event) => {
    if (event.key === "Enter") {
      const value = event.currentTarget.value.trim();

      if (value) {
        navigate(
          `/jobs?q=${encodeURIComponent(value)}`
        );
      } else {
        navigate("/jobs");
      }
    }
  };


  return (
    <>
      {/* =====================================================
          HERO SECTION
      ===================================================== */}

      <section className="hero">

        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />

        <div className="hero-copy">

          <div className="eyebrow">
            <span className="eyebrow-icon">
              <Zap size={14} />
            </span>
            Your next opportunity starts here
          </div>

          <h1>
            Hire smarter.
            <span>Get hired faster.</span>
          </h1>

          <p>
            A modern hiring platform built for candidates and recruiters.
            Discover relevant roles, evaluate talent, and manage the hiring
            journey from one professional workspace.
          </p>

          <div className="hero-search">

            <Search size={21} />

            <input
              type="text"
              placeholder="Search job title, skills, or company"
              onKeyDown={handleSearch}
              aria-label="Search jobs"
            />

            <button
              type="button"
              onClick={() => navigate("/jobs")}
            >
              Search jobs
              <ArrowRight size={17} />
            </button>

          </div>

          <div className="hero-trust">

            <div className="trust-item">
              <span className="trust-icon">
                <ShieldCheck size={16} />
              </span>
              <div>
                <strong>Verified opportunities</strong>
                <span>Relevant roles from active employers</span>
              </div>
            </div>

            <div className="trust-item">
              <span className="trust-icon">
                <Users size={16} />
              </span>
              <div>
                <strong>Built for modern hiring</strong>
                <span>One workspace for candidates & recruiters</span>
              </div>
            </div>

          </div>

          <div className="hero-quick-links">
            <span>Popular searches</span>

            <Link to="/jobs?q=Frontend%20Developer">
              Frontend Developer
            </Link>

            <Link to="/jobs?q=Backend%20Developer">
              Backend Developer
            </Link>

            <Link to="/jobs?q=MERN%20Developer">
              MERN Developer
            </Link>

            <Link to="/jobs?q=Product%20Designer">
              Product Designer
            </Link>
          </div>

        </div>

        <div className="hero-visual">

          <div className="recruiting-dashboard">

            <div className="dashboard-topbar">
              <div>
                <span className="dashboard-kicker">
                  Recruiting workspace
                </span>
                <strong>Talent pipeline</strong>
              </div>

              <span className="dashboard-live">
                <span /> Live
              </span>
            </div>

            <div className="dashboard-summary">

              <div className="pipeline-stat pipeline-stat-primary">
                <span>Open roles</span>
                <strong>24</strong>
                <small>+12% this month</small>
              </div>

              <div className="pipeline-stat">
                <span>New candidates</span>
                <strong>186</strong>
                <small>Across active roles</small>
              </div>

            </div>

            <div className="pipeline-card">

              <div className="pipeline-card-head">

                <div>
                  <span className="pipeline-icon">
                    <BriefcaseBusiness size={16} />
                  </span>

                  <div>
                    <strong>Senior MERN Developer</strong>
                    <span>Engineering · Remote</span>
                  </div>
                </div>

                <span className="pipeline-badge">
                  Hiring
                </span>

              </div>

              <div className="pipeline-progress-row">

                <div className="pipeline-progress">
                  <span style={{ width: "72%" }} />
                </div>

                <strong>72%</strong>

              </div>

              <div className="pipeline-stages">
                <span>
                  <b>48</b> Applied
                </span>

                <span>
                  <b>18</b> Shortlisted
                </span>

                <span>
                  <b>6</b> Interview
                </span>
              </div>

            </div>

            <div className="talent-match-card">

              <div className="talent-match-head">

                <div>

                  <span className="match-avatar">
                    RS
                  </span>

                  <div>
                    <strong>Rahul Sharma</strong>
                    <span>Full Stack Developer</span>
                  </div>

                </div>

                <span className="match-score">
                  94% match
                </span>

              </div>

              <div className="match-tags">
                <span>React</span>
                <span>Node.js</span>
                <span>MongoDB</span>
              </div>

            </div>

            <div className="dashboard-footer">

              <div>
                <CheckCircle2 size={16} />
                <span>Smart candidate matching</span>
              </div>

              <span>
                View pipeline
                <ArrowRight size={14} />
              </span>

            </div>

          </div>

          <div className="hero-float-card hero-float-top">

            <span className="hero-float-icon">
              <UserCheck size={16} />
            </span>

            <div>
              <span>Profile strength</span>
              <strong>Excellent</strong>
            </div>

          </div>

          <div className="hero-float-card hero-float-bottom">

            <span className="hero-float-icon success">
              <CheckCircle2 size={16} />
            </span>

            <div className="hero-float-bottom-copy">
              <span>Application update</span>
              <strong>Moved to interview</strong>
            </div>

            <span className="hero-float-arrow" aria-hidden="true">
              <ArrowRight size={16} strokeWidth={2.4} />
            </span>

          </div>

        </div>

      </section>


      {/* =====================================================
          LIVE STATS STRIP
      ===================================================== */}

      <section className="stats-strip">

        <div className="stats-strip-inner">

          <div className="stats-item">
            <strong>
              {stats.totalJobs !== null
                ? `${stats.totalJobs}+`
                : "—"}
            </strong>
            <span>Live job openings</span>
          </div>

          <div className="stats-item">
            <strong>
              {stats.companies !== null
                ? `${stats.companies}+`
                : "—"}
            </strong>
            <span>Companies hiring now</span>
          </div>

          <div className="stats-item">
            <strong>10,000+</strong>
            <span>Registered candidates</span>
          </div>

          <div className="stats-item">
            <strong>4,500+</strong>
            <span>Successful hires</span>
          </div>

        </div>

      </section>


      {/* =====================================================
          BROWSE BY CATEGORY
      ===================================================== */}

      <section className="home-section">

        <div className="home-section-head">

          <div className="eyebrow">
            <Sparkles size={14} />
            Browse by category
          </div>

          <h2>
            Explore jobs by what you do best
          </h2>

          <p>
            Jump straight to roles in the field
            you know — updated as new positions
            go live.
          </p>

        </div>

        <div className="category-grid">

          {CATEGORIES.map((category) => (

            <Link
              key={category.label}
              to={`/jobs?q=${encodeURIComponent(
                category.query
              )}`}
              className="category-card"
            >

              <span className="category-icon">
                <category.icon size={20} />
              </span>

              <strong>{category.label}</strong>

              <span className="category-count">
                {category.count}
              </span>

            </Link>

          ))}

        </div>

      </section>


      {/* =====================================================
          LATEST JOBS (live data)
      ===================================================== */}

      <section className="home-section">

        <div className="home-section-head row">

          <div>

            <div className="eyebrow">
              <BriefcaseBusiness size={14} />
              Fresh openings
            </div>

            <h2>
              Latest jobs posted
            </h2>

            <p>
              Newest opportunities from verified
              companies, updated in real time.
            </p>

          </div>

          <Link
            to="/jobs"
            className="outline home-view-all"
          >
            View all jobs
            <ArrowRight size={16} />
          </Link>

        </div>

        {jobsLoading ? (

          <div className="jobs-loading-grid">
            <div className="job-skeleton" />
            <div className="job-skeleton" />
            <div className="job-skeleton" />
          </div>

        ) : latestJobs.length === 0 ? (

          <div className="empty">
            <BriefcaseBusiness size={40} />
            <h3>No jobs posted yet</h3>
            <p>
              Check back soon — new openings are added regularly.
            </p>
          </div>

        ) : (

          <div className="job-grid">

            {latestJobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
              />
            ))}

          </div>

        )}

      </section>


      {/* =====================================================
          HOW IT WORKS
      ===================================================== */}

      <section className="home-section">

        <div className="home-section-head">

          <div className="eyebrow">
            <Zap size={14} />
            Simple process
          </div>

          <h2>
            How TrackJobs works
          </h2>

          <p>
            From profile to offer letter, in four
            straightforward steps.
          </p>

        </div>

        <div className="steps-grid">

          {STEPS.map((step, index) => (

            <div
              className="step-card"
              key={step.title}
            >

              <span className="step-number">
                {String(index + 1).padStart(2, "0")}
              </span>

              <span className="step-icon">
                <step.icon size={20} />
              </span>

              <h3>{step.title}</h3>

              <p>{step.text}</p>

            </div>

          ))}

        </div>

      </section>


      {/* =====================================================
          FOR CANDIDATES / FOR EMPLOYERS SPLIT
      ===================================================== */}

      <section className="home-section">

        <div className="split-cta">

          <div className="split-cta-card candidate-split">

            <span className="split-cta-icon">
              <Users size={22} />
            </span>

            <h3>For job seekers</h3>

            <p>
              Build a profile once, apply to
              verified roles, and track every
              application from a single dashboard.
            </p>

            <ul>
              <li>
                <CheckCircle2 size={15} />
                Skill-matched recommendations
              </li>

              <li>
                <CheckCircle2 size={15} />
                One-click resume applications
              </li>

              <li>
                <CheckCircle2 size={15} />
                Real-time status updates
              </li>
            </ul>

            <Link to="/register" className="btn">
              Create your profile
              <ArrowRight size={16} />
            </Link>

          </div>

          <div className="split-cta-card recruiter-split">

            <span className="split-cta-icon">
              <Building2 size={22} />
            </span>

            <h3>For employers</h3>

            <p>
              Post roles in minutes, screen
              candidates with match scoring, and
              manage your entire pipeline in
              one place.
            </p>

            <ul>
              <li>
                <CheckCircle2 size={15} />
                Unlimited job postings
              </li>

              <li>
                <CheckCircle2 size={15} />
                Applicant tracking dashboard
              </li>

              <li>
                <CheckCircle2 size={15} />
                Direct resume access
              </li>
            </ul>

            <Link to="/register" className="outline">
              Start hiring
              <ArrowRight size={16} />
            </Link>

          </div>

        </div>

      </section>


      {/* =====================================================
          FEATURES
      ===================================================== */}

      <section className="features">

        <div>

          <TrendingUp />

          <h3>
            Smart job matching
          </h3>

          <p>
            Find opportunities that align with
            your skills, experience, preferences,
            and career goals.
          </p>

        </div>

        <div>

          <ShieldCheck />

          <h3>
            Trusted opportunities
          </h3>

          <p>
            Discover professional opportunities
            from companies actively hiring on the
            platform.
          </p>

        </div>

        <div>

          <Zap />

          <h3>
            Faster hiring
          </h3>

          <p>
            Reduce the friction between applying,
            screening, interviewing, and getting
            hired.
          </p>

        </div>

      </section>


      {/* =====================================================
          TESTIMONIALS
      ===================================================== */}

      <section className="home-section testimonials-section">

        <div className="home-section-head">

          <div className="eyebrow">
            <Quote size={14} />
            What people say
          </div>

          <h2>
            Built for better hiring experiences
          </h2>

          <p>
            A simpler experience for candidates
            and teams that are hiring.
          </p>

        </div>

        <div className="testimonial-grid">

          {TESTIMONIALS.map((testimonial) => (

            <div
              className="testimonial-card"
              key={testimonial.name}
            >

              <Quote className="testimonial-quote" />

              <p>
                “{testimonial.quote}”
              </p>

              <div className="testimonial-author">

                <div className="testimonial-avatar">
                  {testimonial.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </div>

                <div>
                  <strong>
                    {testimonial.name}
                  </strong>

                  <span>
                    {testimonial.role}
                  </span>
                </div>

              </div>

            </div>

          ))}

        </div>

      </section>

    </>
  );
}