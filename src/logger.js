import pino from "pino";
import pinoPretty from "pino-pretty";

export const logger = pino({
  level: "debug",
  transport: {
    target: "pino-pretty",
  },
});
