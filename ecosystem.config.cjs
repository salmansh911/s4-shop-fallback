module.exports = {
  apps: [
    {
      name: "s4-shop",
      cwd: __dirname,
      script: "npm",
      args: "start -- -p 3100",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3100",
      },
    },
  ],
};
