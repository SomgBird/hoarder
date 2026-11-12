import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import openapiTS, { astToString } from "openapi-typescript";

const check = process.argv.includes("--check");
const backend = fileURLToPath(new URL("../../backend/", import.meta.url));
const output = new URL("../src/types/api.generated.ts", import.meta.url);
const python = process.env.PYTHON || "python3";

let schema;
try {
  schema = JSON.parse(execFileSync(python, ["export_openapi.py"], {
    cwd: backend,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    stdio: ["ignore", "pipe", "inherit"],
  }));
} catch (error) {
  console.error("Could not export the backend API schema. Install backend/requirements.txt in your active Python environment, or set PYTHON to its interpreter.");
  throw error;
}

const generated = [
  "/**",
  " * Generated from the backend OpenAPI schema. Do not edit manually.",
  " * Regenerate with: npm run generate:types",
  " */",
  astToString(await openapiTS(schema, {
    alphabetize: true,
    // Defaults make request fields optional; only the schema's required list
    // should make them required. FastAPI marks serialized response fields required.
    defaultNonNullable: false,
  })),
].join("\n");

if (check) {
  const current = await readFile(output, "utf8").catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (current !== generated) {
    console.error("API types are out of date. Run npm run generate:types and commit the result.");
    process.exitCode = 1;
  } else {
    console.log("API types are up to date.");
  }
} else {
  await writeFile(output, generated);
  console.log("Generated src/types/api.generated.ts from the backend API.");
}
