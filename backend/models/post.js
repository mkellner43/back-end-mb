const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    post_body: { type: String, required: true },
    user: { type: mongoose.SchemaTypes.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now },
    comments: [{ type: mongoose.SchemaTypes.ObjectId, ref: "Comment" }],
    likes: [{ type: mongoose.SchemaTypes.ObjectId, ref: "Like" }],
    image: { public_id: { type: String }, url: { type: String } },
  },
  { toJSON: { virtuals: true } }
);

PostSchema.virtual("url").get(function () {
  return `post/${this._id}`;
});

PostSchema.virtual("commentCount", {
  ref: "Comment",
  localField: "_id",
  foreignField: "post",
  count: true,
});

module.exports = mongoose.model("Post", PostSchema);
