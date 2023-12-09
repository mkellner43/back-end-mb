const express = require("express");
const router = express.Router();
const friend_request_controller = require("../controllers/friend_request_controller");
const { verifyToken } = require("../verification");

// starting with /api/v1/friend_requests

router.post("/:user_id", verifyToken, friend_request_controller.new);

router.post("/accept/:id", verifyToken, friend_request_controller.accept);

router.delete("/:id", verifyToken, friend_request_controller.delete);

router.get("/friends", verifyToken, friend_request_controller.show_friends);

router.get("/suggestions", verifyToken, friend_request_controller.suggestions);

router.get("/pending", verifyToken, friend_request_controller.pending);

module.exports = router;
