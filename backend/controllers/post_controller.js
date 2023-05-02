const Post = require("../models/post");
const User = require("../models/user");
const Notification = require("../models/notification");
const cloudinary = require("../utils/cloudinary");

exports.new = async (req, res, next) => {
  try {
    let image = null;
    if (req.body.post_image)
      image = await cloudinary.uploader.upload(req.body.post_image, {
        folder: "post_images",
      });
    const post = await Post.create({
      post_body: req.body.post_body,
      user: req.user.user_id,
      image: {
        public_id: image?.public_id,
        url: image?.secure_url,
      },
    });
    await post.populate("user", "username first_name last_name avatar");
    await post.user.populate("avatar");
    res.send(post);
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  // using try catch
  try {
    const post = await Post.findById(req.params.id).populate(
      "user",
      "username avatar"
    );
    // check if requester is the posting user
    if (post.user.username === req.user.username) {
      post.post_body = req.body.post_body;
      post.date = Date.now();
      await post.save();
      res.send(post);
    } else res.sendStatus(401);
  } catch (e) {
    next(e);
  }
};

exports.delete = (req, res, next) => {
  // using promise chaining
  Post.findById(req.params.id)
    .populate("user", "username avatar")
    .exec()
    .then((response) => {
      // check if requester is the posting user
      if (response?.user.username === req.user.username) {
        Post.deleteOne({ _id: req.params.id })
          .then((response) => res.send(response))
          .catch(next);
      } else res.sendStatus(401);
    });
};

exports.index = async (req, res, next) => {
  try {
    const [posts, count] = await Promise.all([
      Post.find({})
        .sort({ date: -1 })
        .skip(req.query.page)
        .limit(10)
        .populate("user", "first_name last_name username _id avatar")
        .populate("likes", "username")
        .populate("commentCount")
        .populate({
          path: "comments",
          populate: {
            path: "user",
            select: "username first_name last_name avatar",
          },
          options: { sort: { date: -1 }, perDocumentLimit: 2 },
        }),
      Post.count(),
    ]);
    const hasMore = () => (Number(req.query.page) + 10 < count ? true : false);
    res.send({
      posts,
      cursor: Number(req.query.page) + 10,
      count,
      hasMore: hasMore(),
    });
  } catch (e) {
    next(e);
  }
};

exports.show = (req, res, next) => {
  const post = Post.findOne({ _id: req.params.id })
    .populate("user")
    .exec()
    .then((result) => res.send(result))
    .catch(next);
};

exports.profile = async (req, res, next) => {
  try {
    const [posts, count, user] = await Promise.all([
      Post.find({ user: req.params.id })
        .populate("user", "first_name last_name username _id avatar")
        .populate("likes", "username")
        .populate("commentCount")
        .populate({
          path: "comments",
          populate: {
            path: "user",
            select: "username first_name last_name avatar",
            populate: "avatar",
          },
          options: { sort: { date: -1 }, limit: 2 },
        })
        .sort({ date: -1 })
        .skip(req.query.page)
        .limit(10),
      Post.find({ user: req.params.id }).count(),
      User.findById(req.params.id, "_id username first_name last_name avatar"),
    ]);
    const hasMore = Number(req.query.page) + 10 < count ? true : false;
    res.send({
      posts,
      cursor: Number(req.query.page) + 10,
      count,
      hasMore,
      user,
    });
  } catch (err) {
    next(err);
  }
};

exports.search = () => {
  Post.find({ user: req.user._id });
};

exports.like = (req, res, next) => {
  Post.findById(req.params.id)
    .populate("likes", "first_name last_name username")
    .then(async (result) => {
      const hasLiked = result.likes.filter(
        (user) => user._id.valueOf() === req.user.user_id
      );
      if (hasLiked.length > 0) {
        result.likes = result.likes.filter(
          (user) => user._id.valueOf() !== req.user.user_id
        );
        await result.save();
        res.json({ msg: "removed like", data: result });
      } else {
        result.likes.push(req.user.user_id);
        await result.save();
        const postingUser = await User.findById(result.user);
        if (req.user.user_id !== result.user.valueOf()) {
          const notification = await Notification.create({
            requester: req.user.user_id,
            receiver: result.user,
            type: "Like",
            data: result,
            msg: `${req.user.username} liked your post!`,
          });
          postingUser.notifications.push(notification);
          postingUser.save();
        }
        res.json({ msg: "like added", data: result });
      }
    })
    .catch(next);
};
