import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  BriefcaseBusiness,
  Eye,
  EyeOff,
  Mail,
  ShieldCheck,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";


function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 48 48"
    >
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-1.6 4.6-6 7.9-11.3 7.9-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.1-5.1C33.5 6 29 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />

      <path
        fill="#FF3D00"
        d="M6.3 14.7l5.9 4.3C13.8 15.6 18.5 12.4 24 12.4c3.1 0 5.9 1.2 8 3.1l5.1-5.1C33.5 6 29 4 24 4c-7.5 0-14 4.2-17.7 10.7z"
      />

      <path
        fill="#4CAF50"
        d="M24 44c4.9 0 9.4-1.9 12.8-4.9l-5.9-5c-2 1.5-4.6 2.5-6.9 2.5-5.2 0-9.7-3.3-11.3-7.9l-5.9 4.6C10 39.6 16.5 44 24 44z"
      />

      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-.8 2.3-2.2 4.3-4.1 5.7l5.9 5c-.4.4 6.9-5 6.9-13.9 0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}


export default function Auth({
  mode,
}) {

  const {
    login,
    register,
    user,
  } = useAuth();


  const navigate =
    useNavigate();


  const isLogin =
    mode === "login";


  const [
    role,
    setRole,
  ] = useState("candidate");


  const [
    form,
    setForm,
  ] = useState({
    name: "",
    email: "",
    password: "",
  });


  const [
    showPassword,
    setShowPassword,
  ] = useState(false);


  const [
    err,
    setErr,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


  /* =======================================================
     FORGOT PASSWORD
  ======================================================= */

  const [
    showForgot,
    setShowForgot,
  ] = useState(false);


  const [
    forgotEmail,
    setForgotEmail,
  ] = useState("");


  const [
    forgotSent,
    setForgotSent,
  ] = useState(false);


  const [
    forgotLoading,
    setForgotLoading,
  ] = useState(false);


  /* =======================================================
     GOOGLE ERROR
  ======================================================= */

  useEffect(() => {

    const googleError =
      localStorage.getItem(
        "jt_google_error"
      );


    if (googleError) {

      setErr(
        googleError
      );


      localStorage.removeItem(
        "jt_google_error"
      );
    }

  }, []);


  /* =======================================================
     AUTO REDIRECT
  ======================================================= */

  useEffect(() => {

    if (!user) return;


    if (
      user.role === "admin"
    ) {

      navigate(
        "/admin",
        {
          replace: true,
        }
      );

    } else if (
      user.role === "recruiter"
    ) {

      navigate(
        "/recruiter",
        {
          replace: true,
        }
      );

    } else {

      navigate(
        "/jobs",
        {
          replace: true,
        }
      );
    }

  }, [
    user,
    navigate,
  ]);


  /* =======================================================
     FORGOT PASSWORD
  ======================================================= */

  const openForgot =
    () => {

      setForgotEmail(
        form.email || ""
      );

      setForgotSent(false);

      setShowForgot(true);
    };


  const closeForgot =
    () => {

      setShowForgot(false);

      setForgotSent(false);

      setForgotLoading(false);
    };


  const submitForgot =
    async (e) => {

      e.preventDefault();

      setForgotLoading(true);


      try {

        await api.post(
          "/auth/forgot-password",
          {
            email:
              forgotEmail.trim(),
          }
        );


        setForgotSent(
          true
        );

      } catch (error) {

        setErr(
          "Unable to send reset link. Please try again."
        );

      } finally {

        setForgotLoading(
          false
        );
      }
    };


  /* =======================================================
     GOOGLE
  ======================================================= */

  const handleGoogleClick =
    () => {

      const selectedRole =
        isLogin
          ? "candidate"
          : role;


      const apiBase =
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api";


      window.location.href =
        `${apiBase}/auth/google?role=${encodeURIComponent(
          selectedRole
        )}`;
    };


  /* =======================================================
     INPUT
  ======================================================= */

  const handleChange =
    (e) => {

      const {
        name,
        value,
      } = e.target;


      setForm(
        (prev) => ({
          ...prev,
          [name]: value,
        })
      );


      if (err) {
        setErr("");
      }
    };


  /* =======================================================
     LOGIN / REGISTER
  ======================================================= */

  const submit =
    async (e) => {

      e.preventDefault();

      setErr("");

      setLoading(true);


      try {

        /* ---------------------------------------------------
           LOGIN
        --------------------------------------------------- */

        if (isLogin) {

          const loggedInUser =
            await login({
              email:
                form.email,

              password:
                form.password,
            });


          if (
            loggedInUser?.role ===
            "admin"
          ) {

            navigate(
              "/admin"
            );

            return;
          }


          if (
            loggedInUser?.role ===
            "recruiter"
          ) {

            navigate(
              "/recruiter"
            );

            return;
          }


          navigate(
            "/jobs"
          );

          return;
        }


        /* ---------------------------------------------------
           REGISTER
        --------------------------------------------------- */

        const registeredUser =
          await register({
            ...form,
            role,
          });


        if (
          registeredUser?.role ===
          "recruiter"
        ) {

          navigate(
            "/recruiter"
          );

          return;
        }


        navigate(
          "/jobs"
        );

      } catch (error) {

        console.error(
          "AUTH ERROR:",
          error
        );


        setErr(
          error.response?.data
            ?.message ||
          error.message ||
          "Something went wrong. Please try again."
        );

      } finally {

        setLoading(false);
      }
    };


  return (
    <main className="simple-auth-page">

      <div className="simple-auth-card">

        {/* LOGO */}

        <Link
          to="/"
          className="simple-auth-logo"
        >

          <span className="simple-auth-logo-icon">

            <BriefcaseBusiness
              size={17}
              strokeWidth={2.2}
            />

          </span>

          <span>
            Track
            <strong>
              Jobs
            </strong>
          </span>

        </Link>


        {/* HEADING */}

        <div className="simple-auth-heading">

          <h1>
            {isLogin
              ? "Welcome back"
              : "Create your account"}
          </h1>


          <p>
            {isLogin
              ? "Sign in to continue to your TrackJobs account."
              : "Create an account and start your career journey."}
          </p>

        </div>


        {/* GOOGLE */}

        <button
          type="button"
          className="simple-google-btn"
          onClick={
            handleGoogleClick
          }
        >

          <GoogleIcon />

          Continue with Google

        </button>


        <div className="simple-auth-divider">
          <span>
            or continue with email
          </span>
        </div>


        {/* FORM */}

        <form
          className="simple-auth-form"
          onSubmit={submit}
        >

          {/* NAME */}

          {!isLogin && (
            <div className="simple-auth-field">

              <label htmlFor="name">
                Full name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={form.name}
                onChange={
                  handleChange
                }
                autoComplete="name"
                required
              />

            </div>
          )}


          {/* ROLE */}

          {!isLogin && (
            <div className="simple-auth-field">

              <label>
                Account type
              </label>


              <div className="simple-role-options">

                <button
                  type="button"
                  className={
                    role ===
                    "candidate"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setRole(
                      "candidate"
                    )
                  }
                >

                  <span>
                    👤
                  </span>

                  <div>

                    <strong>
                      Candidate
                    </strong>

                    <small>
                      Find jobs
                    </small>

                  </div>

                </button>


                <button
                  type="button"
                  className={
                    role ===
                    "recruiter"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setRole(
                      "recruiter"
                    )
                  }
                >

                  <span>
                    💼
                  </span>

                  <div>

                    <strong>
                      Recruiter
                    </strong>

                    <small>
                      Hire talent
                    </small>

                  </div>

                </button>

              </div>

            </div>
          )}


          {/* EMAIL */}

          <div className="simple-auth-field">

            <label htmlFor="email">
              Email address
            </label>


            <div className="simple-input-icon-box">

              <Mail size={16} />

              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={
                  handleChange
                }
                autoComplete="email"
                required
              />

            </div>

          </div>


          {/* PASSWORD */}

          <div className="simple-auth-field">

            <div className="simple-password-label-row">

              <label htmlFor="password">
                Password
              </label>


              {isLogin && (
                <button
                  type="button"
                  className="simple-forgot-link"
                  onClick={
                    openForgot
                  }
                >
                  Forgot password?
                </button>
              )}

            </div>


            <div className="simple-password-box">

              <input
                id="password"
                name="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={
                  form.password
                }
                onChange={
                  handleChange
                }
                autoComplete={
                  isLogin
                    ? "current-password"
                    : "new-password"
                }
                minLength="6"
                required
              />


              <button
                type="button"
                className="simple-password-toggle"
                onClick={() =>
                  setShowPassword(
                    (prev) =>
                      !prev
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >

                {showPassword ? (
                  <EyeOff
                    size={17}
                  />
                ) : (
                  <Eye
                    size={17}
                  />
                )}

              </button>

            </div>

          </div>


          {/* ERROR */}

          {err && (
            <div className="simple-auth-error">
              {err}
            </div>
          )}


          {/* SUBMIT */}

          <button
            type="submit"
            className="simple-auth-submit"
            disabled={loading}
          >

            {loading
              ? isLogin
                ? "Signing in..."
                : "Creating account..."
              : isLogin
                ? "Sign in"
                : "Create account"}


            {!loading && (
              <span>
                →
              </span>
            )}

          </button>

        </form>


        {/* SWITCH */}

        <div className="simple-auth-switch">

          <span>
            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}
          </span>


          <Link
            to={
              isLogin
                ? "/register"
                : "/login"
            }
          >
            {isLogin
              ? "Create account"
              : "Sign in"}
          </Link>

        </div>


        {/* SECURITY */}

        <div className="simple-auth-security">

          <ShieldCheck
            size={13}
          />

          Your information is secure

        </div>

      </div>


      {/* =====================================================
          FORGOT PASSWORD MODAL
      ===================================================== */}

      {showForgot && (

        <div
          className="modal-bg"
          onClick={closeForgot}
        >

          <div
            className="modal forgot-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              type="button"
              className="close"
              onClick={closeForgot}
              aria-label="Close"
            >

              <X size={16} />

            </button>


            {!forgotSent ? (

              <>

                <h2>
                  Reset your password
                </h2>


                <p className="modal-subtitle">
                  Enter the email linked to your account
                  and we'll send you a reset link.
                </p>


                <form
                  className="simple-auth-form"
                  onSubmit={
                    submitForgot
                  }
                >

                  <div className="simple-auth-field">

                    <label htmlFor="forgot-email">
                      Email address
                    </label>


                    <div className="simple-input-icon-box">

                      <Mail size={16} />

                      <input
                        id="forgot-email"
                        type="email"
                        placeholder="you@example.com"
                        value={
                          forgotEmail
                        }
                        onChange={(
                          e
                        ) =>
                          setForgotEmail(
                            e.target.value
                          )
                        }
                        required
                      />

                    </div>

                  </div>


                  <button
                    type="submit"
                    className="simple-auth-submit"
                    disabled={
                      forgotLoading
                    }
                  >

                    {forgotLoading
                      ? "Sending link..."
                      : "Send reset link"}

                  </button>

                </form>

              </>

            ) : (

              <div className="forgot-success">

                <span className="forgot-success-icon">

                  <Mail size={22} />

                </span>


                <h2>
                  Check your inbox
                </h2>


                <p className="modal-subtitle">

                  If an account exists for{" "}

                  <strong>
                    {forgotEmail}
                  </strong>

                  , a password reset link
                  is on its way.

                </p>


                <button
                  type="button"
                  className="outline full"
                  onClick={
                    closeForgot
                  }
                >
                  Back to sign in
                </button>

              </div>

            )}

          </div>

        </div>

      )}

    </main>
  );
}