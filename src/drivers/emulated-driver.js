import readline from "readline";

export function createEmulatedDevices(controllersEmitter) {
  logger.warn("creating emulated controllers (q to quit)");

  readline.emitKeypressEvents(process.stdin);

  if (process.stdin.isTTY) process.stdin.setRawMode(true);

  controllersEmitter.emit("controllerConnected", "a");
  controllersEmitter.emit("controllerConnected", "s");

  process.stdin.on("keypress", (chunk, key) => {
    if (key && key.name == "a") controllersEmitter.emit("keyPressed", "a");
    if (key && key.name == "s") controllersEmitter.emit("keyPressed", "s");

    if (key && key.name == "q") process.exit();
  });
}
