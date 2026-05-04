import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildOpenApiSpec } from "../lib/swagger";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outPath = path.join(root, "public", "openapi.json");

mkdirSync(path.dirname(outPath), { recursive: true });
const spec = buildOpenApiSpec();
writeFileSync(outPath, JSON.stringify(spec, null, 2), "utf-8");
console.log("Wrote", outPath);
