#!/bin/bash

set -euo pipefail

echo "$(date) - Start of scheduled_task.sh"

# Kill the process called "process"
curl -X POST http://localhost:3000/kill/process/process

echo "$(date) - End of scheduled_task.sh"
