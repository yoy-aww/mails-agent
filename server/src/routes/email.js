import { readJSON, writeJSON } from '../data.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { writeFileSync, unlinkSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
// 路径: __dirname = C:\yoyac-work\mails-agent\server\src\routes
// 目标: C:\yoyac-work\mails-agent\server\smtp.py
const SCRIPT_PATH = 'C:\\yoyac-work\\mails-agent\\server\\smtp.py';
const SCRIPT_DIR = 'C:\\yoyac-work\\mails-agent\\server';
// Windows 用 python.exe 绝对路径
const PYTHON_EXE = 'C:\\Users\\aww\\AppData\\Local\\Python\\pythoncore-3.14-64\\python.exe';

export function initEmailRoutes(app) {
  // POST /api/send
  app.post('/api/send', async (req, res) => {
    const { to, subject, body, templateId } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'to, subject, body 不能为空' });
    }
    try {
      // 创建临时文件传递参数（避免 Windows 命令行编码问题）
      const tmpFile = path.join(SCRIPT_DIR, '.tmp_email_params.json');
      const params = JSON.stringify({ to, subject, body });
      writeFileSync(tmpFile, params, 'utf-8');
      
      console.log('Sending email via Python script:', SCRIPT_PATH);
      console.log('Params file:', tmpFile);
      
      await new Promise((resolve, reject) => {
        const proc = spawn(PYTHON_EXE, [SCRIPT_PATH, tmpFile], {
          cwd: SCRIPT_DIR,
          stdio: ['ignore', 'pipe', 'pipe']
        });
        
        let stdout = '';
        let stderr = '';
        
        proc.stdout.on('data', (data) => {
          stdout += data.toString();
        });
        
        proc.stderr.on('data', (data) => {
          stderr += data.toString();
          console.log('Python stderr:', data.toString());
        });
        
        proc.on('close', (code) => {
          // 清理临时文件
          try { unlinkSync(tmpFile); } catch(e) {}
          
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(stderr || `Python script exited with code ${code}`));
          }
        });
        
        proc.on('error', (err) => {
          try { unlinkSync(tmpFile); } catch(e) {}
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
