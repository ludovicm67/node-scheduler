---
"@ludovicm67/scheduler": minor
---

This updates the way jobs are handled.
This change may break any Windows compatibility.
Jobs are started as a new process group, and when they are killed, the whole process group is terminated as well, and not only the initial process.
