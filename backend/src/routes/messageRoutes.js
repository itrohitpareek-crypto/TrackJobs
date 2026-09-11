import { Router } from "express";

import {
  upload,
  conversations,
  unreadCount,
  people,
  thread,
  sendMessage,
  markThreadRead,
  editMessage,
  deleteMessage,
  clearChat,
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
  upload.array(
    "attachments",
    10
  ),
  sendMessage
);

router.patch(
  "/:userId/read",
  auth,
  markThreadRead
);

router.patch(
  "/:userId/:messageId",
  auth,
  editMessage
);

router.delete(
  "/:userId/clear",
  auth,
  clearChat
);

router.delete(
  "/:userId/:messageId",
  auth,
  deleteMessage
);

export default router;