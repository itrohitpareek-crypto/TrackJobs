import { useEffect } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import Applications from "./pages/Applications";
import Recruiter from "./pages/Recruiter";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";
import AdminDashboard from "./pages/AdminDashboard";
import CandidateDashboard from "./pages/CandidateDashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AccountSettings from "./pages/AccountSettings";

import "./styles/app.css";


/* =========================================================
   AUTH / ROLE GUARD
========================================================= */

function Guard({
  children,
  role,
}) {
  const {
    user,
    loading,
  } = useAuth();


  /* -------------------------------------------------------
     AUTH LOADING
  ------------------------------------------------------- */

  if (loading) {
    return (
      <div className="empty">
        Loading...
      </div>
    );
  }


  /* -------------------------------------------------------
     USER NOT LOGGED IN
  ------------------------------------------------------- */

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  /* -------------------------------------------------------
     ROLE CHECK
  ------------------------------------------------------- */

  if (
    role &&
    !role.includes(user.role)
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }


  /* -------------------------------------------------------
     AUTHORIZED USER
  ------------------------------------------------------- */

  return children;
}


/* =========================================================
   ROUTE SCROLL RESTORATION
   Every route should open at the top instead of keeping the
   previous page\'s scroll position (especially the footer).
========================================================= */
function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search]);

  return null;
}

/* =========================================================
   APPLICATION ROUTES
========================================================= */

function AppRoutes() {
  return (
    <div className="app-shell">

      {/* =================================================
          NAVBAR
      ================================================== */}

      <Navbar />


      {/* =================================================
          MAIN CONTENT
      ================================================== */}

      <main className="app-main">

        <Routes>

          {/* =================================================
              HOME
          ================================================== */}

          <Route
            path="/"
            element={
              <Home />
            }
          />


          {/* =================================================
              JOBS
          ================================================== */}

          <Route
            path="/jobs"
            element={
              <Jobs />
            }
          />


          {/* =================================================
              JOB DETAILS
          ================================================== */}

          <Route
            path="/jobs/:id"
            element={
              <JobDetails />
            }
          />


          {/* =================================================
              LOGIN
          ================================================== */}

          <Route
            path="/login"
            element={
              <Auth
                mode="login"
              />
            }
          />


          {/* =================================================
              REGISTER
          ================================================== */}

          <Route
            path="/register"
            element={
              <Auth
                mode="register"
              />
            }
          />


          {/* =================================================
              FORGOT / RESET PASSWORD
          ================================================== */}

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          <Route
            path="/reset-password/:token"
            element={<ResetPassword />}
          />

          <Route
            path="/settings"
            element={
              <Guard>
                <AccountSettings />
              </Guard>
            }
          />


          {/* =================================================
              MESSAGES
          ================================================== */}

          <Route
            path="/messages"
            element={
              <Guard>
                <Messages />
              </Guard>
            }
          />


          {/* =================================================
              NOTIFICATIONS
          ================================================== */}

          <Route
            path="/notifications"
            element={
              <Guard>
                <Notifications />
              </Guard>
            }
          />


          {/* =================================================
              CANDIDATE DASHBOARD
          ================================================== */}

          <Route
            path="/dashboard"
            element={
              <Guard
                role={[
                  "candidate",
                ]}
              >
                <CandidateDashboard />
              </Guard>
            }
          />


          {/* =================================================
              CANDIDATE APPLICATIONS
          ================================================== */}

          <Route
            path="/applications"
            element={
              <Guard
                role={[
                  "candidate",
                ]}
              >
                <Applications />
              </Guard>
            }
          />


          {/* =================================================
              RECRUITER DASHBOARD
          ================================================== */}

          <Route
            path="/recruiter"
            element={
              <Guard
                role={[
                  "recruiter",
                  "admin",
                ]}
              >
                <Recruiter />
              </Guard>
            }
          />


          {/* =================================================
              ADMIN DASHBOARD
          ================================================== */}

          <Route
            path="/admin"
            element={
              <Guard
                role={[
                  "admin",
                ]}
              >
                <AdminDashboard />
              </Guard>
            }
          />


          {/* =================================================
              PROFILE
          ================================================== */}

          <Route
            path="/profile"
            element={
              <Guard>
                <Profile />
              </Guard>
            }
          />


          {/* =================================================
              FALLBACK
          ================================================== */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>

      </main>


      {/* =================================================
          FOOTER
      ================================================== */}

      <Footer />

    </div>
  );
}


/* =========================================================
   MAIN APP
========================================================= */

export default function App() {
  return (
    <AuthProvider>

      <BrowserRouter>

        <AppRoutes />

      </BrowserRouter>

    </AuthProvider>
  );
}