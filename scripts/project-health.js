import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const problems = [];
for (const file of ["README.md", "package.json", "electron/main.js", "electron/preload.cjs", "electron/chatSafety.js", ".github/workflows/ci.yml"]) {
  if (!existsSync(file)) problems.push(`missing ${file}`);
}

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
for (const script of ["test", "build:renderer"]) {
  if (!pkg.scripts?.[script]) problems.push(`missing npm script: ${script}`);
}

const tests = existsSync("test") ? readdirSync("test").filter((file) => file.endsWith(".test.js")) : [];
if (tests.length === 0) problems.push("missing chat safety tests");

for (const generated of ["dist", "release", "node_modules"]) {
  if (existsSync(generated) && statSync(generated).isDirectory()) {
    console.warn(`[health] local generated directory present: ${join(process.cwd(), generated)}`);
  }
}

if (problems.length) {
  console.error(problems.map((item) => `[health] ${item}`).join("\n"));
  process.exit(1);
}

console.log(`[health] ${pkg.name} repository checks passed`);
