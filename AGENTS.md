<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:test-gates -->
# Regla permanente: tests antes de desplegar

1. **Toda feature nueva debe incluir tests Playwright** (funcionales en `tests/`, o de seguridad en `tests/security/` si la feature toca autenticación, subida de archivos, APIs, rate limit, headers o validación de inputs).
2. **Nada se despliega a producción si falla alguna prueba.** El workflow `.github/workflows/deploy.yml` ejecuta dos gates antes de cualquier SSH/rsync:
   - **Gate funcional**: `npx playwright test` (suite E2E contra el dev server, `tests/`).
   - **Gate de seguridad**: `npx playwright test --config=playwright.security.config.ts` (batería de ataque E2E contra build de producción aislado, `tests/security/`, BD `.security-test.db`, puerto 3100).
3. **Verificación local antes de commitear:**
   - `npx playwright test` — suite funcional (requiere `dev.db` sembrada; el seed ya incluye admin@wolfieroom.com/admin123 y 20 juegos).
   - `npx playwright test --config=playwright.security.config.ts` — suite de seguridad (levanta y derriba su propio servidor en :3100 con BD fresca).
4. **No modificar** `.github/workflows/deploy.yml` para saltar los gates, ni quitar la suite de seguridad de `playwright.config.ts` (testIgnore `tests/security/**` se mantiene: esa suite corre con su propia config).
5. Si una prueba falla, **corregir la causa raíz y re-ejecutar toda la batería** antes de commitear/pushear.
<!-- END:test-gates -->
