import { EventEmitter } from "events";
import { getConnectedControllers } from "./controllers.js";
import { get } from "http";
import { logger } from "./logger.js";

function createState() {
  return {
    score: [0, 0],
    serving: "player1",
    gameOver: false,
    ballNumber: 0,
    events: [],
  };
}

export function createGame(controllers) {
  const gameEmitter = new EventEmitter();

  let players = getConnectedControllers();

  let state = createState();

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
      player1: state.score[0],
      player2: state.score[1],
      serving: state.serving === 0 ? "player1" : "player2",
      winner: state.score[0] > state.score[1] ? "player1" : "player2",
      gameOver: state.gameOver,
      gamePaused: players.length < 2,
      events: state.events.map((event) => ({
        type: event.type,
        player: event.player === 0 ? "player1" : "player2",
      })),
    };
  }

  function checkGame() {
    if (state.ballNumber % 2 === 0) {
      // change serving using bitwise XOR
      state.serving ^= 1;
      gameEmitter.emit(
        "servingChange",
        state.serving === 0 ? "player1" : "player2"
      );
    }

    if (
      Math.max(state.score[0], state.score[1]) >= 11 &&
      Math.abs(state.score[0] - state.score[1]) >= 2
    ) {
      state.gameOver = true;
      state.events.push({
        date: new Date(),
        type: "gameOver",
        player: state.score[0] > state.score[1] ? 0 : 1,
      });
    }

    gameEmitter.emit("state", getState());
  }

  controllers.on("keyPressed", (device) => {
    if (state.gameOver) {
      logger.warn("game is over - restarting!");

      gameEmitter.emit("gameRestart");

      state = createState();

      checkGame();

      return;
    }

    const player = players.findIndex((d) => d === device);

    if (player === -1) {
      logger.error("player not found");
    }

    state.score[player]++;
    state.ballNumber++;

    state.events.push({
      date: new Date(),
      type: "score",
      player,
      score: state.score[player],
      ballNumber: state.ballNumber,
    });

    checkGame();
  });

  gameEmitter.on("cancel", () => {
    controllers.removeAllListeners();
  });

  return { game: gameEmitter, state: getState() };
}
