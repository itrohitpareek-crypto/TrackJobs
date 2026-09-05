import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

import api from "../services/api";


export default function ResetPassword() {

  const {
    token,
  } = useParams();


  const navigate =
    useNavigate();


  const [
    password,
    setPassword,
  ] = useState("");


  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");


  const [
    showPassword,
    setShowPassword,
  ] = useState(false);


  const [
    showConfirm,
    setShowConfirm,
  ] = useState(false);


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState(false);


  const submit =
    async (event) => {

      event.preventDefault();

      setError("");


      if (
        password.length < 8
      ) {

        setError(
          "Password must be at least 8 characters."
        );

        return;
      }


      if (
        password !==
        confirmPassword
      ) {

        setError(
          "Passwords do not match."
        );

        return;
      }


      setLoading(true);


      try {

        await api.post(
          "/auth/reset-password",
          {
            token,
            password,
          }
        );


        setSuccess(true);

      } catch (err) {

        setError(
          err.response?.data
            ?.message ||
          "This reset link is invalid or expired."
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


        {success ? (

          <div className="forgot-success">

            <span className="forgot-success-icon">
              ✓
            </span>


            <h2>
              Password updated
            </h2>


            <p className="modal-subtitle">
              Your password has been
              changed successfully.
            </p>


            <button
              className="simple-auth-submit"
              type="button"
              onClick={() =>
                navigate(
                  "/login"
                )
              }
            >
              Sign in
            </button>

          </div>

        ) : (

          <>

            <div className="simple-auth-heading">

              <h1>
                Create a new password
              </h1>

              <p>
                Choose a strong password
                for your TrackJobs account.
              </p>

            </div>


            <form
              className="simple-auth-form"
              onSubmit={submit}
            >

              {/* NEW PASSWORD */}

              <div className="simple-auth-field">

                <label htmlFor="new-password">
                  New password
                </label>


                <div className="simple-password-box">

                  <input
                    id="new-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      password
                    }
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    minLength="8"
                    autoComplete="new-password"
                    required
                  />


                  <button
                    type="button"
                    className="simple-password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (value) =>
                          !value
                      )
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


              {/* CONFIRM PASSWORD */}

              <div className="simple-auth-field">

                <label htmlFor="confirm-password">
                  Confirm password
                </label>


                <div className="simple-password-box">

                  <input
                    id="confirm-password"
                    type={
                      showConfirm
                        ? "text"
                        : "password"
                    }
                    value={
                      confirmPassword
                    }
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    minLength="8"
                    autoComplete="new-password"
                    required
                  />


                  <button
                    type="button"
                    className="simple-password-toggle"
                    onClick={() =>
                      setShowConfirm(
                        (value) =>
                          !value
                      )
                    }
                  >

                    {showConfirm ? (
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
                  ? "Updating password..."
                  : "Update password"}

              </button>

            </form>

          </>

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

          Reset links expire after
          15 minutes

        </div>

      </div>

    </main>
  );
}