import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import ts from "typescript";

test("generated API types preserve required fields, nullability, unions and exclusive credit references", () => {
  const fixture = fileURLToPath(new URL("./types/api-contract.ts", import.meta.url));
  const program = ts.createProgram([fixture], {
    noEmit: true,
    strict: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2023,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    types: [],
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (name) => name,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => "\n",
  }));
});
