import { EventEmitter } from "events";
import Controllers from "./controllers.js";

export function createGame() {
  const { controllers, devices } = Controllers;

  const gameEmitter = new EventEmitter();

  const [player1, player2] = devices;

  const score = {
    [player1]: 0,
    [player2]: 0,
  };

  // randomize serving
  let serving = Math.floor(Math.random() * 2);

  let ballNumber = 0;

  let gameOver = false;

  function getState() {
    return {
      player1: score[player1],
      player2: score[player2],
      serving: devices[serving] === player1 ? "player1" : "player2",
      winner: score[player1] > score[player2] ? "player1" : "player2",
      gameOver,
    };
  }

  function checkGame() {
    if (ballNumber % 2 === 0) {
      // change serving using bitwise XOR
      serving ^= 1;
    }

    if (
      Math.max(score[player1], score[player2]) >= 11 &&
      Math.abs(score[player1] - score[player2]) >= 2
    ) {
      gameOver = true;
    }

    gameEmitter.emit("state", getState());
  }

  controllers.on("keyPressed", (device) => {
    if (gameOver) {
      return;
    }

    score[device]++;
    ballNumber++;

    checkGame();
  });

  gameEmitter.on("cancel", () => {
    // TODO
  });

  return { game: gameEmitter, state: getState() };
}
