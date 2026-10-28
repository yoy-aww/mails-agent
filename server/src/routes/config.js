import { readJSON, writeJSON } from '../data.js';

export function initConfigRoutes(app) {
  // GET /api/config — 返回配置（隐藏密码）
  app.get('/api/config', (req, res) => {
    const config = readJSON('config.json', {});
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
