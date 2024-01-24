import pino from "pino";
import pinoPretty from "pino-pretty";

export function createLogger({ tag }) {
  return pino({
    level: "debug",
    transport: {
      target: "pino-pretty",
    },
    msgPrefix: tag ? `[${tag}]: ` : undefined,
  });
}
