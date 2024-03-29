import HID from "node-hid";
import { createLogger } from "../logger.js";

const CONTROLLERS_BRAND = "hama";

const logger = createLogger({ tag: "hama-driver" });
const openHamaDevices = new Set();

async function getHamaDevices() {
  const devices = await HID.devicesAsync();

  const hamaDevices = devices.filter((device) =>
    device.product?.includes(CONTROLLERS_BRAND)
  );

  logger.info({ hamaDevices }, "found devices (duplicates yet not removed)");

  return [...new Set(...[hamaDevices.map((device) => device.path)])];
}

export async function createHamaDevices(
  controllersEmitter,
  hidDriver = "hidraw"
) {
  logger.info(`waiting for Hama controllers (driver: ${hidDriver})`);

  HID.setDriverType(hidDriver);
  // HID.setNonBlocking(true);

  const hamaDevices = (await getHamaDevices()).filter(
    (device) => !openHamaDevices.has(device)
  );

  hamaDevices.forEach(async (device) => {
    const hid = await HID.HIDAsync.open(device);
    openHamaDevices.add(device);
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

      openHamaDevices.delete(device);
      hid.close();
      controllersEmitter.emit("controllerDisconnected", device);

      bufferCounter = 0;
    });
  });
}
