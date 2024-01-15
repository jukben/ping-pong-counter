import HID from "node-hid";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import meow from "meow";

import { createGame } from "./game.js";
import { createControllers } from "./controllers.js";
import { logger } from "./logger.js";

const WS_PORT = 3000;
const APP_PORT = 5000;

const cli = meow(
  `
	Ping Pong Counter 

	Options
	  --dev, -d  Run in development mode
`,
  {
    importMeta: import.meta,
    flags: {
      dev: {
        type: "boolean",
        shortFlag: "d",
      },
    },
  }
);

function start(cli) {
  const app = express();

  const httpServer = createServer();

  const io = new Server(httpServer, {
    cors: {
      origin: [`http://localhost:${APP_PORT}`, `http://127.0.0.1:${APP_PORT}`],
    },
  });

  const { controllers } = createControllers(cli.flags.dev);

  const controller = io.on("connection", (socket) => {
    logger.info("websocket connection established");

    const { game, state } = createGame(controllers);

    socket.emit("state", state);

    game.on("state", socket.emit.bind(socket, "state"));
    game.on("servingChange", socket.emit.bind(socket, "servingChange"));
    game.on("gameRestart", socket.emit.bind(socket, "gameRestart"));

    socket.on("disconnect", () => {
      logger.warn("websocket connection closed");

      game.emit("cancel");
    });
  });

  httpServer.listen(WS_PORT, "0.0.0.0", () => {
    logger.info(`webSocket server started on port ${WS_PORT}`);
  });

  // add middleware to serve public files
  app.use("/", express.static("./public"));

  app.listen(APP_PORT, "0.0.0.0", async () => {
    logger.info(`app started on port ${APP_PORT}`);
  });
}

start(cli);
