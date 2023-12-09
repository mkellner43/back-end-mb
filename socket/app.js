const express = require("express")
const {createServer} = require('http')
const { Server } = require("socket.io")

const app = express();
const httpServer = createServer(app);
require("dotenv").config();

//should push users to a DB
let users = [];

//socket io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONT_END_URL,
    credentials: true,
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


httpServer.listen(process.env.PORT || 3000, () => {
  console.log(`listening on ${process.env.PORT || 3000}`);
});
