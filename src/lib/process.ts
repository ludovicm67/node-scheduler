import { spawn } from "node:child_process";
import type { ChildProcessByStdio } from "node:child_process";
import type Stream from "node:stream";
import { createWriteStream } from "node:fs";
import { v7 as uuidv7 } from "uuid";
import { logger } from "./logger.ts";
import type { BaseJob, Process, Task } from "./schema.ts";

type ProcessInstance = ChildProcessByStdio<
  null,
  Stream.Readable,
  Stream.Readable
>;
type JobKind = "process" | "task";

type JobProcess = {
  id: string;
  process: ProcessInstance;
};

const jobRegistry = new Map<string, JobProcess[]>();

/**
 * Creates a new child process for the given command and arguments.
 *
 * @param cmd - The command to execute.
 * @param args - Arguments to pass to the command.
 * @returns The spawned child process.
 */
const createProcess = (cmd: string, args: string[] = []) => {
  logger.debug(`Spawning process: ${cmd} ${args.join(" ")}`);
  return spawn(cmd, args, {
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });
};

/**
 * Generates a unique key for a job based on its kind and name.
 *
 * @param kind - The kind of job.
 * @param name - The name of the job.
 * @returns A unique string key representing the job.
 */
const jobRegistryKey = (kind: JobKind, name: string) => {
  return `${kind}/${name}`;
};

/**
 * Kills the specified job(s) based on kind, name, and optional ID.
 *
 * @param kind - The kind of job.
 * @param name - The name of the job.
 * @param id - Optional ID of the specific job instance to kill.
 */
export const killJob = (kind: JobKind, name: string, id?: string) => {
  const key = jobRegistryKey(kind, name);
  const jobs = jobRegistry.get(key) || [];

  logger.debug(
    `Killing job(s) ${kind}/${name} ${id ? `(ID: ${id})` : "(all instances)"}`
  );

  const processesToKeep: JobProcess[] = [];
  const processesToKill: JobProcess[] = [];

  if (id !== undefined) {
    jobs.forEach((proc, i) => {
      if (proc.id === id) {
        processesToKill.push(proc);
      } else {
        processesToKeep.push(proc);
      }
    });
  } else {
    processesToKill.push(...jobs);
  }

  processesToKill.forEach((proc) => {
    const pid = proc.process?.pid;
    if (!pid) return;

    try {
      // Kill the entire process group
      process.kill(-pid, "SIGTERM");
      logger.debug(`Killed job ${kind}/${name} (ID: ${proc.id})`);
    } catch (err: any) {
      if (err.code !== "ESRCH") {
        logger.error(
          `Error killing job ${kind}/${name} (ID: ${proc.id}): ${err}`
        );
      } else {
        // ESRCH = process already exited
        logger.debug(
          `Job ${kind}/${name} (ID: ${proc.id}) already exited before kill`
        );
      }
    }
  });

  jobRegistry.set(key, processesToKeep);
};

/**
 * Starts a job (process or task) with the given name and configuration.
 *
 * @param kind - The kind of job (process or task).
 * @param name - The name of the job.
 * @param job - The job configuration.
 */
const startJob = (kind: JobKind, name: string, job: BaseJob) => {
  // If the job is marked as unique, kill any existing instances
  if (job.unique) {
    logger.debug(`Ensuring uniqueness for job ${kind}/${name}`);
    killJob(kind, name);
  }

  // Create write streams for logging
  const out = createWriteStream(job.logs.stdout, { flags: "a" });
  const err = createWriteStream(job.logs.stderr, { flags: "a" });

  // Start the process
  const key = jobRegistryKey(kind, name);
  const jobs = jobRegistry.get(key) || [];
  const proc = {
    id: uuidv7(),
    process: createProcess(job.cmd, job.args),
  };
  jobRegistry.set(key, [...jobs, proc]);
  logger.info(`Started job ${kind}/${name} (ID: ${proc.id})`);

  // Pipe stdout and stderr to log files
  proc.process.stdout?.pipe(out);
  proc.process.stderr?.pipe(err);

  // Handle process exit
  proc.process.on("exit", (code, signal) => {
    logger.info(
      `Job ${kind}/${name} (ID: ${proc.id}) exited with code ${code}, signal ${signal}`
    );

    // Remove the process from the registry
    killJob(kind, name, proc.id);

    // Restart the job if needed
    if (job.restart) {
      logger.info(`Restarting job ${kind}/${name}`);
      startJob(kind, name, job);
    }
  });
};

/**
 * Starts a process with the given name and configuration.
 *
 * @param name - The name of the process.
 * @param process - The process configuration.
 */
export const startProcess = (name: string, process: Process) => {
  startJob("process", name, process);
};

/**
 * Starts a task with the given name and configuration.
 *
 * @param name - The name of the task.
 * @param task - The task configuration.
 */
export const startTask = (name: string, task: Task) => {
  startJob("task", name, task);
};
