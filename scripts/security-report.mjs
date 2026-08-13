// Genera el informe final de seguridad a partir del JSON de Playwright
// (test-results/security-report.json, producido por playwright.security.config.ts).
// Uso: node scripts/security-report.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(root, "test-results", "security-report.json");

const LABELS = [
  { prefix: "01", label: "Login protegido" },
  { prefix: "02", label: "Panel admin bloqueado" },
  { prefix: "03", label: "Cookies seguras" },
  { prefix: "04", label: "Uploads blindados" },
  { prefix: "05", label: "API endurecida" },
  { prefix: "06", label: "XSS neutralizado" },
  { prefix: "07", label: "SQL Injection neutralizado" },
  { prefix: "08", label: "Headers de seguridad" },
  { prefix: "09", label: "Rate limiting activo" },
  { prefix: "10", label: "Resistencia a carga" },
];

function flatten(suites) {
  const specs = [];
  for (const suite of suites) {
    for (const s of suite.suites ?? []) {
      specs.push(...(s.specs ?? []));
    }
  }
  return specs;
}

if (!fs.existsSync(reportPath)) {
  console.error(`No existe ${reportPath}. Corré primero la suite de seguridad.`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const stats = report.stats;
const all = flatten(report.suites);

const lines = [];
for (const { prefix, label } of LABELS) {
  const file = all.filter((spec) =>
    (spec.file ?? "").replace(/\\/g, "/").startsWith(`${prefix}-`)
  );
  const ok = file.every((spec) => spec.ok);
  const status = ok ? "✔" : "✖";
  lines.push(
    ok
      ? `${status} ${label} (${file.length} pruebas)`
      : `${status} ${label} — fallaron ${file.filter((s) => !s.ok).length} pruebas`
  );
}

const total = stats.expected + stats.unexpected + stats.skipped;
const passed = stats.expected;
const failed = stats.unexpected;
const verdict = failed === 0 ? "🟢 Aprobado" : `🔴 Rechazado (${failed} fallas)`;

console.log("Informe de seguridad — Catalogo App");
console.log("=".repeat(48));
lines.forEach((l) => console.log(l));
console.log("-".repeat(48));
console.log(`Total: ${total} pruebas · ${passed} aprobadas · ${failed} fallas`);
console.log(`Duración: ${(stats.duration / 1000).toFixed(1)}s`);
console.log(`Resultado general: ${verdict}`);
