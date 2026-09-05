import Message from "../models/Message.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

const allowedRoles = [
  "candidate",
  "recruiter",
  "admin",
];

const isAllowedParticipant = (
  role
) =>
  role === "candidate" ||
  role === "recruiter" ||
  role === "admin";

const canMessage = (
  fromRole,
  toRole
) => {
  if (
    !isAllowedParticipant(
      fromRole
    ) ||
    !isAllowedParticipant(
      toRole
    )
  ) {
    return false;
  }

  if (
    fromRole === "admin" ||
    toRole === "admin"
  ) {
    return true;
  }

  return (
    fromRole !== toRole
  );
};

const getOtherUser = (
  message,
  currentUserId
) => {
  const from =
    message.from;

  const to =
    message.to;

  return String(
    from._id
  ) ===
    String(
      currentUserId
    )
    ? to
    : from;
};

/* =========================================================
   MESSAGE NOTIFICATION

   IMPORTANT:
   This creates a "message" notification only as a
   separate message-event record.

   The normal Notifications API excludes this type.
   The actual unread count comes from Message.read.
========================================================= */

const createMessageNotification =
  async (
    message
  ) => {
    try {
      const [
        sender,
        recipient,
      ] =
        await Promise.all([
          User.findById(
            message.from
          ).select(
            "name"
          ),

          User.findById(
            message.to
          ).select(
            "notificationPreferences"
          ),
        ]);

      /*
        Respect user's Account Settings.

        If Messages notifications are disabled,
        do not create the auxiliary notification.
      */

      if (
        recipient
          ?.notificationPreferences
          ?.messages ===
        false
      ) {
        return;
      }

      const senderName =
        sender?.name ||
        "Someone";

      await Notification.create({
        recipient:
          message.to,

        /*
          IMPORTANT:
          This is a separate "message" type.
          Notifications controller excludes it.
        */
        type:
          "message",

        title:
          "New message",

        message:
          `${senderName} sent you a message.`,

        link:
          "/messages",

        relatedId:
          message._id,

        eventKey:
          `message:${message._id}`,
      });
    } catch (error) {
      /*
        Notification creation should never
        break actual message delivery.
      */

      if (
        error.code !==
        11000
      ) {
        console.error(
          "Message notification error:",
          error
        );
      }
    }
  };

/* =========================================================
   CONVERSATIONS
========================================================= */

export const conversations =
  async (
    req,
    res,
    next
  ) => {
    try {
      const messages =
        await Message.find({
          $or: [
            {
              from:
                req.user._id,
            },

            {
              to:
                req.user._id,
            },
          ],
        })
          .populate(
            "from",
            "name avatar role"
          )
          .populate(
            "to",
            "name avatar role"
          )
          .sort(
            "-createdAt"
          );

      const map =
        new Map();

      for (
        const message of messages
      ) {
        const other =
          getOtherUser(
            message,
            req.user._id
          );

        if (
          !other ||
          !canMessage(
            req.user.role,
            other.role
          )
        ) {
          continue;
        }

        const key =
          String(
            other._id
          );

        if (
          !map.has(key)
        ) {
          map.set(
            key,
            {
              user:
                other,

              lastMessage:
                message,

              unreadCount:
                0,
            }
          );
        }

        /*
          Conversation unread count is based
          ONLY on Message.read.
        */

        if (
          String(
            message.to?._id
          ) ===
            String(
              req.user._id
            ) &&
          !message.read
        ) {
          map.get(
            key
          ).unreadCount +=
            1;
        }
      }

      res.json(
        [
          ...map.values(),
        ]
      );
    } catch (error) {
      next(error);
    }
  };

/* =========================================================
   MESSAGE UNREAD COUNT
========================================================= */

export const unreadCount =
  async (
    req,
    res,
    next
  ) => {
    try {
      /*
        This is the ONLY source for the
        Messages badge count.
      */

      const count =
        await Message.countDocuments({
          to:
            req.user._id,

          read:
            false,
        });

      res.json({
        count,
      });
    } catch (error) {
      next(error);
    }
  };

/* =========================================================
   SEARCH PEOPLE
========================================================= */

export const people =
  async (
    req,
    res,
    next
  ) => {
    try {
      const search =
        String(
          req.query.search ||
            ""
        ).trim();

      const requestedRole =
        String(
          req.query.role ||
            ""
        ).trim();

      let rolesToSearch;

      if (
        req.user.role ===
        "candidate"
      ) {
        rolesToSearch =
          [
            "recruiter",
          ];
      } else if (
        req.user.role ===
        "recruiter"
      ) {
        rolesToSearch =
          [
            "candidate",
          ];
      } else {
        rolesToSearch =
          [
            "candidate",
            "recruiter",
          ];
      }

      if (
        requestedRole &&
        rolesToSearch.includes(
          requestedRole
        )
      ) {
        rolesToSearch =
          [
            requestedRole,
          ];
      }

      const filter = {
        _id: {
          $ne:
            req.user._id,
        },

        role: {
          $in:
            rolesToSearch,
        },
      };

      if (search) {
        const safeSearch =
          search.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          );

        const regex =
          new RegExp(
            safeSearch,
            "i"
          );

        filter.$or = [
          {
            name:
              regex,
          },

          {
            email:
              regex,
          },

          {
            company:
              regex,
          },

          {
            headline:
              regex,
          },

          {
            industry:
              regex,
          },
        ];
      }

      const users =
        await User.find(
          filter
        )
          .select(
            "name email avatar role headline company industry location"
          )
          .sort({
            name: 1,
          })
          .limit(20);

      res.json(
        users
      );
    } catch (error) {
      next(error);
    }
  };

/* =========================================================
   THREAD
========================================================= */

export const thread =
  async (
    req,
    res,
    next
  ) => {
    try {
      const otherUser =
        await User.findById(
          req.params.userId
        ).select(
          "name email avatar role headline company industry location"
        );

      if (!otherUser) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      if (
        !canMessage(
          req.user.role,
          otherUser.role
        )
      ) {
        return res.status(403).json({
          message:
            "You can only message candidates and recruiters.",
        });
      }

      const messages =
        await Message.find({
          $or: [
            {
              from:
                req.user._id,

              to:
                req.params.userId,
            },

            {
              from:
                req.params.userId,

              to:
                req.user._id,
            },
          ],
        })
          .populate(
            "from",
            "name avatar role"
          )
          .populate(
            "to",
            "name avatar role"
          )
          .sort(
            "createdAt"
          );

      /*
        Opening a conversation marks the
        actual messages as read.

        This controls the Messages badge.
      */

      await Message.updateMany(
        {
          from:
            req.params.userId,

          to:
            req.user._id,

          read:
            false,
        },

        {
          read:
            true,
        }
      );

      res.json({
        user:
          otherUser,

        messages,
      });
    } catch (error) {
      next(error);
    }
  };

/* =========================================================
   SEND MESSAGE
========================================================= */

export const sendMessage =
  async (
    req,
    res,
    next
  ) => {
    try {
      const text =
        String(
          req.body.text ||
            ""
        ).trim();

      if (!text) {
        return res.status(400).json({
          message:
            "Message is required",
        });
      }

      if (
        text.length >
        5000
      ) {
        return res.status(400).json({
          message:
            "Message cannot exceed 5000 characters.",
        });
      }

      const recipient =
        await User.findById(
          req.params.userId
        ).select(
          "name role"
        );

      if (!recipient) {
        return res.status(404).json({
          message:
            "Recipient not found",
        });
      }

      if (
        !canMessage(
          req.user.role,
          recipient.role
        )
      ) {
        return res.status(403).json({
          message:
            "Messaging is available between candidates and recruiters.",
        });
      }

      /*
        Create the actual message.
        Message.read is the source of truth
        for message unread state.
      */

      const message =
        await Message.create({
          from:
            req.user._id,

          to:
            req.params.userId,

          job:
            req.body.job ||
            undefined,

          application:
            req.body.application ||
            undefined,

          text,
        });

      const populated =
        await Message.findById(
          message._id
        )
          .populate(
            "from",
            "name avatar role"
          )
          .populate(
            "to",
            "name avatar role"
          );

      /*
        Auxiliary message event.

        This is stored as type "message", so the
        normal Notifications page/count will ignore it.
      */

      await createMessageNotification(
        message
      );

      /*
        Real-time delivery.
      */

      const io =
        req.app.get(
          "io"
        );

      if (io) {
        io.to(
          `user:${req.params.userId}`
        ).emit(
          "receive-message",
          populated
        );
      }

      res
        .status(201)
        .json(
          populated
        );
    } catch (error) {
      next(error);
    }
  };