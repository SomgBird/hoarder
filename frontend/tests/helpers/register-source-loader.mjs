import { existsSync, readFileSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

// Load the real TSX components in Node with the same source aliases as Vite.
const source = new URL("../../src/", import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    const alias = /^@(types|services|components|pages|config)(?:\/(.*))?$/.exec(specifier);
    let candidate;
    if (specifier.startsWith("@/")) candidate = new URL(specifier.slice(2), source);
    else if (alias) candidate = new URL(`${alias[1]}/${alias[2] ?? "index"}`, source);
    else if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
      candidate = new URL(specifier, context.parentURL);
    }
    if (candidate) {
      const path = fileURLToPath(candidate);
      for (const file of [path, `${path}.ts`, `${path}.tsx`, `${path}.js`, `${path}/index.ts`, `${path}/index.tsx`, `${path}/index.js`]) {
        if (existsSync(file) && statSync(file).isFile()) return { url: pathToFileURL(file).href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith(source.href) && url.endsWith(".png")) return {
      format: "module", shortCircuit: true, source: `export default ${JSON.stringify(url)};`,
    };
    if (url.endsWith(".css")) return {
      format: "module", shortCircuit: true,
      source: "export default new Proxy({}, { get: (_, key) => String(key) });",
    };
    if (url.startsWith(source.href) && /\.tsx?$/.test(url)) return {
      format: "module", shortCircuit: true,
      source: ts.transpileModule(readFileSync(new URL(url), "utf8"), {
        compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
      }).outputText,
    };
    return nextLoad(url, context);
  },
});
