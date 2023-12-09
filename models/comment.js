const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  comment_body: { type: String, required: true },
  user: { type: mongoose.SchemaTypes.ObjectId, ref: "User", required: true },
  date: { type: Date, default: Date.now },
  post: { type: mongoose.SchemaTypes.ObjectId, ref: "Post", required: true },
});

module.exports = mongoose.model("Comment", CommentSchema);
