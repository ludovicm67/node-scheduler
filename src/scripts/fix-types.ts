#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const walk = (dir: string, callback: Function) => {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, callback);
    else callback(full);
  }
};

const distDir = path.resolve("dist");

walk(distDir, (file: string) => {
  if (file.endsWith(".d.ts")) {
    let content = fs.readFileSync(file, "utf-8");
    // replace imports ending with .ts
    content = content.replace(/(\.\/[\w\/-]+)\.ts(["';])/g, "$1.js$2");
    fs.writeFileSync(file, content);
  }
});

console.log("✅ Fixed .d.ts imports");
