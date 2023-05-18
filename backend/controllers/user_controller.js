const User = require("../models/user");
const Notification = require("../models/notification");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cloudinary = require("../utils/cloudinary");

exports.authenticate = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!(username && password))
      return res.status(400).send("All input is required");
    const user = await User.findOne({ username: username.toLowerCase() });
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { user_id: user._id, username },
        process.env.TOKEN_KEY,
        { expiresIn: "24h" }
      );
      // await user.populate("avatar");
      return res
        // .cookie("access_token", token)
        // .status(200)
        .send({
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          id: user._id,
          avatar: user.avatar,
          token: token,
        });
    } else res.sendStatus(401);
  } catch (err) {
    res.status(400).send("Invalid Credentials", err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { first_name, last_name, username, password } = req.body;
    if (!(username && password && first_name && last_name))
      return res.status(400).send("All input is required");
    const oldUser = await User.findOne({ username: username.toLowerCase() });
    if (oldUser)
      return res.status(409).send("User Already Exist. Please Login");
    encryptedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      first_name,
      last_name,
      username: username.toLowerCase(),
      password: encryptedPassword,
    });
    res.status(201).json({ msg: "user created!" });
  } catch (err) {
    next(err);
  }
};

exports.notifications = async (req, res, next) => {
  const [notifications, count, unreadCount] = await Promise.all([
    await Notification.find({ receiver: req.user.user_id })
      .sort({ date: -1 })
      .skip(req.query.skip)
      .limit(req.query.limit)
      .populate("requester", "username first_name last_name avatar"),
    await Notification.find({ receiver: req.user.user_id }).count(),
    await Notification.find({
      $and: [{ receiver: req.user.user_id }, { status: "unread" }],
    }).count(),
  ]);
  const cursor =
    count > Number(req.query.skip) + Number(req.query.limit)
      ? Number(req.query.skip) + Number(req.query.limit)
      : undefined;
  res.json({
    notifications,
    cursor: cursor,
    count: count,
    unread: unreadCount,
  });
};

exports.readNotifictions = async (req, res, next) => {
  try {
    const notifications = await Notification.updateMany(
      { receiver: req.user.user_id },
      { $set: { status: "read" } }
    );
    res.send(notifications);
  } catch (err) {
    next(err);
  }
};

exports.readNotifiction = async (req, res, next) => {
  try {
    const notifications = await Notification.updateOne(
      { _id: req.params.id },
      { $set: { status: "read" } }
    );
    res.send(notifications);
  } catch (err) {
    next(err);
  }
};

exports.unreadNotifictions = async (req, res, next) => {
  try {
    const notifications = await Notification.updateMany(
      { receiver: req.user.user_id },
      { $set: { status: "unread" } }
    );
    res.send(notifications);
  } catch (err) {
    next(err);
  }
};

exports.deleteNotification = async (req, res, next) => {
  User.updateOne(
    { _id: req.user.user_id },
    { $pull: { notifications: req.params.id } }
  )
    .exec()
    .then((result) => {
      Notification.deleteOne({ _id: req.params.id })
        .exec()
        .then((data) => {
          return res.send({ result, data });
        });
    })
    .catch(next);
};

exports.update = async (req, res, next) => {
  const token = req.headers.authorization
  try {
    if (!req.body.avatar) {
      const user = await User.findById(req.user.user_id);
      user.avatar = null;
      user.save();
      return res.json({
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        id: user._id,
        avatar: user.avatar,
        token: token,
      });
    }
    const avatarImage = await cloudinary.uploader.upload(req.body.avatar, {
      folder: "avatar_images",
    });
    const user = await User.findById(req.user.user_id);
    user.avatar = {
      public_id: avatarImage.public_id,
      url: avatarImage.secure_url,
    };
    await user.save();
    console.log(user.avatar)
    console.log(token)
    return res.json({
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      id: user._id,
      avatar: user.avatar,
      token: token,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};
