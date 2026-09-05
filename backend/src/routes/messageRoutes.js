import { Router } from "express";

import {
  conversations,
  unreadCount,
  people,
  thread,
  sendMessage,
} from "../controllers/messageController.js";

import { auth } from "../middleware/auth.js";

const router = Router();

router.get(
  "/",
  auth,
  conversations
);

router.get(
  "/unread-count",
  auth,
  unreadCount
);

router.get(
  "/people",
  auth,
  people
);

router.get(
  "/:userId",
  auth,
  thread
);

router.post(
  "/:userId",
  auth,
  sendMessage
);

export default router;