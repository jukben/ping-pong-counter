import { EventEmitter } from "events";
import { getConnectedControllers } from "./controllers.js";
import { get } from "http";
import { logger } from "./logger.js";
import { log } from "console";

// const PLAYER = ["player1", "player2"];

function createState() {
  return {
    score: [0, 0],
    serving: 0,
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

  function changeServing() {
    logger.debug(`checking serving change for ${state.ballNumber}`);
    // change serving using bitwise XOR
    state.serving ^= 1;
    logger.debug(`serving changed to ${state.serving}`);
    gameEmitter.emit(
      "servingChange",
      state.serving === 0 ? "player1" : "player2"
    );
  }

  function checkGame() {
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

  function singlePressAction(player) {
    state.score[player]++;
    state.ballNumber++;

    // in case of deuce, change serving every time
    if (state.score[0] >= 10 && state.score[1] >= 10) {
      changeServing();
    } else if (state.ballNumber % 2 === 0) {
      changeServing();
    }

    state.events.push({
      date: new Date(),
      type: "score",
      player,
      score: state.score[player],
      ballNumber: state.ballNumber,
    });
  }

  function doublePressAction(player) {
    if (state.score[player] <= 0) {
      return;
    }

    if (state.ballNumber % 2 === 0 && state.ballNumber - (1 % 2) !== 0) {
      changeServing();
    }

    state.score[player]--;
    state.ballNumber--;

    // remove the last score event for this player
    const indexToRemove = state.events.findIndex(
      (e) => e.type === "score" && e.player === player
    );
    if (indexToRemove === -1) {
      logger.error("score event not found");
    }
    state.events.splice(indexToRemove, 1);
  }

  function gameOverAction() {
    logger.warn("game is over - restarting!");
    gameEmitter.emit("gameRestart");
    gameEmitter.emit("gameRestart");

    gameEmitter.emit("gameRestart");

    state = createState();
  }

  const clicksCounter = [0, 0];
  let timeoutRefs = [null, null];

  controllers.on("keyPressed", (device) => {
    if (state.gameOver) {
      gameOverAction();
      checkGame();
      return;
    }

    const player = players.findIndex((d) => d === device);
    if (player === -1) {
      logger.error("player not found");
    }

    clicksCounter[player]++;

    // naively schedule action to recognize double press
    if (timeoutRefs[player]) {
      clearTimeout(timeoutRefs[player]);
    }

    timeoutRefs[player] = setTimeout(() => {
      if (state.gameOver) {
        // doesn't matter now :)
        return;
      }

      if (clicksCounter[player] === 2) {
        logger.debug(`DOUBLE press action for ${player}`);
        doublePressAction(player);
      } else if (clicksCounter[player] === 1) {
        logger.debug(`single press action for ${player}`);
        singlePressAction(player);
      }

      clicksCounter[player] = 0;
      checkGame();
    }, 500);
  });

  gameEmitter.on("cancel", () => {
    controllers.removeAllListeners();
  });

  return { game: gameEmitter, state: getState() };
}
