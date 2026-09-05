import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import http from "http";

import {
  mkdirSync,
} from "fs";

import path from "path";

import {
  fileURLToPath,
} from "url";

import {
  Server,
} from "socket.io";

import jwt from "jsonwebtoken";
import User from "./models/User.js";

import {
  connectDB,
} from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";

// ==========================================
// DATABASE
// ==========================================

await connectDB();

// ==========================================
// DIRECTORIES
// ==========================================

const __filename =
  fileURLToPath(
    import.meta.url
  );

const __dirname =
  path.dirname(
    __filename
  );

// backend/uploads
const uploadDir =
  path.resolve(
    __dirname,
    "../uploads"
  );

mkdirSync(
  uploadDir,
  {
    recursive: true,
  }
);

// ==========================================
// EXPRESS
// ==========================================

const app =
  express();

const server =
  http.createServer(
    app
  );

// ==========================================
// SOCKET.IO
// ==========================================

const io =
  new Server(
    server,
    {
      cors: {
        origin:
          process.env.CLIENT_URL ||
          "http://localhost:5173",
      },
    }
  );

// ==========================================
// CORS
// ==========================================

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",
  })
);

// ==========================================
// HELMET
// ==========================================

app.use(
  helmet({
    crossOriginResourcePolicy:
      false,
  })
);

// ==========================================
// BODY PARSER
// ==========================================

app.use(
  express.json()
);

// ==========================================
// LOGGER
// ==========================================

app.use(
  morgan("dev")
);

// ==========================================
// RATE LIMIT
// ==========================================

app.use(
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    max: 300,
  })
);

// ==========================================
// STATIC UPLOADS
// ==========================================

app.use(
  "/uploads",
  express.static(
    uploadDir
  )
);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      ok: true,

      service:
        "JobTrack Pro",
    });
  }
);

// ==========================================
// ROUTES
// ==========================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/jobs",
  jobRoutes
);

app.use(
  "/api/applications",
  applicationRoutes
);

app.use(
  "/api/profile",
  profileRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);

app.use(
  "/api/notifications",
  notificationRoutes
);

app.use(
  "/api/messages",
  messageRoutes
);

app.use(
  "/api/settings",
  settingsRoutes
);

// ==========================================
// SOCKET.IO AUTH
// ==========================================

io.use(
  async (
    socket,
    next
  ) => {
    try {
      const token =
        socket.handshake
          .auth
          ?.token;

      if (!token) {
        return next(
          new Error(
            "Authentication required"
          )
        );
      }

      const decoded =
        jwt.verify(
          token,
          process.env.JWT_SECRET
        );

      const user =
        await User.findById(
          decoded.id
        ).select(
          "_id role accountStatus tokenVersion"
        );

      if (!user) {
        return next(
          new Error(
            "User not found"
          )
        );
      }

      if (
        user.accountStatus !==
        "active"
      ) {
        return next(
          new Error(
            "Account is not active"
          )
        );
      }

      if (
        Number(
          decoded.tokenVersion ||
            0
        ) !==
        Number(
          user.tokenVersion ||
            0
        )
      ) {
        return next(
          new Error(
            "Session has been revoked"
          )
        );
      }

      socket.user =
        user;

      next();
    } catch (error) {
      next(
        new Error(
          "Invalid or expired token"
        )
      );
    }
  }
);

io.on(
  "connection",
  (socket) => {
    socket.join(
      `user:${socket.user._id}`
    );
  }
);

app.set(
  "io",
  io
);

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use(
  (
    err,
    req,
    res,
    next
  ) => {
    console.error(
      err
    );

    res.status(500).json({
      message:
        err.message ||
        "Server error",
    });
  }
);

// ==========================================
// SERVER
// ==========================================

const PORT =
  process.env.PORT ||
  5000;

server.listen(
  PORT,
  () => {
    console.log(
      `API running on ${PORT}`
    );
  }
);