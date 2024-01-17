import HID from "node-hid";
import { logger } from "../logger.js";

const CONTROLLERS_BRAND = "hama";

async function getHamaDevices() {
  const devices = await HID.devicesAsync();

  console.log(devices);
  return [
    ...new Set(
      ...[
        devices
          .filter((device) => device.product?.includes(CONTROLLERS_BRAND))
          .map((device) => device.path),
      ]
    ),
  ];
}

export async function createHamaDevices(
  controllersEmitter,
  hidDriver = "hidraw"
) {
  logger.info(`waiting for Hama controllers (driver: ${hidDriver})`);

  HID.setDriverType(hidDriver);
  HID.setNonBlocking(true);

  const hamaDevices = await getHamaDevices();

  hamaDevices.forEach(async (device) => {
    const hid = await HID.HIDAsync.open(device);

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

      hid.close();
      controllersEmitter.emit("controllerDisconnected", device);

      bufferCounter = 0;
    });
  });
}
