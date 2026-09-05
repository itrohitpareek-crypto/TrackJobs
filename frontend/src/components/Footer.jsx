import React from "react";
import "../styles/Footer.css";


const Footer = () => {

  const handleScrollTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  return (
    <footer className="site-footer">

      {/* =====================================================
          CTA SECTION
      ====================================================== */}

      <section className="footer-cta-wrapper">

        <div className="footer-cta">

          <div className="footer-cta-glow footer-cta-glow-one"></div>

          <div className="footer-cta-glow footer-cta-glow-two"></div>


          <div className="footer-cta-content">

            <span className="footer-cta-badge">
              YOUR NEXT OPPORTUNITY STARTS HERE
            </span>

            <h2>
              Build your next career
              <span> move.</span>
            </h2>

            <p>
              Discover meaningful opportunities, connect with
              great companies, and take the next step in your
              professional journey with TrackJobs.
            </p>

          </div>


          <div className="footer-cta-actions">

            <a
              href="/jobs"
              className="footer-primary-btn"
            >
              <span>
                Find Jobs
              </span>

              <strong>
                →
              </strong>
            </a>


            <a
              href="/register"
              className="footer-secondary-btn"
            >
              Create Free Account
            </a>

          </div>

        </div>

      </section>


      {/* =====================================================
          MAIN FOOTER
      ====================================================== */}

      <div className="footer-main">

        <div className="footer-container">


          {/* =================================================
              BRAND
          ================================================== */}

          <div className="footer-brand">

            <button
              className="footer-logo"
              onClick={handleScrollTop}
              aria-label="Go to homepage"
            >

              <span className="footer-logo-icon">

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >

                  <rect
                    x="3"
                    y="7"
                    width="18"
                    height="13"
                    rx="2"
                  />

                  <path
                    d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7"
                  />

                  <path
                    d="M3 12h18"
                  />

                  <path
                    d="M10 12v2h4v-2"
                  />

                </svg>

              </span>


              <span>
                Track
                <strong>
                   Jobs
                </strong>
              </span>

            </button>


            <p className="footer-description">
              A modern career platform helping candidates
              discover meaningful opportunities and helping
              companies build stronger teams.
            </p>


            {/* SOCIAL LINKS */}

            <div className="footer-socials">

              {/* LinkedIn */}

              <a
                href="#"
                aria-label="LinkedIn"
                className="footer-social"
              >

                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >

                  <path
                    d="M6.5 8.5H3V21h3.5V8.5ZM4.75 3A2.05 2.05 0 1 0 4.75 7.1 2.05 2.05 0 0 0 4.75 3ZM21 13.85c0-3.77-2.01-5.53-4.69-5.53-2.16 0-3.13 1.19-3.67 2.03V8.5H9.15V21h3.49v-6.19c0-1.63.31-3.2 2.33-3.2 1.99 0 2.01 1.86 2.01 3.31V21H21v-7.15Z"
                  />

                </svg>

              </a>


              {/* X / Twitter */}

              <a
                href="#"
                aria-label="Twitter"
                className="footer-social"
              >

                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >

                  <path
                    d="M18.9 2H22l-6.77 7.74L23.2 22h-6.24l-4.89-6.39L6.48 22H3.37l7.24-8.28L3 2h6.4l4.42 5.84L18.9 2Zm-1.1 17.75h1.73L8.47 4.15H6.61L17.8 19.75Z"
                  />

                </svg>

              </a>


              {/* GitHub */}

              <a
                href="#"
                aria-label="GitHub"
                className="footer-social"
              >

                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >

                  <path
                    d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.4-1.33-1.77-1.33-1.77-1.09-.75.08-.74.08-.74 1.2.09 1.84 1.23 1.84 1.23 1.07 1.83 2.8 1.3 3.48.99.11-.77.42-1.3.76-1.6-2.66-.3-5.46-1.33-5.46-5.92 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.17 0 0 1-.32 3.3 1.23a11.47 11.47 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.65 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.6-2.8 5.61-5.47 5.91.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z"
                  />

                </svg>

              </a>


              {/* Instagram */}

              <a
                href="#"
                aria-label="Instagram"
                className="footer-social"
              >

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >

                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="5"
                  />

                  <circle
                    cx="12"
                    cy="12"
                    r="4"
                  />

                  <circle
                    cx="17.5"
                    cy="6.5"
                    r="1"
                    fill="currentColor"
                    stroke="none"
                  />

                </svg>

              </a>

            </div>

          </div>


          {/* =================================================
              PLATFORM
          ================================================== */}

          <div className="footer-column">

            <h3>
              Platform
            </h3>

            <a href="/">
              Home
            </a>

            <a href="/jobs">
              Find Jobs
            </a>

            <a href="/login">
              Candidate Login
            </a>

            <a href="/register">
              Create Account
            </a>

            <a href="/profile">
              My Profile
            </a>

          </div>


          {/* =================================================
              FOR EMPLOYERS
          ================================================== */}

          <div className="footer-column">

            <h3>
              For Employers
            </h3>

            <a href="/recruiter">
              Recruiter Dashboard
            </a>

            <a href="/recruiter">
              Post a Job
            </a>

            <a href="/recruiter">
              Find Candidates
            </a>

            <a href="/recruiter">
              Manage Applications
            </a>

            <a href="/recruiter">
              Hiring Tools
            </a>

          </div>


          {/* =================================================
              RESOURCES
          ================================================== */}

          <div className="footer-column">

            <h3>
              Resources
            </h3>

            <a href="#">
              Career Advice
            </a>

            <a href="#">
              Interview Preparation
            </a>

            <a href="#">
              Resume Tips
            </a>

            <a href="#">
              Job Search Guide
            </a>

            <a href="#">
              Help Center
            </a>

          </div>


          {/* =================================================
              COMPANY
          ================================================== */}

          <div className="footer-column">

            <h3>
              Company
            </h3>

            <a href="#">
              About TrackJobs
            </a>

            <a href="#">
              Contact Us
            </a>

            <a href="#">
              Careers
            </a>

            <a href="#">
              Privacy Policy
            </a>

            <a href="#">
              Terms & Conditions
            </a>

          </div>

        </div>

      </div>


      {/* =====================================================
          CONTACT STRIP
      ====================================================== */}

      <div className="footer-contact-strip">

        <div className="footer-container">


          {/* EMAIL */}

          <div className="footer-contact-item">

            <span className="footer-contact-icon">

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >

                <path
                  d="M4 4h16v16H4z"
                  strokeLinecap="round"
                />

                <path
                  d="m4 6 8 6 8-6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

              </svg>

            </span>


            <div>

              <small>
                Email
              </small>

              <a href="mailto:hello@jobtrackpro.com">
                hello@trackjobs.com
              </a>

            </div>

          </div>


          {/* PHONE */}

          <div className="footer-contact-item">

            <span className="footer-contact-icon">

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >

                <path
                  d="M22 16.92v3a2 2 0 0 1-2.18 2
                  19.79 19.79 0 0 1-8.63-3.07
                  19.5 19.5 0 0 1-6-6
                  19.79 19.79 0 0 1-3.07-8.67
                  A2 2 0 0 1 4.11 2h3
                  a2 2 0 0 1 2 1.72
                  12.84 12.84 0 0 0 .7 2.81
                  2 2 0 0 1-.45 2.11L8.09 9.91
                  a16 16 0 0 0 6 6l1.27-1.27
                  a2 2 0 0 1 2.11-.45
                  12.84 12.84 0 0 0 2.81.7
                  A2 2 0 0 1 22 16.92z"
                />

              </svg>

            </span>


            <div>

              <small>
                Support
              </small>

              <a href="tel:+911800000000">
                +91 1800 000 000
              </a>

            </div>

          </div>


          {/* SUPPORT HOURS */}

          <div className="footer-contact-item">

            <span className="footer-contact-icon">

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >

                <circle
                  cx="12"
                  cy="12"
                  r="9"
                />

                <path
                  d="M12 7v5l3 2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

              </svg>

            </span>


            <div>

              <small>
                Support Hours
              </small>

              <span>
                Mon – Fri · 9:00 AM – 6:00 PM
              </span>

            </div>

          </div>


          {/* STATUS */}

          <div className="footer-contact-item footer-status">

            <span className="footer-status-dot"></span>

            <div>

              <small>
                Platform Status
              </small>

              <span>
                All systems operational
              </span>

            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          BOTTOM BAR
      ====================================================== */}

      <div className="footer-bottom">

        <div className="footer-container">

          <p>
            © 2026 TrackJobs. All rights reserved.
          </p>


          <div className="footer-bottom-links">

            <a href="#">
              Privacy
            </a>

            <a href="#">
              Terms
            </a>

            <a href="#">
              Cookies
            </a>

          </div>


          <button
            className="footer-back-top"
            onClick={handleScrollTop}
          >

            Back to top

            <span>
              ↑
            </span>

          </button>

        </div>

      </div>

    </footer>
  );
};


export default Footer;