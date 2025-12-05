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

## License

Simple Whiteboard is licensed under the [Apache-2.0 license](./LICENSE).
