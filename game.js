import { EventEmitter } from "events";
import { getConnectedControllers } from "./controllers.js";
import { get } from "http";

const gameEmitter = new EventEmitter();

export function createGame(controllers) {
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

  controllers.on("controllerConnected", (device) => {
    players = getConnectedControllers();
  });

  controllers.on("controllerDisconnected", (device) => {
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
      return;
    }

    const player = players.findIndex((d) => d === device);

    if (player === -1) {
      console.log("this shoudn't happen :)");
    }

    score[player]++;
    ballNumber++;

    checkGame();
  });

  gameEmitter.on("cancel", () => {
    // TODO
  });

  return { game: gameEmitter, state: getState() };
}
