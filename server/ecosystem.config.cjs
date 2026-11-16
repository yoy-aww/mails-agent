// PM2 配置（.cjs 后缀：项目 package.json 为 "type":"module"，用 CommonJS 避免加载报错）
module.exports = {
  apps: [
    {
      name: 'mails-agent',
      cwd: __dirname,
      script: 'src/index.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 3011,
        SMTP_HOST: 'smtp.feishu.cn',
        SMTP_PORT: '465',
        SMTP_USER: 'anweiwei@wonderable.ai',
      },
    },
  ],
};
