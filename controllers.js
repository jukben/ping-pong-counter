import HID from "node-hid";
import { EventEmitter } from "events";

let connectedControllers = [];
const controllersEmitter = new EventEmitter();
const bufferCounter = {};

const CONTROLLERS_BRAND = "hama";

// Maybe we should reach for controllers asynchronously?
function watchForControllers() {
  if (connectedControllers.length === 2) {
    return;
  }

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
    if (!connectedControllers.includes(device)) {
      connectedControllers.push(device);
      controllersEmitter.emit("controllerConnected", device);

      const hid = new HID.HID(device);
      hid.on("data", (data) => {
        bufferCounter[device] = bufferCounter[device] + 1 || 1;
        if (bufferCounter[device] === 2) {
          bufferCounter[device] = 0;

          console.log("controller pressed", device);
          controllersEmitter.emit("keyPressed", device);
        }
      });

      hid.on("error", (error) => {
        connectedControllers = connectedControllers.filter(
          (controller) => controller !== device
        );
        bufferCounter[device] = 0;

        console.log("controller error", error);

        controllersEmitter.emit("controllerDisconnected", device);
      });
    }
  });
}

export function createControllers() {
  setInterval(() => {
    watchForControllers();
  }, 1000);

  return { controllers: controllersEmitter };
}

export function getConnectedControllers() {
  return connectedControllers;
}
