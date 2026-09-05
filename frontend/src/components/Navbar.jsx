import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  ShieldCheck,
  UserCircle,
} from "lucide-react";

import {
  useAuth,
} from "../context/AuthContext";

import api, {
  getFileUrl,
} from "../services/api";


function ProfileAvatar({
  user,
  large = false,
}) {
  const initial =
    user?.name
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() || "U";

  const avatarUrl =
    getFileUrl(user?.avatar);

  const [
    imageFailed,
    setImageFailed,
  ] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  const className = large
    ? "nav-profile-avatar lg"
    : "nav-profile-avatar";

  return (
    <span className={className}>

      {avatarUrl &&
      !imageFailed ? (

        <img
          src={avatarUrl}
          alt={
            user?.name ||
            "Profile"
          }
          onError={() =>
            setImageFailed(true)
          }
        />

      ) : (

        initial

      )}

    </span>
  );
}


export default function Navbar() {

  const {
    user,
    logout,
  } = useAuth();

  const navigate =
    useNavigate();

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const [
    unreadMessageCount,
    setUnreadMessageCount,
  ] = useState(0);

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const menuRef =
    useRef(null);


  const loadUnreadMessageCount =
    async () => {

      if (!user) {
        setUnreadMessageCount(0);
        return;
      }

      try {
        const response = await api.get(
          "/messages/unread-count"
        );

        setUnreadMessageCount(
          response.data?.count || 0
        );
      } catch (error) {
        console.error(
          "Message count error:",
          error
        );
      }
    };


  const loadUnreadCount =
    async () => {

      if (!user) {
        setUnreadCount(0);
        return;
      }

      try {

        const response =
          await api.get(
            "/notifications/unread-count"
          );

        setUnreadCount(
          response.data?.count ||
          0
        );

      } catch (error) {

        console.error(
          "Notification count error:",
          error
        );

      }
    };


  useEffect(() => {

    if (!user) {
      setUnreadCount(0);
      return;
    }

    loadUnreadCount();
    loadUnreadMessageCount();

    const interval =
      setInterval(
        () => {
          loadUnreadCount();
          loadUnreadMessageCount();
        },
        20000
      );

    return () => {
      clearInterval(interval);
    };

  }, [user]);


  useEffect(() => {

    const handleClickOutside =
      (event) => {

        if (
          menuRef.current &&
          !menuRef.current.contains(
            event.target
          )
        ) {
          setMenuOpen(false);
        }

      };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {

      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

    };

  }, []);


  const handleLogout =
    () => {

      setMenuOpen(false);

      logout();

      navigate("/");

    };


  const handleSearch =
    (e) => {

      e.preventDefault();

      navigate(
        searchTerm.trim()
          ? `/jobs?q=${encodeURIComponent(
              searchTerm.trim()
            )}`
          : "/jobs"
      );

    };


  return (
    <header className="nav">

      <div className="nav-inner">

        {/* BRAND */}

        <Link
          to="/"
          className="brand"
        >

          <span className="brand-icon">

            <BriefcaseBusiness
              size={19}
              strokeWidth={2}
            />

          </span>

          <span className="brand-text">

            Track<span>Jobs</span>

          </span>

        </Link>


        {/* SEARCH */}

        <form
          className="nav-search"
          onSubmit={handleSearch}
        >

          <Search size={16} />

          <input
            type="text"
            placeholder="Search jobs, skills, companies"
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
          />

        </form>


        {/* RIGHT SIDE NAVIGATION */}

        <div
          className="nav-actions"
          style={{
            marginLeft: "auto",
          }}
        >

          {/* HOME */}

          <Link
            to="/"
            className="nav-icon-link"
          >

            <Home
              size={20}
              strokeWidth={1.8}
            />

            <span>
              Home
            </span>

          </Link>


          {/* JOBS */}

          <Link
            to="/jobs"
            className="nav-icon-link"
          >

            <BriefcaseBusiness
              size={20}
              strokeWidth={1.8}
            />

            <span>
              Jobs
            </span>

          </Link>


          {/* CANDIDATE APPLICATIONS */}

          {user?.role ===
            "candidate" && (

            <Link
              to="/applications"
              className="nav-icon-link"
            >

              <FileText
                size={20}
                strokeWidth={1.8}
              />

              <span>
                Applications
              </span>

            </Link>

          )}


          {/* RECRUITER HUB */}

          {(
            user?.role ===
              "recruiter" ||
            user?.role ===
              "admin"
          ) && (

            <Link
              to="/recruiter"
              className="nav-icon-link"
            >

              <LayoutDashboard
                size={20}
                strokeWidth={1.8}
              />

              <span>
                Recruiter Hub
              </span>

            </Link>

          )}


          {/* ADMIN */}

          {user?.role ===
            "admin" && (

            <Link
              to="/admin"
              className="nav-icon-link"
            >

              <ShieldCheck
                size={20}
                strokeWidth={1.8}
              />

              <span>
                Admin
              </span>

            </Link>

          )}


          {/* MESSAGES */}

          {user && (

            <Link
              to="/messages"
              className="nav-icon-link"
            >

              <span className="nav-icon-wrap">

                <MessageCircle
                  size={20}
                  strokeWidth={1.8}
                />

                {unreadMessageCount > 0 && (
                  <span className="nav-notification-badge">
                    {unreadMessageCount > 99
                      ? "99+"
                      : unreadMessageCount}
                  </span>
                )}

              </span>

              <span>
                Messages
              </span>

            </Link>

          )}


          {/* NOTIFICATIONS */}

          {user && (

            <Link
              to="/notifications"
              className="nav-icon-link"
            >

              <span className="nav-icon-wrap">

                <Bell
                  size={20}
                  strokeWidth={1.8}
                />

                {unreadCount >
                  0 && (

                  <span className="nav-notification-badge">

                    {unreadCount >
                    99
                      ? "99+"
                      : unreadCount}

                  </span>

                )}

              </span>

              <span>
                Notifications
              </span>

            </Link>

          )}


          {/* PROFILE */}

          {user ? (

            <div
              className="nav-profile-menu"
              ref={menuRef}
            >

              <button
                type="button"
                className="nav-profile-trigger"
                onClick={() =>
                  setMenuOpen(
                    (open) =>
                      !open
                  )
                }
              >

                <ProfileAvatar
                  user={user}
                />

                <span className="nav-profile-name">

                  {
                    user.name
                      ?.split(" ")[0]
                  }

                </span>

                <ChevronDown
                  size={15}
                  className={
                    menuOpen
                      ? "chevron open"
                      : "chevron"
                  }
                />

              </button>


              {menuOpen && (

                <div className="nav-dropdown">

                  <div className="nav-dropdown-head">

                    <ProfileAvatar
                      user={user}
                      large
                    />

                    <div>

                      <strong>
                        {user.name}
                      </strong>

                      <span>
                        {user.email}
                      </span>

                    </div>

                  </div>


                  <Link
                    to="/profile"
                    className="nav-dropdown-item"
                    onClick={() =>
                      setMenuOpen(false)
                    }
                  >

                    <UserCircle
                      size={17}
                    />

                    View profile

                  </Link>


                  <Link
                    to="/settings"
                    className="nav-dropdown-item"
                    onClick={() =>
                      setMenuOpen(false)
                    }
                  >

                    <Settings
                      size={17}
                    />

                    Account settings

                  </Link>


                  <button
                    type="button"
                    className="nav-dropdown-item danger"
                    onClick={handleLogout}
                  >

                    <LogOut
                      size={17}
                    />

                    Sign out

                  </button>

                </div>

              )}

            </div>

          ) : (

            <>

              <Link
                to="/login"
                className="nav-login"
              >
                Sign in
              </Link>


              <Link
                to="/register"
                className="nav-get-started"
              >
                Get started
              </Link>

            </>

          )}

        </div>

      </div>

    </header>
  );
}