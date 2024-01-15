import HID from "node-hid";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import open from "open";

import { createGame } from "./game.js";

const app = express();

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5000", "http://localhost:8080"],
  },
});

io.on("connection", (socket) => {
  const { game, state } = createGame();

  socket.emit("state", state);

  game.on("state", (state) => {
    socket.emit("state", state);
  });

  console.log("WebSocket connection established");

  socket.on("disconnect", () => {
    console.log("WebSocket connection closed");
    game.emit("cancel");
  });
});

httpServer.listen(3000, '0.0.0.0', () => {
  console.log("WebSocket server started on port 3000");
});

// add middleware to serve public files
app.use(express.static("public"));

app.listen(5000, '0.0.0.0', async () => {
  console.log("server started on port 5000");
});
