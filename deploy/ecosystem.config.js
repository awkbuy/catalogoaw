// PM2 — Wolfie Room (Next.js standalone)
// 1 sola instancia: SQLite no soporta múltiples procesos escribiendo.
module.exports = {
  apps: [
    {
      name: "wolfie-room",
      cwd: "/var/www/wolfie-room/app",
      script: "server.js",
      interpreter: "node",
      interpreter_args: ["--env-file=/var/www/wolfie-room/.env"],
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "400M",
      out_file: "/var/www/wolfie-room/logs/out.log",
      error_file: "/var/www/wolfie-room/logs/error.log",
      merge_logs: true,
      time: true,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
