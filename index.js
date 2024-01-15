import HID from "node-hid";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import open from "open";
import meow from "meow";

import { createGame } from "./game.js";
import { createControllers } from "./controllers.js";

const WS_PORT = 3000;
const APP_PORT = 5000;

const cli = meow(
  `
	Ping Pong Counter 

	Options
	  --rainbow, -r  Include a rainbow
`,
  {
    importMeta: import.meta,
    flags: {
      rainbow: {
        type: "boolean",
        shortFlag: "r",
      },
    },
  }
);

function start() {
  const app = express();

  const httpServer = createServer();

  const io = new Server(httpServer, {
    cors: {
      origin: [
        `http://localhost:${WS_PORT}`,
        `http://127.0.0.1:${WS_PORT}`,
        "http://localhost:8080",
      ],
    },
  });

  const { controllers } = createControllers();

  const controller = io.on("connection", (socket) => {
    const { game, state } = createGame(controllers);

    socket.emit("state", state);

    game.on("state", (state) => {
      socket.emit("state", state);
    });

    game.on("servingChange", socket.emit.bind(socket, "servingChange"));

    console.log("WebSocket connection established");

    socket.on("disconnect", () => {
      console.log("WebSocket connection closed");
      game.emit("cancel");
    });
  });

  httpServer.listen(WS_PORT, "0.0.0.0", () => {
    console.log(`WebSocket server started on port ${WS_PORT}`);
  });

  // add middleware to serve public files
  app.use("/", express.static("./public"));

  app.listen(APP_PORT, "0.0.0.0", async () => {
    console.log(`server started on port ${APP_PORT}`);
  });
}

start(cli);
