const createError = require("http-errors");
const express = require("express");
require("dotenv").config();
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
let users = [];

//socket io
const io = require("socket.io")(process.env.SOCKET_PORT, {
  cors: {
    origin: process.env.FRONT_END_URL,
  },
});
io.on("connection", async (socket) => {
  socket.join(socket.handshake.auth.userID);
  socket.on("send message", ({ id, thread }) => {
    socket.to(id).emit("message received", thread);
  });
  socket.on("typing", (id) => {
    socket.to(id).emit("typing");
    setTimeout(() => {
      socket.to(id).emit("not typing");
    }, 1000 * 50);
  });
  socket.on("not typing", (id) => {
    socket.to(id).emit("not typing");
  });
  socket.on("notification", ({ to_id, type, msg }) => {
    socket.to(to_id).emit("notification", msg);
  });

  for (let [id, socket] of io.of("/").sockets) {
    users.push(socket.handshake.auth.userID);
  }
  users = users.filter((value, index, array) => array.indexOf(value) === index);

  io.emit("onlineFriends", users);

  socket.on("onlineFriends", () => {
    socket.emit(users);
  });

  socket.on("logOut", (id) => {
    users = users.filter((user) => user !== id);
    io.emit("onlineFriends", users);
  });

  socket.on("reconnect", () => {
    for (let [id, socket] of io.of("/").sockets) {
      users.push(socket.handshake.auth.userID);
    }
    users = users.filter(
      (value, index, array) => array.indexOf(value) === index
    );
    io.emit("onlineFriends", users);
  });

  socket.on("disconnecting", () => {
    users = users.filter((user) => user !== socket.handshake.auth.userID);
    io.emit("onlineFriends", users);
  });
});

const app = express();

app.use(cors({ origin: process.env.FRONT_END_URL, credentials: true }));
app.use(logger("dev"));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

app.listen(process.env.PORT || 3000, () => {
  console.log(`listening on ${process.env.PORT || 3000}`);
});

// figure out how to properly emit and collect online users when connected / disconnected from socket
// may need to set state rather than in cache
// already setOnlineFriends state in Nav store (: Give it a shot
