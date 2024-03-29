const express = require("express");
const router = express.Router();
const user_controller = require("../controllers/user_controller");
const { verifyToken } = require("../verification");

//starting with /api/v1/users

router.post("/login", user_controller.authenticate);

router.post("/login/guest", user_controller.authenticateGuest);

router.post("/registration", user_controller.create);

router.post(
  "/notifications/read",
  verifyToken,
  user_controller.readNotifications
);

router.post(
  "/notifications/read/:id",
  verifyToken,
  user_controller.readNotification
);

router.post(
  "/notifications/unread",
  verifyToken,
  user_controller.unreadNotifications
);

router.delete(
  "/notifications/:id",
  verifyToken,
  user_controller.deleteNotification
);

router.get("/notifications", verifyToken, user_controller.notifications);

router.put("/avatar", verifyToken, user_controller.update);

module.exports = router;
