const express = require("express");
const router = express.Router();
const post_controller = require("../controllers/post_controller");
const { verifyToken } = require("../verification");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//starting with /api/v1/posts

// new post
router.post("/", verifyToken, post_controller.new);

//get all posts by one user
router.get("/profile/:id", verifyToken, post_controller.profile);

// update post
router.put("/:id", verifyToken, post_controller.update);

// get all posts
router.get("/", verifyToken, post_controller.index);

// get one post
router.get("/:id", verifyToken, post_controller.show);

// delete post
router.delete("/:id", verifyToken, post_controller.delete);

router.post("/like/:id", verifyToken, post_controller.like);

module.exports = router;
