const Comment = require("../models/comment");
const Post = require("../models/post");
const User = require("../models/user");
const Notification = require("../models/notification");

exports.new = (req, res, next) => {
  console.log(req.body);
  Comment.create({
    comment_body: req.body.comment_body,
    user: req.user.user_id,
    post: req.params.post_id,
  })
    .then(async (result) => {
      try {
        const post = await Post.findById(req.params.post_id);
        post.comments.push(result);
        await post.save();
        const user = await User.findById(post.user);
        if (post.user.valueOf() !== req.user.user_id) {
          const notification = await Notification.create({
            requester: req.user.user_id,
            receiver: post.user,
            type: "Comment",
            data: result,
            msg: `${req.user.username} commented on your post!`,
          });
          user.notifications.push(notification);
          await user.save();
        }
        res.status(201).send(post);
      } catch (e) {
        next(e);
      }
    })
    .catch(next);
};

exports.index = async (req, res, next) => {
  try {
    const [count, comments] = await Promise.all([
      Comment.find({ post: req.params.post_id }).count(),
      Comment.find({ post: req.params.post_id })
        .sort({ date: -1 })
        .skip(req.query.skip)
        .limit(req.query.limit)
        .populate("user", "username first_name last_name avatar"),
    ]);
    res.send({
      comments,
      nextCursor: Number(req.query.skip) + Number(req.query.limit),
    });
  } catch (e) {
    next(e);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const post = await Post.findOne({ _id: req.params.post_id }).populate(
      "user",
      "username"
    );
    const comment = await Comment.findOne({
      _id: req.params.comment_id,
    }).populate("user", "username");
    if (
      post.user.username === req.user.username ||
      comment.user.username === req.user.username
    ) {
      const result = await Comment.deleteOne({ _id: req.params.comment_id });
      res.send(result);
    } else res.sendStatus(302);
  } catch (e) {
    next(e);
  }
};

exports.show = async (req, res, next) => {
  try {
    const post = await Comment.find({ post_id: req.params.post_id })
      .sort({ date: -1 })
      .skip(req.params.skip)
      .limit(5);
  } catch (e) {
    next(e);
  }
};

//GET INFINITE QUERY WORKING, MESSAGES, NOTIFICATIONS, COMMENTS
