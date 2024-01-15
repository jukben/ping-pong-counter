import { EventEmitter } from "events";
import { getConnectedControllers } from "./controllers.js";
import { get } from "http";
import { logger } from "./logger.js";

export function createGame(controllers) {
  const gameEmitter = new EventEmitter();

  let players = getConnectedControllers();
  const score = {
    0: 0,
    1: 0,
  };
  // randomize serving
  let serving = Math.floor(Math.random() * 2) === 0;
  let ballNumber = 0;
  let gameOver = false;
  let gamePaused = false;
  const events = [];

  controllers.on("controllerConnected", (device) => {
    logger.debug("players changed");
    players = getConnectedControllers();
  });

  controllers.on("controllerDisconnected", (device) => {
    logger.debug("players changed");
    players = getConnectedControllers();
  });

  function getState() {
    return {
      player1: score[0],
      player2: score[1],
      serving: serving === 0 ? "player1" : "player2",
      winner: score[0] > score[1] ? "player1" : "player2",
      gameOver,
      gamePaused: players.length < 2,
      events: events.map((event) => ({
        type: event.type,
        player: event.player === 0 ? "player1" : "player2",
      })),
    };
  }

  function checkGame() {
    if (ballNumber % 2 === 0) {
      // change serving using bitwise XOR
      serving ^= 1;
      gameEmitter.emit("servingChange", serving === 0 ? "player1" : "player2");
    }

    if (
      Math.max(score[0], score[1]) >= 11 &&
      Math.abs(score[0] - score[1]) >= 2
    ) {
      gameOver = true;
    }

    gameEmitter.emit("state", getState());
  }

  controllers.on("keyPressed", (device) => {
    if (gameOver) {
      logger.warn("game is over");
      return;
    }

    const player = players.findIndex((d) => d === device);

    if (player === -1) {
      logger.error("player not found");
    }

    score[player]++;
    ballNumber++;

    events.push({
      date: new Date(),
      type: "score",
      player,
      score: score[player],
      ballNumber,
    });

    checkGame();
  });

  gameEmitter.on("cancel", () => {});

  return { game: gameEmitter, state: getState() };
}
