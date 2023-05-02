const Thread = require("../models/thread");
const Message = require("../models/message");
const User = require("../models/user");
const Notification = require("../models/notification");

exports.index = async (req, res, next) => {
  try {
    const threads = await Thread.find({ users: req.user.user_id }).populate(
      "users",
      "username first_name last_name avatar"
    );
    res.send(threads);
  } catch (e) {
    next(e);
  }
};

exports.show = async (req, res, next) => {
  try {
    const thread = await Thread.find({
      $and: [{ users: req.user.user_id }, { users: req.params.id }],
    }).populate("users", "_id username first_name last_name avatar");
    if (thread) {
      let [messages, count] = await Promise.all([
        Message.find({ thread_id: thread })
          .sort({ date: -1 })
          .skip(req.query.cursor)
          .limit(10)
          .populate("sender"),
        Message.find({ thread_id: thread }).count(),
      ]);
      messages.reverse();
      res.json({
        thread,
        messages,
        count,
        cursor: Number(req.query.cursor) + 10,
      });
    } else {
      res.json(thread);
    }
  } catch (e) {
    next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    let [thread] = await Thread.find({
      $and: [{ users: req.user.user_id }, { users: req.body.to_id }],
    }).populate("users", "_id username first_name last_name avatar");
    if (!thread) {
      thread = await Thread.create({
        users: [req.body.to_id, req.user.user_id],
      });
      await thread.save();
      let message = await Message.create({
        thread_id: thread._id,
        message: req.body.message,
        sender: req.user.user_id,
      });
      res.json({ thread, message });
    } else {
      const [_created, message, notification, notifiee] = await Promise.all([
        await Message.create({
          thread_id: thread._id,
          message: req.body.message,
          sender: req.user.user_id,
        }),
        await Message.find({ thread_id: thread._id }).populate(
          "sender",
          "username first_name last_name avatar"
        ),
        await Notification.create({
          requester: req.user.user_id,
          receiver: req.body.to_id,
          type: "Message",
          data: {
            thread_id: thread._id,
            message: req.body.message,
            sender: req.user.user_id,
          },
          msg: `${req.user.username} message: ${req.body.message}`,
        }),
        await User.findById(req.body.to_id),
      ]);
      message.push(_created);
      notifiee.notifications.push(notification);
      notifiee.save();
      res.json({ thread, message });
    }
  } catch (e) {
    next(e);
  }
};

exports.delete = (req, res, next) => {
  res.send("delete message");
};
