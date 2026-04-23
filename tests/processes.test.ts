import { describe, it, after } from "node:test";
import assert from "node:assert";
import { writeFileSync, unlinkSync, readFileSync, existsSync } from "node:fs";
import { loadConfig } from "../src/lib/config.ts";
import { startProcess, startTask, killJob } from "../src/lib/process.ts";
import { spawn } from "node:child_process";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Process and Task execution", () => {
  const stdoutFile = "./test-stdout.log";
  const stderrFile = "./test-stderr.log";
  const configPath = "./demo-config.yaml";

  const cleanFiles = () => {
    [stdoutFile, stderrFile, configPath].forEach((file) => {
      if (existsSync(file)) {
        unlinkSync(file);
      }
    });
  };

  after(() => {
    cleanFiles();
  });

  it("should capture stdout and stderr for processes and tasks in the specified log files", async () => {
    cleanFiles();

    // Create a demo config file.
    // processA outputs to stdout
    // processB waits a bit and outputs to stderr
    // taskC outputs to both stdout and stderr
    writeFileSync(configPath, `
processes:
  processA:
    cmd: "sh"
    args: ["-c", "echo 'processA-stdout'"]
    restart: false
    logs:
      stdout: "${stdoutFile}"
      stderr: "${stderrFile}"
  processB:
    cmd: "sh"
    args: ["-c", "sleep 0.2 && echo 'processB-stderr' >&2"]
    restart: false
    logs:
      stdout: "${stdoutFile}"
      stderr: "${stderrFile}"
tasks:
  taskC:
    cmd: "sh"
    args: ["-c", "echo 'taskC-stdout' && echo 'taskC-stderr' >&2"]
    logs:
      stdout: "${stdoutFile}"
      stderr: "${stderrFile}"
`);
    
    const config = await loadConfig(configPath);
    
    // Start processes
    if (config.processes) {
      for (const [name, processDef] of Object.entries(config.processes)) {
        startProcess(name, processDef);
      }
    }

    // Wait for processes to finish executing and writing logs
    await sleep(500);

    // Read the log files after processes
    let stdoutContent = readFileSync(stdoutFile, "utf-8").trim().split("\n");
    let stderrContent = readFileSync(stderrFile, "utf-8").trim().split("\n");
    
    assert.deepStrictEqual(stdoutContent, ["processA-stdout"]);
    assert.deepStrictEqual(stderrContent, ["processB-stderr"]);

    // Now trigger the task
    if (config.tasks && config.tasks.taskC) {
      startTask("taskC", config.tasks.taskC);
    }

    // Wait for task to finish executing
    await sleep(500);

    // Read the log files again
    stdoutContent = readFileSync(stdoutFile, "utf-8").trim().split("\n");
    stderrContent = readFileSync(stderrFile, "utf-8").trim().split("\n");

    assert.deepStrictEqual(stdoutContent, ["processA-stdout", "taskC-stdout"]);
    assert.deepStrictEqual(stderrContent, ["processB-stderr", "taskC-stderr"]);

    // Clean up jobs if they are still somehow running
    killJob("process", "processA");
    killJob("process", "processB");
    killJob("task", "taskC");
  });

  it("should capture stdout and stderr for processes and tasks via CLI invocation", async () => {
    cleanFiles();

    // Re-create the same config
    writeFileSync(configPath, `
processes:
  processA:
    cmd: "sh"
    args: ["-c", "echo 'processA-stdout'"]
    restart: false
    logs:
      stdout: "${stdoutFile}"
      stderr: "${stderrFile}"
  processB:
    cmd: "sh"
    args: ["-c", "sleep 0.2 && echo 'processB-stderr' >&2"]
    restart: false
    logs:
      stdout: "${stdoutFile}"
      stderr: "${stderrFile}"
tasks:
  taskC:
    cmd: "sh"
    args: ["-c", "echo 'taskC-stdout' && echo 'taskC-stderr' >&2"]
    logs:
      stdout: "${stdoutFile}"
      stderr: "${stderrFile}"
`);

    const port = 3055;
    
    // Spawn the scheduler program directly
    const schedulerProcess = spawn("node", [
      "--experimental-strip-types",
      "src/index.ts",
      "-c",
      configPath
    ], {
      env: { ...process.env, PORT: port.toString() }
    });

    try {
      // Wait for processes to run and the server to start
      await sleep(1000);

      // Read the log files after processes
      let stdoutContent = readFileSync(stdoutFile, "utf-8").trim().split("\n");
      let stderrContent = readFileSync(stderrFile, "utf-8").trim().split("\n");
      
      assert.deepStrictEqual(stdoutContent, ["processA-stdout"]);
      assert.deepStrictEqual(stderrContent, ["processB-stderr"]);

      // Trigger the task via the HTTP API
      const res = await fetch(`http://localhost:${port}/trigger/taskC`, {
        method: "POST"
      });
      assert.strictEqual(res.status, 200);

      // Wait for task to finish executing
      await sleep(500);

      // Read the log files again
      stdoutContent = readFileSync(stdoutFile, "utf-8").trim().split("\n");
      stderrContent = readFileSync(stderrFile, "utf-8").trim().split("\n");

      assert.deepStrictEqual(stdoutContent, ["processA-stdout", "taskC-stdout"]);
      assert.deepStrictEqual(stderrContent, ["processB-stderr", "taskC-stderr"]);
    } finally {
      // Always ensure the process is killed at the end of the test
      schedulerProcess.kill();
    }
  });
});
