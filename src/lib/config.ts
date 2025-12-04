import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { validateConfig } from "./schema.ts";
import type { Config } from "./schema.ts";
import { logger } from "./logger.ts";

/**
 * Fetch and validate the configuration from the YAML file.
 *
 * @param path - The path to the configuration YAML file.
 * @returns The validated configuration object.
 */
export const loadConfig = async (path: string): Promise<Config> => {
  const fileContents = await readFile(path, "utf8");
  const parsedContent = parse(fileContents);
  const config = validateConfig(parsedContent);
  logger.debug(`Loaded configuration: ${JSON.stringify(config, null, 2)}`);
  return config;
};
