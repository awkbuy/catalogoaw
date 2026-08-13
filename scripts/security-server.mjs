// Servidor dedicado para la suite de seguridad (batería E2E de ataque).
// - Crea una BD SQLite fresca y aislada (.security-test.db) con migraciones + seed.
// - Compila el build de producción y arranca `next start` en el puerto 3100.
// Uso (lo invoca playwright.security.config.ts como webServer):
//   node scripts/security-server.mjs
import { rm } from "fs/promises";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbFile = path.join(root, ".security-test.db");
const port = process.env.SECURITY_PORT || "3100";

const env = {
  ...process.env,
  DATABASE_URL: `file:${dbFile}`,
  SESSION_SECRET:
    process.env.SECURITY_SESSION_SECRET ||
    "security-test-secret-0f2b9d1e4a7c3b8f-6a5d4c3b2a1f9e8d",
  ADMIN_PASSWORD: process.env.SECURITY_ADMIN_PASSWORD || "securityTestPass123!",
  ADMIN_PATH: process.env.SECURITY_ADMIN_PATH || "panel-test",
  NEXT_PUBLIC_ADMIN_PATH: process.env.SECURITY_ADMIN_PATH || "panel-test",
  NODE_ENV: "production",
  PORT: port,
  NEXT_PUBLIC_SITE_URL: `http://localhost:${port}`,
};

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, env, stdio: "inherit", shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

// BD fresca en cada corrida de la suite.
await rm(dbFile, { force: true });

console.log("[security-server] migrate deploy");
run("npx", ["prisma", "migrate", "deploy"]);

console.log("[security-server] seed (admin@catalogoapp.com)");
run("npx", ["prisma", "db", "seed"]);

console.log("[security-server] build (producción)");
run("npm", ["run", "build"]);

console.log(`[security-server] next start en :${port}`);
run("npm", ["run", "start", "--", "-p", port]);
