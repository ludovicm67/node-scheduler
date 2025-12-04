import { defineConfig } from "vite";
import path from "node:path";
import { builtinModules } from "node:module";
import pkg from "./package.json" with { type: "json" };

const externalDeps = [
  ...builtinModules,
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

export default defineConfig({
  build: {
    target: "node18",
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      formats: ["es"],
    },
    rollupOptions: {
      external: (id) => externalDeps.some((dep) => id === dep || id.startsWith(dep + "/") || id.startsWith("node:")),
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        dir: "dist",
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
      },
    },
    emptyOutDir: false,
    sourcemap: false,
  },
  plugins: [
    {
      name: 'add-shebang',
      generateBundle (_, bundle) {
        for (const file of Object.values(bundle)) {
          if (file.type === 'chunk' && file.fileName === 'index.js') {
            file.code = '#!/usr/bin/env node\n' + file.code;
          }
        }
      }
    }
  ],
});
