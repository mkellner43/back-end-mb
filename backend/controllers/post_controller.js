const Post = require("../models/post");
const User = require("../models/user");
const Like = require("../models/like");
const Comment = require("../models/comment");
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

exports.delete = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    console.log(post);
    if (post.user == req.user.user_id) {
      if (post.image?.public_id)
        cloudinary.uploader.destroy(post.image.public_id);
      await Promise.all([
        Like.deleteMany({ _id: { $in: post.likes } }),
        Comment.deleteMany({ _id: { $in: post.comments } }),
      ]);
      const deleteResponse = await Post.deleteOne({ _id: post._id });
      res.json(deleteResponse);
    } else res.sendStatus(401);
  } catch (e) {
    next(e);
  }
};

exports.index = async (req, res, next) => {
  try {
    const [posts, count] = await Promise.all([
      Post.find({})
        .sort({ date: -1 })
        .skip(req.query.page)
        .limit(10)
        .populate("user", "first_name last_name username _id avatar")
        .populate("commentCount")
        .populate("likes")
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
        .populate("commentCount")
        .populate("likes")
        .populate({
          path: "comments",
          populate: {
            path: "user",
            select: "username first_name last_name avatar",
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

exports.like = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    const likes = await Like.find({ post_id: post._id }).and({
      user_id: req.user.user_id,
    });
    if (likes.length > 0) {
      let newArr = post.likes.filter((like) => {
        likes.filter((thisLike) => {
          console.log("from likes arr", thisLike);
          console.log("from post arr", like);
          return thisLike._id != like;
        }).length === 0;
      });
      post.likes = newArr;
      const [like, postUpdated] = await Promise.all([
        Like.deleteOne({ _id: likes[0]._id }),
        post.save(),
      ]);
      res.json({ msg: "removed like", data: postUpdated });
    } else {
      const like = await Like.create({
        user_id: req.user.user_id,
        post_id: post._id,
      });
      post.likes.push(like._id);
      console.log(post.likes);
      const updatedPost = await post.save();
      console.log(updatedPost);
      if (req.user.user_id != post.user) {
        const notification = await Notification.create({
          requester: req.user.user_id,
          receiver: post.user,
          type: "Like",
          data: like,
          msg: `${req.user.username} liked your post!`,
        });
        const postingUser = await User.findById(req.user.user_id);
        postingUser.notifications.push(notification);
        await postingUser.save();
        res.json({ msg: "like added", data: post });
      }
    }
  } catch (e) {
    next(e);
  }
};

// have to fix this bullshit ^^ all likes are disappearing when unliking
