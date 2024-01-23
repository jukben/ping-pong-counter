import HID from "node-hid";
import { EventEmitter } from "events";
import { logger } from "./logger.js";
import { createEmulatedDevices } from "./drivers/emulated-driver.js";
import { createHamaDevices } from "./drivers/hama-driver.js";

let connectedControllers = new Set();

export function createControllers(dev = false, hidDriver = "hidraw") {
  const controllersEmitter = new EventEmitter();

  controllersEmitter.on("controllerConnected", (device) => {
    logger.debug(`controller (${device}) connected`);

    connectedControllers.add(device);
  });

  controllersEmitter.on("controllerDisconnected", (device) => {
    logger.debug(`controller (${device}) disconnected`);

    connectedControllers.delete(device);
  });

  if (dev) {
    createEmulatedDevices(controllersEmitter);
  } else {
    setInterval(() => {
      if (connectedControllers.size < 2) {
        createHamaDevices(controllersEmitter, hidDriver);
      }
    }, 1000);
  }

  return { controllers: controllersEmitter };
}

export function getConnectedControllers() {
  return [...connectedControllers];
}
