import HID from "node-hid";
import { logger } from "../logger.js";

const CONTROLLERS_BRAND = "hama";

export function createHamaDevices(controllersEmitter, hidDriver = "hidraw") {
  logger.info(`waiting for Hama controllers (driver: ${hidDriver})`);

  HID.setDriverType(hidDriver);

  // get all connected controllers with "hama" in the product name
  const hamaDevices = [
    ...new Set(
      ...[
        HID.devices()
          .filter((device) => device.product?.includes(CONTROLLERS_BRAND))
          .map((device) => device.path),
      ]
    ),
  ];

  hamaDevices.forEach((device) => {
    const hid = new HID.HID(device);
    controllersEmitter.emit("controllerConnected", device);

    let bufferCounter = 0;

    hid.on("data", (data) => {
      bufferCounter++;
      if (bufferCounter === 2) {
        logger.debug(`controller (${device}) pressed`);
        controllersEmitter.emit("keyPressed", device);

        bufferCounter = 0;
      }
    });

    hid.on("error", (error) => {
      logger.error(`controller (${device}) error`);

      controllersEmitter.emit("controllerDisconnected", device);

      bufferCounter = 0;
    });
  });
}
