const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const ThreadSchema = new mongoose.Schema({
  users: [{ type: ObjectId, ref: "User", required: true }],
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Thread", ThreadSchema);
