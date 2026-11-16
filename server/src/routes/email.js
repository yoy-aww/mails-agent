import { readJSON, writeJSON } from '../data.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { writeFileSync, unlinkSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
// server/ 目录（src/routes 的上一级）—— 跨平台，不写死绝对路径
const SERVER_DIR = path.resolve(__dirname, '..', '..');
const SCRIPT_PATH = path.join(SERVER_DIR, 'smtp.py');
// Python 解释器：优先环境变量 PYTHON_EXE，其次按平台推断
const PYTHON_EXE = process.env.PYTHON_EXE
  || (process.platform === 'win32' ? 'python' : 'python3');

export function initEmailRoutes(app) {
  // POST /api/send
  app.post('/api/send', async (req, res) => {
    const { to, subject, body, bodyHtml, bodyText, templateId } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'to, subject, body 不能为空' });
    }
    try {
      // 创建临时文件传递参数（避免命令行编码问题）；文件名唯一，避免并发请求互相覆盖
      const tmpFile = path.join(SERVER_DIR, `.tmp_email_params_${process.pid}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.json`);
      const params = JSON.stringify({ to, subject, body, bodyHtml, bodyText });
      writeFileSync(tmpFile, params, 'utf-8');

      console.log('Sending email via Python script:', SCRIPT_PATH);
      console.log('Params file:', tmpFile);

      const { stdout, stderr, code } = await new Promise((resolve, reject) => {
        const proc = spawn(PYTHON_EXE, [SCRIPT_PATH, tmpFile], {
          cwd: SERVER_DIR,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: process.env,
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
          try { unlinkSync(tmpFile); } catch (e) {}
          // 退出码非 0 也可能是"业务失败"（smtp.py 会把错误写进 stdout 的 JSON），
          // 所以这里不直接 reject，交给上层解析 stdout 里的真实原因。
          resolve({ stdout, stderr, code });
        });

        proc.on('error', (err) => {
          try { unlinkSync(tmpFile); } catch (e) {}
          reject(new Error(`Failed to start Python (${PYTHON_EXE}): ${err.message}`));
        });
      });

      // smtp.py 输出 JSON 业务结果：{"success": true} / {"success": false, "error": "..."}
      // 退出码为 0 不代表发送成功，必须解析业务结果
      let result = null;
      const line = stdout.trim().split('\n').filter(Boolean).pop();
      if (line) {
        try { result = JSON.parse(line); } catch (e) { /* 非 JSON 输出视为未知 */ }
      }
      if (!result || result.success !== true) {
        throw new Error(
          result?.error
          || stderr.trim()
          || `SMTP 发送失败（Python 退出码 ${code}，未获得有效的成功响应）`
        );
      }

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
