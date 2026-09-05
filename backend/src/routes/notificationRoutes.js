import {
  Router,
} from "express";


import {
  auth,
} from "../middleware/auth.js";


import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";


const router = Router();


router.get(
  "/",
  auth,
  getNotifications
);


router.get(
  "/unread-count",
  auth,
  getUnreadCount
);


router.patch(
  "/:id/read",
  auth,
  markAsRead
);


router.patch(
  "/read-all",
  auth,
  markAllAsRead
);


router.delete(
  "/:id",
  auth,
  deleteNotification
);


export default router;