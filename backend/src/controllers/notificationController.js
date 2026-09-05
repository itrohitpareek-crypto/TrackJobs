import Notification from "../models/Notification.js";
import Application from "../models/Application.js";
import Job from "../models/Job.js";

/* =========================================================
   CREATE NOTIFICATION SAFELY
========================================================= */

const createNotification = async (data) => {
  try {
    return await Notification.create(data);
  } catch (error) {
    /*
      Duplicate eventKey is intentionally ignored.
      This makes the sync operation idempotent.
    */

    if (error.code === 11000) {
      return null;
    }

    throw error;
  }
};

/* =========================================================
   SYNC APPLICATION NOTIFICATIONS
========================================================= */

const syncApplicationNotifications = async (
  user
) => {
  /*
    Candidate notifications
  */

  if (
    user.role === "candidate"
  ) {
    const applications =
      await Application.find({
        candidate:
          user._id,
      })
        .populate(
          "job",
          "title company recruiter"
        )
        .sort({
          updatedAt: -1,
        })
        .limit(100);

    for (
      const application of applications
    ) {
      if (!application.job) {
        continue;
      }

      const jobTitle =
        application.job.title ||
        "your application";

      const company =
        application.job.company ||
        "the company";

      /*
        Application submitted notification
      */

      const applicationEventKey =
        `application:${application._id}:created`;

      await createNotification({
        recipient:
          user._id,

        type:
          "application",

        title:
          "Application submitted",

        message:
          `Your application for ${jobTitle} at ${company} was submitted successfully.`,

        link:
          "/applications",

        relatedId:
          application._id,

        eventKey:
          applicationEventKey,
      });

      /*
        Status notification
      */

      const statusEventKey =
        `application:${application._id}:status:${application.status}`;

      let statusMessage =
        `Your application for ${jobTitle} at ${company} is now ${application.status}.`;

      if (
        application.status ===
        "Shortlisted"
      ) {
        statusMessage =
          `Great news! You have been shortlisted for ${jobTitle} at ${company}.`;
      }

      if (
        application.status ===
        "Selected"
      ) {
        statusMessage =
          `Congratulations! You have been selected for ${jobTitle} at ${company}.`;
      }

      if (
        application.status ===
        "Rejected"
      ) {
        statusMessage =
          `Your application for ${jobTitle} at ${company} was not selected this time.`;
      }

      await createNotification({
        recipient:
          user._id,

        type:
          "status",

        title:
          `Application ${application.status}`,

        message:
          statusMessage,

        link:
          "/applications",

        relatedId:
          application._id,

        eventKey:
          statusEventKey,
      });

      /*
        Interview notification
      */

      if (
        application.interview &&
        application.interview.date
      ) {
        const interviewEventKey =
          `application:${application._id}:interview:${new Date(
            application.interview.date
          ).getTime()}`;

        const mode =
          application.interview.mode ||
          "online";

        await createNotification({
          recipient:
            user._id,

          type:
            "interview",

          title:
            "Interview scheduled",

          message:
            `Your interview for ${jobTitle} at ${company} has been scheduled. Mode: ${mode}.`,

          link:
            "/applications",

          relatedId:
            application._id,

          eventKey:
            interviewEventKey,
        });
      }
    }
  }

  /*
    Recruiter notifications
  */

  if (
    user.role === "recruiter" ||
    user.role === "admin"
  ) {
    const jobs =
      await Job.find({
        recruiter:
          user._id,
      }).select(
        "_id title company"
      );

    const jobIds =
      jobs.map(
        (job) =>
          job._id
      );

    if (!jobIds.length) {
      return;
    }

    const applications =
      await Application.find({
        job: {
          $in:
            jobIds,
        },
      })
        .populate(
          "candidate",
          "name"
        )
        .populate(
          "job",
          "title company"
        )
        .sort({
          createdAt: -1,
        })
        .limit(100);

    for (
      const application of applications
    ) {
      if (
        !application.candidate ||
        !application.job
      ) {
        continue;
      }

      const candidateName =
        application.candidate.name ||
        "A candidate";

      const jobTitle =
        application.job.title ||
        "your job";

      const eventKey =
        `application:${application._id}:recruiter-created`;

      await createNotification({
        recipient:
          user._id,

        type:
          "application",

        title:
          "New application received",

        message:
          `${candidateName} applied for ${jobTitle}.`,

        link:
          "/recruiter",

        relatedId:
          application._id,

        eventKey:
          eventKey,
      });

      /*
        Recruiter interview reminder
      */

      if (
        application.interview &&
        application.interview.date
      ) {
        const interviewEventKey =
          `application:${application._id}:recruiter-interview:${new Date(
            application.interview.date
          ).getTime()}`;

        await createNotification({
          recipient:
            user._id,

          type:
            "interview",

          title:
            "Interview scheduled",

          message:
            `An interview has been scheduled for ${candidateName} regarding ${jobTitle}.`,

          link:
            "/recruiter",

          relatedId:
            application._id,

          eventKey:
            interviewEventKey,
        });
      }
    }
  }
};

/* =========================================================
   GET NOTIFICATIONS
========================================================= */

export const getNotifications =
  async (
    req,
    res
  ) => {
    try {
      await syncApplicationNotifications(
        req.user
      );

      /*
        IMPORTANT:
        Message notifications are intentionally
        excluded from the Notifications page.

        This also hides old message notifications
        that may have previously been stored as
        "system".
      */

      const notifications =
        await Notification.find({
          recipient:
            req.user._id,

          type: {
            $ne:
              "message",
          },
        })
          .sort({
            createdAt: -1,
          })
          .limit(50);

      res.json(
        notifications
      );
    } catch (error) {
      console.error(
        "Notification fetch error:",
        error
      );

      res.status(500).json({
        message:
          "Unable to load notifications",
      });
    }
  };

/* =========================================================
   UNREAD COUNT
========================================================= */

export const getUnreadCount =
  async (
    req,
    res
  ) => {
    try {
      await syncApplicationNotifications(
        req.user
      );

      /*
        Message notifications are excluded
        from the main notification badge.

        Messages have their own unread counter.
      */

      const count =
        await Notification.countDocuments({
          recipient:
            req.user._id,

          type: {
            $ne:
              "message",
          },

          read:
            false,
        });

      res.json({
        count,
      });
    } catch (error) {
      console.error(
        "Unread notification error:",
        error
      );

      res.status(500).json({
        message:
          "Unable to load unread notifications",
      });
    }
  };

/* =========================================================
   MARK SINGLE NOTIFICATION READ
========================================================= */

export const markAsRead =
  async (
    req,
    res
  ) => {
    try {
      const notification =
        await Notification.findOneAndUpdate(
          {
            _id:
              req.params.id,

            recipient:
              req.user._id,

            /*
              A message is not treated as a
              normal notification.
            */
            type: {
              $ne:
                "message",
            },
          },

          {
            read:
              true,
          },

          {
            new:
              true,
          }
        );

      if (!notification) {
        return res.status(404).json({
          message:
            "Notification not found",
        });
      }

      res.json(
        notification
      );
    } catch (error) {
      res.status(500).json({
        message:
          "Unable to update notification",
      });
    }
  };

/* =========================================================
   MARK ALL READ
========================================================= */

export const markAllAsRead =
  async (
    req,
    res
  ) => {
    try {
      /*
        Mark only actual notifications as read.
        Message state is controlled by Message.read.
      */

      await Notification.updateMany(
        {
          recipient:
            req.user._id,

          type: {
            $ne:
              "message",
          },

          read:
            false,
        },

        {
          read:
            true,
        }
      );

      res.json({
        message:
          "All notifications marked as read",
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Unable to update notifications",
      });
    }
  };

/* =========================================================
   DELETE NOTIFICATION
========================================================= */

export const deleteNotification =
  async (
    req,
    res
  ) => {
    try {
      const notification =
        await Notification.findOneAndDelete(
          {
            _id:
              req.params.id,

            recipient:
              req.user._id,

            type: {
              $ne:
                "message",
            },
          }
        );

      if (!notification) {
        return res.status(404).json({
          message:
            "Notification not found",
        });
      }

      res.json({
        message:
          "Notification deleted",
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Unable to delete notification",
      });
    }
  };