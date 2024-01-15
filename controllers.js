import HID from "node-hid";
import { EventEmitter } from "events";
import { logger } from "./logger.js";
import { createEmulatedDevices } from "./emulated-driver.js";
import { createHamaDevices } from "./hama-driver.js";

let connectedControllers = new Set();

export function createControllers(dev = false) {
  const controllersEmitter = new EventEmitter();

  controllersEmitter.on("controllerConnected", (device) => {
    logger.debug("controller connected", device);
    connectedControllers.add(device);
  });

  controllersEmitter.on("controllerDisconnected", (device) => {
    logger.debug("controller disconnected", device);

    connectedControllers.remove(device);
  });

  if (dev) {
    logger.warn("creating emulated controllers (q to quit)");
    createEmulatedDevices(controllersEmitter);
  } else {
    setInterval(() => {
      if (connectedControllers.size < 2) {
        logger.info("waiting for Hama controllers");
        createHamaDevices();
      }
    }, 1000);
  }

  return { controllers: controllersEmitter };
}

export function getConnectedControllers() {
  return [...connectedControllers];
}
