# Node scheduler

[![NPM](https://badge.fury.io/js/@ludovicm67%2Fscheduler.svg)](https://npm.im/@ludovicm67/scheduler)

> A simple Node.js based tasks and services scheduler.

## Concepts

### Process

A process is something that runs continuously.
It is started when the scheduler starts and kept running.
If it crashes, it is restarted by default.

### Task

A task is something that runs once and then stops.
It should be started manually when needed using a HTTP request or through a schedule.

### Schedule

A schedule is a way to run tasks automatically at specific times or intervals, without manual intervention.
Schedules are defined using cron syntax.

## Quick Start

```sh
npx @ludovicm67/scheduler -c ./path/to/scheduler-config.yaml
```

Where `-c` is the path to your configuration file.
If not provided, it defaults to `./scheduler-config.yaml` or to the value of the `SCHEDULER_CONFIG_PATH` environment variable if it is defined.

The configuration file is a YAML file that defines the processes, tasks, and schedules to be managed by the scheduler.

An example of configuration file is available here: [scheduler-config.yaml](./scheduler-config.yaml).

You can control the log level using the `LOG_LEVEL` environment variable.
It defaults to `info`, but you can set it to `debug`, `warn`, `error`, etc. depending on your needs, or `silent` to disable them.

## Configuration File Structure

The configuration file is a YAML object with three main sections: `processes`, `tasks`, and `schedules`. Each section is an object whose keys are unique names, and values are configuration objects.

### Top-Level Keys

| Key       | Description                         | Type   | Required |
| --------- | ----------------------------------- | ------ | -------- |
| processes | Processes to run continuously       | object | No       |
| tasks     | One-off tasks to run                | object | No       |
| schedules | Scheduled tasks (using cron syntax) | object | No       |

---

### 1. `processes` and `tasks` Structure

Both `processes` and `tasks` have similar structure. Each key is a unique name, and the value is an object with these properties:

| Property | Description                                                              | Type    | Required | Default  |
| -------- | ------------------------------------------------------------------------ | ------- | -------- | -------- |
| cmd      | The command to execute                                                   | string  | Yes      |          |
| args     | Arguments to pass to the command                                         | array   | No       | `[]`     |
| restart  | Restart if exits (`processes`: default `true`, `tasks`: default `false`) | boolean | No       | see left |
| unique   | Only one instance can run at a time                                      | boolean | No       | `true`   |
| logs     | Log file paths (see below)                                               | object  | Yes      |          |

#### `logs` object (required):

| Property | Description                      | Type   | Required |
| -------- | -------------------------------- | ------ | -------- |
| stdout   | Path to standard output log file | string | Yes      |
| stderr   | Path to standard error log file  | string | Yes      |

---

### 2. `schedules` Structure

Each key is a unique name, and the value is an object:

| Property | Description                    | Type   | Required |
| -------- | ------------------------------ | ------ | -------- |
| cron     | Cron expression for scheduling | string | Yes      |
| task     | Name of the task to run        | string | Yes      |

---

### Example

```yaml
processes:
  my-process:
    cmd: "node"
    args: ["server.js"]
    restart: true
    unique: true
    logs:
      stdout: "/var/log/my-process.out"
      stderr: "/var/log/my-process.err"

tasks:
  my-task:
    cmd: "npm"
    args: ["run", "build"]
    restart: false
    unique: true
    logs:
      stdout: "/var/log/my-task.out"
      stderr: "/var/log/my-task.err"

schedules:
  nightly-build:
    cron: "0 2 * * *"
    task: "my-task"
```

**Notes:**

- All keys under `processes`, `tasks`, and `schedules` must be unique.
- No additional properties are allowed outside the defined structure.

## License

Node scheduler is licensed under the [Apache-2.0 license](./LICENSE).
