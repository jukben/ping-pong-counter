import HID from "node-hid";
import { EventEmitter } from "events";

function createControllers() {
  const controllersEmitter = new EventEmitter();

  const hamaDevices = [
    ...new Set(
      ...[
        HID.devices()
          .filter((device) => device.product?.includes("hama"))
          .map((device) => device.path),
      ]
    ),
  ];

  if (hamaDevices.length < 2) {
    throw new Error("Not enough controllers connected");
  }

  hamaDevices.forEach((device) => {
    const hid = new HID.HID(device);
    let bufferCount = 0;
    hid.on("data", (data) => {
      bufferCount++;
      if (bufferCount === 2) {
        bufferCount = 0;
        controllersEmitter.emit("keyPressed", device);
      }
    });
  });

  return { controllers: controllersEmitter, devices: hamaDevices };
}

export default createControllers();
