const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  requester: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
    required: true,
  },
  receiver: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
    required: true,
  },
  date: { type: Date, default: Date.now() },
  status: { type: String, enum: ["read", "unread"], default: "unread" },
  type: {
    type: String,
    enum: ["Friend Request", "Like", "Comment", "Message"],
  },
  msg: String,
});

module.exports = mongoose.model("Notification", NotificationSchema);
