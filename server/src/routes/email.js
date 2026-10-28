import { readJSON, writeJSON } from '../data.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = path.join(__dirname, '../../smtp.py');

export function initEmailRoutes(app) {
  // POST /api/send
  app.post('/api/send', async (req, res) => {
    const { to, subject, body, templateId } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'to, subject, body 不能为空' });
    }
    try {
      console.log('Sending email via Python script:', SCRIPT_PATH);
      
      await new Promise((resolve, reject) => {
        const proc = spawn('python3', [SCRIPT_PATH, to, subject, body], {
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
