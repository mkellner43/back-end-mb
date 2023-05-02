const express = require("express");
const router = express.Router();
const comment_controller = require("../controllers/comment_controller");
const { verifyToken } = require("../verification");

//starting with /api/v1/comments

//get all comments for post
router.get("/:post_id", comment_controller.index);

//create new comment for post
router.post("/:post_id", verifyToken, comment_controller.new);

//delete comment for post
router.delete("/:post_id/:comment_id", verifyToken, comment_controller.delete);

module.exports = router;
