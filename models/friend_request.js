const Notification = require("./notification");
const User = require("./user");
const mongoose = require("mongoose");

const FriendRequestSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ["pending", "declined", "accepted", "blocked"],
    default: "pending",
  },
});

FriendRequestSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function () {
    await Notification.deleteOne({ "data._id": this._id });
  }
);

// FriendRequestSchema.pre('save', async function(next) {
//   const users = await User.find({_id: {$in: [this.requester, this.receiver]}})
//   users.forEach(async(user) => {
//     user.notifications.push(this)
//     await user.save()
//   })
//   console.log(users)
//   next()
// *** could potentially change notifications to unreferenced objects ***
// })

module.exports = mongoose.model("FriendRequest", FriendRequestSchema);
