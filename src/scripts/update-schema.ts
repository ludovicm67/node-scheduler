#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { logger } from "../lib/logger.ts";
import { generateJsonSchema } from "../lib/schema.ts";

logger.debug("Generating JSON schema...");

const schema = generateJsonSchema();

// Write the schema to a JSON file relative to this file
const currentDir = new URL(".", import.meta.url);
const outputPath = join(currentDir.pathname, "..", "schema.json");
logger.info(`Writing schema to ${outputPath}...`);

await writeFile(outputPath, JSON.stringify(schema, null, 2));
logger.trace("Schema generation complete.");
