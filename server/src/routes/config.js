import { readJSON, writeJSON } from '../data.js';

// 从 process.env（.env）派生一份 config，作为 config.json 缺失时的兜底
function envConfig() {
  return {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
  };
}

export function initConfigRoutes(app) {
  // GET /api/config — 返回配置（隐藏密码）；config.json 缺值时用 .env 兜底
  app.get('/api/config', (req, res) => {
    const fromFile = readJSON('config.json', null);
    const fallback = envConfig();
    const config = fromFile && fromFile.host ? fromFile : fallback;
    res.json({
      host: config.host || '',
      port: config.port || 465,
      secure: config.secure !== false,
      user: config.user || '',
      hasPassword: !!config.password,
    });
  });

  // POST /api/config — 保存配置
  app.post('/api/config', (req, res) => {
    const { host, port, secure, user, password } = req.body;
    const config = readJSON('config.json', {});
    Object.assign(config, { host, port: Number(port), secure, user, password });
    writeJSON('config.json', config);
    res.json({ ok: true });
  });
}
