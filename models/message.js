const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  thread_id: {
    type: ObjectId,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  sender: {
    type: ObjectId,
    ref: "User",
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Message", MessageSchema);
