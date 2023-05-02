const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const notification = require("./notification");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, lowercase: true },
  password: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  friend_requests: [{ type: ObjectId, ref: "FriendRequest" }],
  notifications: [{ type: ObjectId, ref: "Notification" }],
  avatar: { public_id: { type: String }, url: { type: String } },
});

module.exports = mongoose.model("User", UserSchema);
