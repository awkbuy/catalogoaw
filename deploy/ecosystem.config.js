// PM2 — Plataforma SaaS (Next.js standalone)
// 1 sola instancia: SQLite no soporta múltiples procesos escribiendo.
module.exports = {
  apps: [
    {
      name: "catalogoaw",
      cwd: "/var/www/catalogoaw/app",
      script: "server.js",
      interpreter: "node",
      interpreter_args: ["--env-file=/var/www/catalogoaw/.env"],
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "500M",
      out_file: "/var/www/catalogoaw/logs/out.log",
      error_file: "/var/www/catalogoaw/logs/error.log",
      merge_logs: true,
      time: true,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
