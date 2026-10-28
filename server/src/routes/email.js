import { readJSON, writeJSON } from '../data.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function initEmailRoutes(app) {
  // POST /api/send
  app.post('/api/send', async (req, res) => {
    const { to, subject, body, templateId } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'to, subject, body 不能为空' });
    }
    try {
      // 使用 Python 脚本发送（中文兼容性更好）
      const pythonScript = path.join(__dirname, '../../smtp.py');
      
      await new Promise((resolve, reject) => {
        const proc = spawn('python3', [pythonScript, to, subject, body], {
          stdio: ['ignore', 'ignore', 'pipe']
        });
        
        let stderr = '';
        proc.stderr.on('data', (data) => {
          stderr += data.toString();
        });
        
        proc.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(stderr || `Python script exited with code ${code}`));
          }
        });
        
        proc.on('error', (err) => {
          reject(new Error(`Failed to start Python: ${err.message}`));
        });
      });
      
      // 记录发送历史
      const history = readJSON('history.json', []);
      history.unshift({
        id: Date.now().toString(36),
        to,
        subject,
        templateId,
        status: 'sent',
        sentAt: new Date().toISOString(),
      });
      writeJSON('history.json', history.slice(0, 200));
      
      res.json({ ok: true, messageId: 'python-smtp' });
    } catch (err) {
      // 记录失败
      const history = readJSON('history.json', []);
      history.unshift({
        id: Date.now().toString(36),
        to,
        subject,
        templateId,
        status: 'failed',
        error: err.message,
        sentAt: new Date().toISOString(),
      });
      writeJSON('history.json', history.slice(0, 200));
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/history
  app.get('/api/history', (req, res) => {
    const history = readJSON('history.json', []);
    res.json(history);
  });
}
