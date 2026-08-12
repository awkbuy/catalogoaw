/**
 * Script para crear un nuevo tenant en la plataforma.
 *
 * Uso:
 *   npx tsx scripts/create-tenant.ts <slug> <nombre> <email> <password>
 *
 * Ejemplo:
 *   npx tsx scripts/create-tenant.ts wolfie-room "Wolfie Room" admin@wolfieroom.com admin123
 *
 * Este script:
 * 1. Crea el tenant en la DB de plataforma
 * 2. Crea la DB del tenant con el schema actual (usando prisma migrate)
 * 3. Crea el usuario admin del tenant
 * 4. Crea el subdominio por defecto
 */
import { execSync } from "child_process";
import { existsSync, mkdirSync, copyFileSync } from "fs";
import path from "path";
import { hashSync } from "bcryptjs";

// Cargar variables de entorno
import "dotenv/config";

const PLATFORM_DB_URL = process.env.PLATFORM_DATABASE_URL || "file:./data/platform.db";
const TENANTS_DIR = path.join(process.cwd(), "data", "tenants");

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 4) {
    console.error("Uso: npx tsx scripts/create-tenant.ts <slug> <nombre> <email> <password>");
    process.exit(1);
  }

  const [slug, nombre, email, password] = args;

  // Validar slug
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) {
    console.error("Error: El slug solo puede contener letras minúsculas, números y guiones.");
    process.exit(1);
  }

  console.log(`\n==> Creando tenant: ${slug}`);

  // 1. Crear directorio del tenant
  const tenantDir = path.join(TENANTS_DIR, slug);
  if (!existsSync(tenantDir)) {
    mkdirSync(tenantDir, { recursive: true });
  }

  // 2. Crear la DB del tenant copiando la DB plantilla (dev.db)
  const templateDb = path.join(process.cwd(), "dev.db");
  const tenantDb = path.join(tenantDir, `${slug}.db`);

  if (!existsSync(templateDb)) {
    console.error("Error: No se encontró dev.db como plantilla.");
    console.error("Ejecutá `npx prisma db seed` primero para crear la DB plantilla.");
    process.exit(1);
  }

  if (existsSync(tenantDb)) {
    console.log(`   La DB del tenant ya existe: ${tenantDb}`);
  } else {
    copyFileSync(templateDb, tenantDb);
    console.log(`   DB creada: ${tenantDb}`);
  }

  // 3. Aplicar migraciones a la DB del tenant
  console.log("   Aplicando migraciones...");
  try {
    execSync(`npx prisma migrate deploy`, {
      env: { ...process.env, DATABASE_URL: `file:${tenantDb}` },
      cwd: process.cwd(),
      stdio: "pipe",
    });
    console.log("   Migraciones aplicadas.");
  } catch (error) {
    console.error("   Error aplicando migraciones:", error);
    process.exit(1);
  }

  // 4. Crear tenant en la DB de plataforma
  console.log("   Registrando tenant en la DB de plataforma...");

  // Usar better-sqlite3 directamente para la DB de plataforma
  const Database = require("better-sqlite3");
  const platformDbPath = path.join(
    process.cwd(),
    PLATFORM_DB_URL.replace("file:", "")
  );

  // Asegurar que el directorio existe
  const platformDbDir = path.dirname(platformDbPath);
  if (!existsSync(platformDbDir)) {
    mkdirSync(platformDbDir, { recursive: true });
  }

  const platformDb = new Database(platformDbPath);

  // Crear tablas de plataforma si no existen
  platformDb.exec(`
    CREATE TABLE IF NOT EXISTS Tenant (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'active',
      plan TEXT NOT NULL DEFAULT 'free',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS TenantUser (
      id TEXT PRIMARY KEY,
      tenantId TEXT NOT NULL,
      email TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tenantId, email),
      FOREIGN KEY (tenantId) REFERENCES Tenant(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Domain (
      id TEXT PRIMARY KEY,
      tenantId TEXT NOT NULL,
      domain TEXT UNIQUE NOT NULL,
      verified INTEGER NOT NULL DEFAULT 0,
      type TEXT NOT NULL DEFAULT 'subdomain',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenantId) REFERENCES Tenant(id) ON DELETE CASCADE
    );
  `);

  // Generar ID de tenant
  const tenantId = `t_${slug}_${Date.now()}`;

  // Insertar tenant
  const insertTenant = platformDb.prepare(`
    INSERT OR IGNORE INTO Tenant (id, slug, nombre, estado, plan)
    VALUES (?, ?, ?, 'active', 'basico')
  `);
  insertTenant.run(tenantId, slug, nombre);

  // Obtener el tenant insertado
  const tenant = platformDb.prepare("SELECT id FROM Tenant WHERE slug = ?").get(slug);
  if (!tenant) {
    console.error("   Error: No se pudo crear el tenant en la DB de plataforma.");
    process.exit(1);
  }

  // Insertar usuario admin
  const userId = `u_${slug}_admin_${Date.now()}`;
  const passwordHash = hashSync(password, 10);

  const insertUser = platformDb.prepare(`
    INSERT OR IGNORE INTO TenantUser (id, tenantId, email, passwordHash, role)
    VALUES (?, ?, ?, ?, 'owner')
  `);
  insertUser.run(userId, tenant.id, email, passwordHash);

  // Insertar subdominio por defecto
  const domainId = `d_${slug}_${Date.now()}`;
  const insertDomain = platformDb.prepare(`
    INSERT OR IGNORE INTO Domain (id, tenantId, domain, verified, type)
    VALUES (?, ?, ?, 1, 'subdomain')
  `);
  insertDomain.run(domainId, tenant.id, `${slug}.${process.env.PLATFORM_DOMAIN || "catalogoaw.com"}`);

  platformDb.close();

  console.log("\n==> Tenant creado exitosamente!");
  console.log(`   ID: ${tenant.id}`);
  console.log(`   Slug: ${slug}`);
  console.log(`   Subdominio: ${slug}.${process.env.PLATFORM_DOMAIN || "catalogoaw.com"}`);
  console.log(`   Admin: ${email}`);
  console.log(`   DB: ${tenantDb}`);
  console.log(`\n   Para acceder: http://${slug}.${process.env.PLATFORM_DOMAIN || "catalogoaw.com"}/login`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
