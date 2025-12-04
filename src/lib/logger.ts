import { pino } from "pino";

/**
 * Logger instance for the application.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});
