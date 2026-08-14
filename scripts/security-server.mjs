// Servidor dedicado para la suite de seguridad (batería E2E de ataque).
// - Crea una BD SQLite fresca y aislada (.security-test.db) con migraciones + seed.
// - Compila el build de producción y arranca `next start` en el puerto 3100.
// Uso (lo invoca playwright.security.config.ts como webServer):
//   node scripts/security-server.mjs
import { rm, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbFile = path.join(root, ".security-test.db");
const port = process.env.SECURITY_PORT || "3100";
const standaloneDir = path.join(root, ".next", "standalone");

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
  ALLOW_SINGLE_TENANT: "true",
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

console.log("[security-server] ensamblar standalone (.next/static + public/)");
// El server standalone NO sirve los assets desde el bundle (igual que en el deploy
// real: deploy/assemble.sh copia .next/static y public/ junto a server.js).
// En Windows, `cp -r` de Node intenta recrear los symlinks de @prisma/* y tira
// EPERM, así que usamos la copia nativa del SO (robocopy / cp -r).
async function copyDir(src, dest) {
  if (process.platform === "win32") {
    const r = spawnSync(
      "robocopy",
      [src, dest, "/E", "/NFL", "/NDL", "/NJH", "/NJS", "/NC", "/NS", "/NP"],
      { stdio: "ignore" }
    );
    // robocopy: 0-7 son exit codes de éxito (archivos copiados).
    if (r.error) throw r.error;
    if (r.status != null && r.status >= 8) process.exit(r.status);
  } else {
    const r = spawnSync("cp", ["-r", `${src}/.`, dest], { stdio: "inherit", shell: true });
    if (r.status !== 0) process.exit(r.status ?? 1);
  }
}
const staticDest = path.join(standaloneDir, ".next", "static");
const publicDest = path.join(standaloneDir, "public");
await rm(staticDest, { recursive: true, force: true });
await rm(publicDest, { recursive: true, force: true });
await mkdir(staticDest, { recursive: true });
await mkdir(publicDest, { recursive: true });
if (existsSync(path.join(root, ".next", "static"))) {
  await copyDir(path.join(root, ".next", "static"), staticDest);
}
if (existsSync(path.join(root, "public"))) {
  await copyDir(path.join(root, "public"), publicDest);
}

// Native modules: el trace del standalone no copia las DLLs compartidas que
// sharp/better-sqlite3 necesitan en runtime (p. ej. @img/sharp-*/lib/*.dll en
// Windows). Las copiamos desde el node_modules raíz, igual que deploy/assemble.sh.
for (const pkg of ["sharp", "@img", "better-sqlite3", "prebuild-install"]) {
  const src = path.join(root, "node_modules", pkg);
  if (existsSync(src)) {
    await copyDir(src, path.join(standaloneDir, "node_modules", pkg));
  }
}

console.log(`[security-server] standalone server en :${port}`);
// Con output:"standalone", `next start` NO funciona. Hay que correr el server
// standalone (mismo modo que el deploy real en el VPS / PM2).
// El server.js standalone escucha en HOSTNAME (por defecto 0.0.0.0) y PORT.
// shell:false para no romper el path con espacios (Win).
const srv = spawnSync(process.execPath, [path.join(standaloneDir, "server.js")], {
  cwd: root,
  env,
  stdio: "inherit",
});
if (srv.error) throw srv.error;
if (srv.status !== 0) process.exit(srv.status ?? 1);
