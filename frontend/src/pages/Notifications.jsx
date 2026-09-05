import {
  useEffect,
  useState,
} from "react";


import {
  Link,
} from "react-router-dom";


import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCheck,
  Clock3,
  Info,
  Trash2,
  UserRound,
  X,
} from "lucide-react";


import api from "../services/api";


const getNotificationIcon = (
  type
) => {

  if (
    type ===
    "application"
  ) {
    return <BriefcaseBusiness size={19} />;
  }


  if (
    type ===
    "interview"
  ) {
    return <CalendarDays size={19} />;
  }


  if (
    type ===
    "status"
  ) {
    return <Check size={19} />;
  }


  return <Info size={19} />;
};


const getTimeAgo = (
  date
) => {

  const created =
    new Date(date)
      .getTime();


  const now =
    Date.now();


  const seconds =
    Math.max(
      0,
      Math.floor(
        (now - created) /
        1000
      )
    );


  if (seconds < 60) {
    return "Just now";
  }


  const minutes =
    Math.floor(
      seconds / 60
    );


  if (minutes < 60) {
    return `${minutes} min ago`;
  }


  const hours =
    Math.floor(
      minutes / 60
    );


  if (hours < 24) {
    return `${hours} hr ago`;
  }


  const days =
    Math.floor(
      hours / 24
    );


  if (days < 7) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }


  return new Date(date)
    .toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
};


export default function Notifications() {

  const [
    notifications,
    setNotifications,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  const loadNotifications =
    async () => {

      try {

        setError("");


        const response =
          await api.get(
            "/notifications"
          );


        setNotifications(
          response.data
        );

      } catch (err) {

        setError(
          err.response?.data?.message ||
          "Unable to load notifications."
        );

      } finally {

        setLoading(false);
      }
    };


  useEffect(() => {

    loadNotifications();

  }, []);


  const markRead =
    async (id) => {

      try {

        await api.patch(
          `/notifications/${id}/read`
        );


        setNotifications(
          (current) =>
            current.map(
              (notification) =>
                notification._id === id
                  ? {
                      ...notification,
                      read: true,
                    }
                  : notification
            )
        );

      } catch (err) {

        console.error(
          "Unable to mark notification:",
          err
        );
      }
    };


  const markAllRead =
    async () => {

      try {

        await api.patch(
          "/notifications/read-all"
        );


        setNotifications(
          (current) =>
            current.map(
              (notification) => ({
                ...notification,
                read: true,
              })
            )
        );

      } catch (err) {

        console.error(
          "Unable to mark all notifications:",
          err
        );
      }
    };


  const removeNotification =
    async (id) => {

      try {

        await api.delete(
          `/notifications/${id}`
        );


        setNotifications(
          (current) =>
            current.filter(
              (notification) =>
                notification._id !== id
            )
        );

      } catch (err) {

        console.error(
          "Unable to delete notification:",
          err
        );
      }
    };


  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.read
    ).length;


  return (
    <main className="container notifications-page">

      {/* =================================================
          HEADER
      ================================================== */}

      <div className="notifications-header">

        <div>

          <span className="eyebrow">
            Your activity
          </span>

          <h1>
            Notifications
          </h1>

          <p>
            Stay updated about applications,
            interviews, and hiring activity.
          </p>

        </div>


        {notifications.length > 0 && (
          <button
            className="notification-mark-all"
            onClick={markAllRead}
            disabled={!unreadCount}
          >

            <CheckCheck
              size={17}
            />

            Mark all as read

          </button>
        )}

      </div>


      {/* =================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="notification-error">

          <X size={17} />

          {error}

        </div>
      )}


      {/* =================================================
          LOADING
      ================================================== */}

      {loading && (
        <div className="notifications-loading">

          <div className="notification-loader"></div>

          <p>
            Loading notifications...
          </p>

        </div>
      )}


      {/* =================================================
          EMPTY
      ================================================== */}

      {!loading &&
        !error &&
        notifications.length === 0 && (

          <div className="notifications-empty">

            <div className="notifications-empty-icon">

              <Bell size={28} />

            </div>

            <h2>
              You're all caught up
            </h2>

            <p>
              New application and hiring
              updates will appear here.
            </p>

            <Link
              to="/jobs"
              className="btn"
            >
              Explore jobs
            </Link>

          </div>
        )}


      {/* =================================================
          NOTIFICATION LIST
      ================================================== */}

      {!loading &&
        notifications.length > 0 && (

          <div className="notifications-list">

            {notifications.map(
              (notification) => (

                <article
                  key={notification._id}
                  className={
                    `notification-item ${
                      notification.read
                        ? "is-read"
                        : "is-unread"
                    }`
                  }
                >

                  <div
                    className={
                      `notification-icon notification-${notification.type}`
                    }
                  >

                    {getNotificationIcon(
                      notification.type
                    )}

                  </div>


                  <div className="notification-content">

                    <div className="notification-title-row">

                      <h3>
                        {notification.title}
                      </h3>

                      {!notification.read && (
                        <span className="notification-new">
                          NEW
                        </span>
                      )}

                    </div>


                    <p>
                      {notification.message}
                    </p>


                    <div className="notification-meta">

                      <span>

                        <Clock3
                          size={13}
                        />

                        {getTimeAgo(
                          notification.createdAt
                        )}

                      </span>


                      {notification.link && (
                        <Link
                          to={
                            notification.link
                          }
                          onClick={() =>
                            markRead(
                              notification._id
                            )
                          }
                        >
                          View details →
                        </Link>
                      )}

                    </div>

                  </div>


                  <div className="notification-actions">

                    {!notification.read && (
                      <button
                        title="Mark as read"
                        onClick={() =>
                          markRead(
                            notification._id
                          )
                        }
                      >
                        <Check
                          size={16}
                        />
                      </button>
                    )}


                    <button
                      title="Delete notification"
                      onClick={() =>
                        removeNotification(
                          notification._id
                        )
                      }
                    >
                      <Trash2
                        size={16}
                      />
                    </button>

                  </div>

                </article>
              )
            )}

          </div>
        )}

    </main>
  );
}