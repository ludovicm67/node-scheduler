# Node scheduler

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
