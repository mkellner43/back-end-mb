const mongoose = require("mongoose");

const LikeSchema = new mongoose.Schema({
  post_id: { type: mongoose.SchemaTypes.ObjectId, ref: "Post", required: true },
  user_id: { type: mongoose.SchemaTypes.ObjectId, ref: "User", required: true, unique: true },
});

module.exports = mongoose.model("Like", LikeSchema);
