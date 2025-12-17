# @ludovicm67/scheduler

## 0.2.1

### Patch Changes

- a373998: Upgrade some dependencies
- a373998: Improve documentation

## 0.2.0

### Minor Changes

- 4af85b9: This updates the way jobs are handled.
  This change may break any Windows compatibility.
  Jobs are started as a new process group, and when they are killed, the whole process group is terminated as well, and not only the initial process.

### Patch Changes

- 0dad0d2: Mark `processes`, `tasks` and `schedules` fields from configuration file as optional.

## 0.1.3

### Patch Changes

- 4da9ffd: Make configuration path configurable
