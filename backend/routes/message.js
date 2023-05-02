const express = require("express");
const router = express.Router();
const message_controller = require("../controllers/message_controller");
const { verifyToken } = require("../verification");

//starting with /api/v1/messages
// get one message thread
router.get("/", verifyToken, message_controller.index);

// show message thread
router.get("/:id", verifyToken, message_controller.show);

// new message
router.post("/", verifyToken, message_controller.create);

// delete message thread
router.delete("/:id", verifyToken, message_controller.delete);

module.exports = router;
