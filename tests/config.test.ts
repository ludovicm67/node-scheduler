import { describe, it } from "node:test";
import assert from "node:assert";
import { loadConfig } from "../src/lib/config.ts";
import { writeFileSync, unlinkSync } from "node:fs";

describe("Config Validation", () => {
  it("should fail with an invalid config file", async () => {
    const invalidConfigPath = "./invalid-config.yaml";
    writeFileSync(invalidConfigPath, "invalid: \n  - yaml: [");
    
    await assert.rejects(
      async () => {
        await loadConfig(invalidConfigPath);
      }
    );

    unlinkSync(invalidConfigPath);
  });

  it("should fail with a schema-invalid config file", async () => {
    const invalidConfigPath = "./invalid-schema-config.yaml";
    // missing logs which is required
    writeFileSync(invalidConfigPath, `
processes:
  my-process:
    cmd: "echo 'hello'"
`);
    
    await assert.rejects(
      async () => {
        await loadConfig(invalidConfigPath);
      }
    );

    unlinkSync(invalidConfigPath);
  });

  it("should work with a valid config file", async () => {
    const validConfigPath = "./valid-config.yaml";
    writeFileSync(validConfigPath, `
processes:
  my-process:
    cmd: "echo"
    args: ["hello"]
    logs:
      stdout: "/dev/null"
      stderr: "/dev/null"
`);
    
    const config = await loadConfig(validConfigPath);
    assert.ok(config);
    assert.ok(config.processes);
    assert.strictEqual(config.processes["my-process"].cmd, "echo");
    
    unlinkSync(validConfigPath);
  });
});
