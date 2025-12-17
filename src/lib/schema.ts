import { z } from "zod";

export const LogsSchema = z.object({
  stdout: z
    .string()
    .meta({ description: "Path to the standard output log file" }),
  stderr: z
    .string()
    .meta({ description: "Path to the standard error log file" }),
});

export const ItemNameSchema = z.string().min(1).meta({
  description: "A unique name for the item",
});

// Base fields shared by processes and tasks
export const BaseJobSchema = z.object({
  cmd: z.string().meta({ description: "The command to execute" }),

  args: z.optional(z.array(z.string()).default([])).meta({
    description: "Arguments to pass to the command",
  }),

  restart: z.optional(z.boolean().default(false)).meta({
    description: "Whether to restart the job if it exits",
  }),
  unique: z.optional(z.boolean().default(true)).meta({
    description: "Whether only one instance of the job can run at a time",
  }),

  logs: LogsSchema.meta({ description: "Log file paths for the job" }),
});

// A process runs continuously
export const ProcessSchema = BaseJobSchema.extend({
  restart: z.optional(z.boolean().default(true)).meta({
    description: "Whether to restart the process if it exits (default: true)",
  }),
});

// A task runs once and stops
export const TaskSchema = BaseJobSchema.extend({
  restart: z.optional(z.boolean().default(false)).meta({
    description: "Whether to restart the task if it exits (default: false)",
  }),
});

// Schedules refer to tasks by name
export const ScheduleSchema = z.object({
  cron: z.string().meta({ description: "Cron expression for scheduling" }),
  task: ItemNameSchema.meta({ description: "Name of the task to run" }),
});

// Top-level config
export const ConfigSchema = z.object({
  processes: z.optional(
    z.record(ItemNameSchema, ProcessSchema).meta({
      description: "Processes to run continuously",
    })
  ),
  tasks: z.optional(
    z.record(ItemNameSchema, TaskSchema).meta({
      description: "One-off tasks to run",
    })
  ),
  schedules: z.optional(
    z.record(ItemNameSchema, ScheduleSchema).meta({
      description: "Scheduled tasks",
    })
  ),
});

// Export types
export type Config = z.infer<typeof ConfigSchema>;
export type Process = z.infer<typeof ProcessSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Schedule = z.infer<typeof ScheduleSchema>;
export type Logs = z.infer<typeof LogsSchema>;
export type BaseJob = z.infer<typeof BaseJobSchema>;

/**
 * Generates the JSON schema for the configuration.
 *
 * @returns The JSON schema representation of the configuration.
 */
export const generateJsonSchema = () => {
  return z.toJSONSchema(ConfigSchema);
};

/**
 * Checks and validates the configuration object.
 * In case of invalid configuration, an error is thrown.
 *
 * @param config - Object containing the configuration to validate.
 * @returns The validated configuration.
 */
export const validateConfig = (config: unknown): Config => {
  return ConfigSchema.parse(config);
};
