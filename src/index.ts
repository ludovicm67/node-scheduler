#!/usr/bin/env node

import express from "express";
import cron from "node-cron";
import { Command } from "commander";
import { logger } from "./lib/logger.ts";
import { loadConfig } from "./lib/config.ts";
import { killJob, startProcess, startTask } from "./lib/process.ts";

const DEFAULT_CONFIG_PATH =
  process.env.SCHEDULER_CONFIG_PATH || "./scheduler-config.yaml";

const program = new Command();
program
  .option(
    "-c, --config <path>",
    "Path to the configuration YAML file",
    DEFAULT_CONFIG_PATH
  )
  .parse(process.argv);

const options = program.opts();
const configPath = options.config as string;

logger.debug(`Loading configuration from: ${configPath}`);

const config = await loadConfig(configPath);
const { processes, tasks, schedules } = config;

// Configure server
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (_req, res) => {
  res.send("Process Manager is running.");
});

app.get("/healthz", (_req, res) => {
  res.status(200).type("text/plain").send("OK");
});

app.post("/trigger/:taskName", (req, res) => {
  const { taskName } = req.params;
  const task = tasks[taskName];
  if (!task) {
    logger.error(`Task '${taskName}' not found (from HTTP trigger).`);
    res.status(404).json({ error: `Task '${taskName}' not found.` });
    return;
  }

  logger.info(`Manually triggering task: ${taskName}`);
  startTask(taskName, task);
  res.status(200).json({ message: `Task '${taskName}' triggered.` });
});

app.post("/kill/:type/:processName", (req, res) => {
  const { type, processName } = req.params;
  killJob(type as "process" | "task", processName);
  res
    .status(200)
    .json({ message: `Killed all instances of ${type} '${processName}'.` });
});

app.listen(PORT, () => {
  logger.info(`Server is listening on port ${PORT}`);
});

// Start all defined processes
for (const [name, process] of Object.entries(processes)) {
  logger.info(`Starting process: ${name}`);
  startProcess(name, process);
}

// Schedule tasks based on cron expressions
for (const [scheduleName, schedule] of Object.entries(schedules)) {
  const { task: taskName, cron: cronExpr } = schedule;
  const task = tasks[taskName];
  if (!task) {
    logger.error(
      `Task '${taskName}' not found for scheduling (from '${scheduleName}' schedule).`
    );
    continue;
  }

  logger.info(
    `Scheduling task '${taskName}' with cron expression '${cronExpr}' (from '${scheduleName}' schedule)`
  );
  cron.schedule(cronExpr, () => {
    logger.info(
      `Executing scheduled task: ${taskName} (from schedule '${scheduleName}')`
    );
    startTask(taskName, task);
  });
}
