import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

const allowedRoles = ["candidate", "recruiter", "admin"];

const isAllowedParticipant = (role) =>
  role === "candidate" ||
  role === "recruiter" ||
  role === "admin";

const canMessage = (fromRole, toRole) => {
  if (
    !isAllowedParticipant(fromRole) ||
    !isAllowedParticipant(toRole)
  ) {
    return false;
  }

  if (fromRole === "admin" || toRole === "admin") {
    return true;
  }

  return fromRole !== toRole;
};

const getOtherUser = (message, currentUserId) => {
  const from = message.from;
  const to = message.to;

  return String(from._id) === String(currentUserId)
    ? to
    : from;
};

/* =========================================================
   MESSAGE NOTIFICATION
========================================================= */

const createMessageNotification = async (message) => {
  try {
    const [sender, recipient] = await Promise.all([
      User.findById(message.from).select("name"),
      User.findById(message.to).select(
        "notificationPreferences"
      ),
    ]);

    if (
      recipient?.notificationPreferences?.messages === false
    ) {
      return;
    }

    const senderName = sender?.name || "Someone";

    await Notification.create({
      recipient: message.to,
      type: "message",
      title: "New message",
      message: `${senderName} sent you a message.`,
      link: "/messages",
      relatedId: message._id,
      eventKey: `message:${message._id}`,
    });
  } catch (error) {
    if (error.code !== 11000) {
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

export const conversations = async (req, res, next) => {
  try {
    const messages = await Message.find({
      $or: [
        { from: req.user._id },
        { to: req.user._id },
      ],
    })
      .populate("from", "name avatar role")
      .populate("to", "name avatar role")
      .sort("-createdAt");

    const map = new Map();

    for (const message of messages) {
      const other = getOtherUser(
        message,
        req.user._id
      );

      if (
        !other ||
        !canMessage(req.user.role, other.role)
      ) {
        continue;
      }

      const key = String(other._id);

      if (!map.has(key)) {
        map.set(key, {
          user: other,
          lastMessage: message,
          unreadCount: 0,
        });
      }

      if (
        String(message.to?._id) ===
          String(req.user._id) &&
        !message.read
      ) {
        map.get(key).unreadCount += 1;
      }
    }

    res.json([...map.values()]);
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   UNREAD COUNT
========================================================= */

export const unreadCount = async (
  req,
  res,
  next
) => {
  try {
    const count = await Message.countDocuments({
      to: req.user._id,
      read: false,
    });

    res.json({ count });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   SEARCH PEOPLE
========================================================= */

export const people = async (req, res, next) => {
  try {
    const search = String(
      req.query.search || ""
    ).trim();

    const requestedRole = String(
      req.query.role || ""
    ).trim();

    let rolesToSearch;

    if (req.user.role === "candidate") {
      rolesToSearch = ["recruiter"];
    } else if (req.user.role === "recruiter") {
      rolesToSearch = ["candidate"];
    } else {
      rolesToSearch = [
        "candidate",
        "recruiter",
      ];
    }

    if (
      requestedRole &&
      rolesToSearch.includes(requestedRole)
    ) {
      rolesToSearch = [requestedRole];
    }

    const filter = {
      _id: {
        $ne: req.user._id,
      },
      role: {
        $in: rolesToSearch,
      },
    };

    if (search) {
      const safeSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const regex = new RegExp(
        safeSearch,
        "i"
      );

      filter.$or = [
        { name: regex },
        { email: regex },
        { company: regex },
        { headline: regex },
        { industry: regex },
      ];
    }

    const users = await User.find(filter)
      .select(
        "name email avatar role headline company industry location"
      )
      .sort({ name: 1 })
      .limit(20);

    res.json(users);
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   THREAD
========================================================= */

export const thread = async (req, res, next) => {
  try {
    const otherUser = await User.findById(
      req.params.userId
    ).select(
      "name email avatar role headline company industry location"
    );

    if (!otherUser) {
      return res.status(404).json({
        message: "User not found",
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

    const messages = await Message.find({
      $or: [
        {
          from: req.user._id,
          to: req.params.userId,
        },
        {
          from: req.params.userId,
          to: req.user._id,
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
      .populate(
        "replyTo",
        "from text attachments createdAt deleted"
      )
      .sort("createdAt");

    await Message.updateMany(
      {
        from: req.params.userId,
        to: req.user._id,
        read: false,
      },
      {
        $set: {
          read: true,
        },
      }
    );

    res.json({
      user: otherUser,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   CLOUDINARY CONFIGURATION
========================================================= */

const configureCloudinary = () => {
  cloudinary.config({
    cloud_name:
      process.env.CLOUDINARY_CLOUD_NAME,

    api_key:
      process.env.CLOUDINARY_API_KEY,

    api_secret:
      process.env.CLOUDINARY_API_SECRET,
  });
};

/* =========================================================
   MULTER FILE UPLOAD
========================================================= */

export const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    files: 10,
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/zip",
      "application/x-zip-compressed",
      "text/plain",
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "This file type is not supported."
        ),
        false
      );
    }
  },
});

/* =========================================================
   UPLOAD BUFFER TO CLOUDINARY
========================================================= */

const uploadBuffer = (file) =>
  new Promise((resolve, reject) => {
    configureCloudinary();

    const stream =
      cloudinary.uploader.upload_stream(
        {
          folder: "trackjobs/messages",
          resource_type: "auto",
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

    stream.end(file.buffer);
  });

/* =========================================================
   DELETE CLOUDINARY FILE
========================================================= */

const removeCloudinaryFile = async (
  attachment
) => {
  if (!attachment?.publicId) {
    return;
  }

  try {
    configureCloudinary();

    await cloudinary.uploader.destroy(
      attachment.publicId,
      {
        resource_type:
          attachment.resourceType === "image"
            ? "image"
            : "raw",
      }
    );
  } catch (error) {
    console.error(
      "Chat attachment cleanup error:",
      error.message
    );
  }
};

/* =========================================================
   POPULATE MESSAGE
========================================================= */

const populateMessage = (id) =>
  Message.findById(id)
    .populate(
      "from",
      "name avatar role"
    )
    .populate(
      "to",
      "name avatar role"
    )
    .populate(
      "replyTo",
      "from text attachments createdAt deleted"
    );

/* =========================================================
   VALIDATE MESSAGE
========================================================= */

const validateMessageContent = (
  text,
  files = []
) => {
  const cleanText = String(
    text || ""
  ).trim();

  if (
    !cleanText &&
    !files.length
  ) {
    return "Message or attachment is required.";
  }

  if (cleanText.length > 5000) {
    return "Message cannot exceed 5000 characters.";
  }

  return "";
};

/* =========================================================
   SEND MESSAGE
========================================================= */

export const sendMessage = async (
  req,
  res,
  next
) => {
  const uploaded = [];

  try {
    const files = req.files || [];

    const validationError =
      validateMessageContent(
        req.body.text,
        files
      );

    if (validationError) {
      return res.status(400).json({
        message: validationError,
      });
    }

    const recipient =
      await User.findById(
        req.params.userId
      ).select(
        "name role notificationPreferences"
      );

    if (!recipient) {
      return res.status(404).json({
        message: "Recipient not found",
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

    const attachments = [];

    for (const file of files) {
      const result =
        await uploadBuffer(file);

      uploaded.push(result);

      attachments.push({
        url: result.secure_url,
        publicId: result.public_id,
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        resourceType:
          result.resource_type || "auto",
      });
    }

    const message =
      await Message.create({
        from: req.user._id,
        to: req.params.userId,

        job:
          req.body.job ||
          undefined,

        application:
          req.body.application ||
          undefined,

        text: String(
          req.body.text || ""
        ).trim(),

        attachments,

        replyTo:
          req.body.replyTo ||
          undefined,
      });

    const populated =
      await populateMessage(
        message._id
      );

    /*
      Notification failure should never
      delete successfully uploaded attachments
      or break the actual message.
    */
    await createMessageNotification(
      message
    );

    const io =
      req.app.get("io");

    if (io) {
      io.to(
        `user:${req.params.userId}`
      ).emit(
        "receive-message",
        populated
      );
    }

    return res.status(201).json(
      populated
    );
  } catch (error) {
    /*
      Cleanup only files that were uploaded
      before the message request failed.
    */
    for (const result of uploaded) {
      await removeCloudinaryFile({
        publicId:
          result.public_id,

        resourceType:
          result.resource_type,
      });
    }

    next(error);
  }
};

/* =========================================================
   MARK THREAD AS READ
========================================================= */

export const markThreadRead = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await Message.updateMany(
        {
          from:
            req.params.userId,

          to:
            req.user._id,

          read: false,
        },
        {
          $set: {
            read: true,
          },
        }
      );

    const io =
      req.app.get("io");

    if (
      io &&
      result.modifiedCount
    ) {
      io.to(
        `user:${req.params.userId}`
      ).emit(
        "messages-read",
        {
          by: String(
            req.user._id
          ),

          withUser: String(
            req.params.userId
          ),
        }
      );
    }

    res.json({
      success: true,
      modifiedCount:
        result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   EDIT MESSAGE
========================================================= */

export const editMessage = async (
  req,
  res,
  next
) => {
  try {
    const text = String(
      req.body.text || ""
    ).trim();

    if (!text) {
      return res.status(400).json({
        message:
          "Message text is required.",
      });
    }

    if (text.length > 5000) {
      return res.status(400).json({
        message:
          "Message cannot exceed 5000 characters.",
      });
    }

    const message =
      await Message.findOne({
        _id:
          req.params.messageId,

        from:
          req.user._id,
      });

    if (!message) {
      return res.status(404).json({
        message:
          "Message not found or not yours.",
      });
    }

    if (message.deleted) {
      return res.status(400).json({
        message:
          "Deleted messages cannot be edited.",
      });
    }

    const age =
      Date.now() -
      new Date(
        message.createdAt
      ).getTime();

    if (
      age >
      15 * 60 * 1000
    ) {
      return res.status(400).json({
        message:
          "Messages can only be edited within 15 minutes.",
      });
    }

    message.text = text;
    message.edited = true;

    await message.save();

    const populated =
      await populateMessage(
        message._id
      );

    const io =
      req.app.get("io");

    if (io) {
      io.to(
        `user:${message.to}`
      ).emit(
        "message-updated",
        populated
      );

      io.to(
        `user:${message.from}`
      ).emit(
        "message-updated",
        populated
      );
    }

    res.json(populated);
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   DELETE MESSAGE
========================================================= */

export const deleteMessage = async (
  req,
  res,
  next
) => {
  try {
    const message =
      await Message.findOne({
        _id:
          req.params.messageId,

        from:
          req.user._id,
      });

    if (!message) {
      return res.status(404).json({
        message:
          "Message not found or not yours.",
      });
    }

    for (
      const attachment of
        message.attachments || []
    ) {
      await removeCloudinaryFile(
        attachment
      );
    }

    message.text = "";
    message.attachments = [];
    message.deleted = true;
    message.deletedAt =
      new Date();

    await message.save();

    const payload = {
      messageId: String(
        message._id
      ),

      deletedBy: String(
        req.user._id
      ),

      conversationUserId:
        String(message.to),
    };

    const io =
      req.app.get("io");

    if (io) {
      io.to(
        `user:${message.to}`
      ).emit(
        "message-deleted",
        payload
      );

      io.to(
        `user:${message.from}`
      ).emit(
        "message-deleted",
        payload
      );
    }

    res.json({
      success: true,
      ...payload,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   CLEAR CHAT
========================================================= */

export const clearChat = async (
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
      }).select(
        "attachments from to"
      );

    for (
      const message of messages
    ) {
      for (
        const attachment of
          message.attachments || []
      ) {
        await removeCloudinaryFile(
          attachment
        );
      }
    }

    await Message.deleteMany({
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
    });

    const io =
      req.app.get("io");

    if (io) {
      io.to(
        `user:${req.params.userId}`
      ).emit(
        "chat-cleared",
        {
          userId: String(
            req.user._id
          ),
        }
      );

      io.to(
        `user:${req.user._id}`
      ).emit(
        "chat-cleared",
        {
          userId: String(
            req.params.userId
          ),
        }
      );
    }

    res.json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
};