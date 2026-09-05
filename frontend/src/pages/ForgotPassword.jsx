import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  BriefcaseBusiness,
  Mail,
  ShieldCheck,
} from "lucide-react";

import api from "../services/api";


export default function ForgotPassword() {

  const navigate =
    useNavigate();


  const [
    email,
    setEmail,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    sent,
    setSent,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const submit =
    async (event) => {

      event.preventDefault();

      setError("");

      setLoading(true);


      try {

        await api.post(
          "/auth/forgot-password",
          {
            email:
              email.trim(),
          }
        );


        setSent(true);

      } catch (err) {

        setError(
          err.response?.data
            ?.message ||
          "Unable to send reset link. Please try again."
        );

      } finally {

        setLoading(false);

      }
    };


  return (
    <main className="simple-auth-page">

      <div className="simple-auth-card">

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


        {!sent ? (

          <>

            <div className="simple-auth-heading">

              <h1>
                Forgot your password?
              </h1>

              <p>
                Enter your account email and
                we'll send you a secure reset link.
              </p>

            </div>


            <form
              className="simple-auth-form"
              onSubmit={submit}
            >

              <div className="simple-auth-field">

                <label htmlFor="forgot-page-email">
                  Email address
                </label>


                <div className="simple-input-icon-box">

                  <Mail size={16} />

                  <input
                    id="forgot-page-email"
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(
                        e.target.value
                      )
                    }
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />

                </div>

              </div>


              {error && (
                <div className="simple-auth-error">
                  {error}
                </div>
              )}


              <button
                className="simple-auth-submit"
                type="submit"
                disabled={loading}
              >

                {loading
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
                {email}
              </strong>

              , a password reset link
              has been sent.

            </p>


            <button
              type="button"
              className="outline full"
              onClick={() =>
                navigate(
                  "/login"
                )
              }
            >
              Back to sign in
            </button>

          </div>

        )}


        <div className="simple-auth-switch">

          <Link to="/login">

            <ArrowLeft
              size={14}
            />

            Back to sign in

          </Link>

        </div>


        <div className="simple-auth-security">

          <ShieldCheck
            size={13}
          />

          Your information is secure

        </div>

      </div>

    </main>
  );
}