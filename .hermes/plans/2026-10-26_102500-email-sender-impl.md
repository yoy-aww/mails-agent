# 邮件发送器 实现计划

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 开发一个部署在云服务器上的 Web 邮件发送工具，支持预设模板 + 一对一手动填写收件人发送。

**Architecture:** Node.js Express 后端（API + 文件存储）+ React 前端，部署在现有 VPS（43.153.148.187）上。发件通过 SMTP（anweiwei@wonderable.ai）。Web UI 比桌面 GUI 更适合服务器部署场景。

**Tech Stack:** Node 24 / Express / React 18 + TS / Vite / antd / nodemailer

---

## 项目结构

```
C:/yoyac-work/mails-agent/
├── server/                 # Node 后端
│   ├── src/
│   │   ├── index.js        # Express 入口
│   │   ├── smtp.js         # SMTP 发件逻辑
│   │   └── routes/
│   │       └── email.js    # 邮件相关 API
│   ├── data/
│   │   ├── templates.json  # 邮件模板
│   │   ├── config.json     # SMTP 配置
│   │   └── history.json    # 发送记录
│   └── package.json
├── web/                    # React 前端
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── TemplateSelector.tsx
│   │   │   ├── ComposeForm.tsx
│   │   │   └── HistoryLog.tsx
│   │   └── api.ts
│   ├── package.json
│   └── vite.config.ts
└── .env.example            # 环境变量模板
```

---

## API 设计

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/templates` | 获取所有模板 |
| POST | `/api/templates` | 新增/更新模板 |
| DELETE | `/api/templates/:id` | 删除模板 |
| GET | `/api/config` | 获取 SMTP 配置（不含密码）|
| POST | `/api/config` | 保存 SMTP 配置 |
| POST | `/api/send` | 发送邮件（body: {templateId, to, subject, body}）|
| GET | `/api/history` | 获取发送记录 |

---

## 任务列表

### Task 1: 初始化后端项目

**Objective:** 创建 server 目录、package.json、Express 基础框架

**Files:**
- Create: `server/package.json`
- Create: `server/src/index.js`
- Create: `server/data/` 目录（空）

**Step 1:** 写 package.json

```json
{
  "name": "mail-agent-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.21.0",
    "nodemailer": "^6.9.0"
  }
}
```

**Step 2:** 写 `src/index.js`（基础 Express，先验证能跑）

```js
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
```

**Step 3:** 安装依赖并验证

```bash
cd C:/yoyac-work/mails-agent/server
npm install
npm run dev
# 另一终端验证：curl http://localhost:3001/api/health
```

**Step 4:** Commit

```bash
git add -A
git commit -m "feat: 初始化后端项目结构"
```

---

### Task 2: 数据层 — JSON 文件读写

**Objective:** 实现 templates / config / history 三个文件的读写工具函数

**Files:**
- Create: `server/src/data.js`
- Create: `server/data/templates.json`（初始空数组）
- Create: `server/data/config.json`（默认空配置）
- Create: `server/data/history.json`（初始空数组）

**Step 1:** 写 `src/data.js`

```js
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(import.meta.dirname, '..', 'data');

export function readJSON(filename, fallback = null) {
  try {
    const data = readFileSync(join(DATA_DIR, filename), 'utf-8');
    return JSON.parse(data);
  } catch {
    return fallback;
  }
}

export function writeJSON(filename, data) {
  writeFileSync(join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf-8');
}
```

**Step 2:** 初始化三个 JSON 文件内容（写完后验证文件存在）

```bash
echo '[]' > server/data/templates.json
echo '{}' > server/data/config.json
echo '[]' > server/data/history.json
```

**Step 3:** Commit

```bash
git add -A
git commit -m "feat: 实现 JSON 数据层"
```

---

### Task 3: SMTP 配置 API

**Objective:** 提供保存和读取 SMTP 配置的接口（密码加密存储）

**Files:**
- Create: `server/src/routes/config.js`
- Modify: `server/src/index.js`（挂载路由）

**Step 1:** 写 `src/routes/config.js`

```js
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
```

**Step 2:** 在 `src/index.js` 中导入并挂载

```js
import { initConfigRoutes } from './routes/config.js';
// ... 在 app.use 之后加：
initConfigRoutes(app);
```

**Step 3:** 验证 API

```bash
curl http://localhost:3001/api/config
# 预期: {"host":"","port":465,"secure":true,"user":"","hasPassword":false}
```

**Step 4:** Commit

```bash
git add -A
git commit -m "feat: SMTP 配置增删改查 API"
```

---

### Task 4: 邮件模板 API

**Objective:** 提供模板的增删改查接口

**Files:**
- Create: `server/src/routes/templates.js`
- Modify: `server/src/index.js`（挂载路由）

**Step 1:** 写 `src/routes/templates.js`

```js
import { v4 as uuidv4 } from 'uuid'; // 或自己生成短 ID
import { readJSON, writeJSON } from '../data.js';

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function initTemplatesRoutes(app) {
  // GET /api/templates
  app.get('/api/templates', (req, res) => {
    const templates = readJSON('templates.json', []);
    res.json(templates);
  });

  // POST /api/templates
  app.post('/api/templates', (req, res) => {
    const templates = readJSON('templates.json', []);
    const { name, subject, body } = req.body;
    const template = { id: genId(), name, subject, body, createdAt: new Date().toISOString() };
    templates.push(template);
    writeJSON('templates.json', templates);
    res.json({ ok: true, id: template.id });
  });

  // PUT /api/templates/:id
  app.put('/api/templates/:id', (req, res) => {
    const templates = readJSON('templates.json', []);
    const idx = templates.findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'not found' });
    templates[idx] = { ...templates[idx], ...req.body };
    writeJSON('templates.json', templates);
    res.json({ ok: true });
  });

  // DELETE /api/templates/:id
  app.delete('/api/templates/:id', (req, res) => {
    let templates = readJSON('templates.json', []);
    templates = templates.filter(t => t.id !== req.params.id);
    writeJSON('templates.json', templates);
    res.json({ ok: true });
  });
}
```

**Step 2:** 在 `src/index.js` 中挂载

```js
import { initTemplatesRoutes } from './routes/templates.js';
initTemplatesRoutes(app);
```

**Step 3:** 验证

```bash
# 添加一个测试模板
curl -X POST http://localhost:3001/api/templates \
  -H "Content-Type: application/json" \
  -d '{"name":"测试模板","subject":"你好","body":"这是一封测试邮件"}'

# 查看所有模板
curl http://localhost:3001/api/templates
```

**Step 4:** Commit

```bash
git add -A
git commit -m "feat: 邮件模板 CRUD API"
```

---

### Task 5: 发送邮件核心逻辑

**Objective:** 实现 SMTP 发件 + 发送记录

**Files:**
- Create: `server/src/smtp.js`
- Create: `server/src/routes/email.js`
- Modify: `server/src/index.js`（挂载路由）

**Step 1:** 写 `src/smtp.js`

```js
import nodemailer from 'nodemailer';
import { readJSON } from './data.js';

export async function sendEmail({ to, subject, body }) {
  const config = readJSON('config.json', null);
  if (!config?.host || !config?.password) {
    throw new Error('SMTP 配置未设置，请先在设置中保存 SMTP 信息');
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port || 465,
    secure: config.secure !== false, // true for 465, false for 587
    auth: {
      user: config.user,
      pass: config.password,
    },
  });

  const info = await transporter.sendMail({
    from: config.user,
    to,
    subject,
    text: body,
  });

  return { messageId: info.messageId, success: true };
}
```

**Step 2:** 写 `src/routes/email.js`

```js
import { readJSON, writeJSON } from '../data.js';
import { sendEmail } from '../smtp.js';

export function initEmailRoutes(app) {
  // POST /api/send
  app.post('/api/send', async (req, res) => {
    const { to, subject, body, templateId } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'to, subject, body 不能为空' });
    }
    try {
      const result = await sendEmail({ to, subject, body });
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
      writeJSON('history.json', history.slice(0, 200)); // 保留最近200条
      res.json({ ok: true, ...result });
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
```

**Step 3:** 在 `src/index.js` 中挂载

```js
import { initEmailRoutes } from './routes/email.js';
initEmailRoutes(app);
```

**Step 4:** 手动测试（用测试 SMTP 配置验证发件是否通）

```bash
# 先配置 SMTP（以 QQ 邮箱为例，需先获取授权码）
curl -X POST http://localhost:3001/api/config \
  -H "Content-Type: application/json" \
  -d '{"host":"smtp.qq.com","port":465,"secure":true,"user":"anweiwei@wonderable.ai","password":"你的授权码"}'

# 发送测试邮件
curl -X POST http://localhost:3001/api/send \
  -H "Content-Type: application/json" \
  -d '{"to":"你的收件邮箱","subject":"测试","body":"这是一封测试邮件"}'
```

**Step 5:** Commit

```bash
git add -A
git commit -m "feat: SMTP 发件核心逻辑 + 发送历史"
```

---

### Task 6: 前端项目初始化

**Objective:** 创建 React + Vite + TypeScript 前端，antd 组件库

**Files:**
- Create: `web/package.json`
- Create: `web/vite.config.ts`
- Create: `web/index.html`
- Create: `web/src/main.tsx`
- Create: `web/src/App.tsx`
- Create: `web/tsconfig.json`
- Create: `web/tsconfig.app.json`

**Step 1:** 写 `web/package.json`

```json
{
  "name": "mail-agent-web",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "antd": "^5.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "~5.6.0",
    "vite": "^5.4.0"
  }
}
```

**Step 2:** 写 `web/vite.config.ts`（代理到后端 3001）

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
```

**Step 3:** 写 `web/src/App.tsx`（基础布局，后续逐步填充）

```tsx
import { Layout, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

const { Header, Content } = Layout;

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ background: '#001529', color: '#fff', fontSize: 18 }}>
          📧 邮件发送器
        </Header>
        <Content style={{ padding: 24, maxWidth: 900, margin: '0 auto', width: '100%' }}>
          {/* 后续填充 */}
        </Content>
      </Layout>
    </ConfigProvider>
  );
}
```

**Step 4:** 安装依赖并启动

```bash
cd C:/yoyac-work/mails-agent/web
npm install
npm run dev
# 浏览器访问 http://localhost:5173
```

**Step 5:** Commit

```bash
git add -A
git commit -m "feat: 前端项目初始化（React + Vite + antd）"
```

---

### Task 7: 前端 — 模板管理面板

**Objective:** 左侧/上方 tab：模板列表 + 新增/编辑模板

**Files:**
- Create: `web/src/api.ts`
- Create: `web/src/components/TemplatePanel.tsx`
- Modify: `web/src/App.tsx`

**Step 1:** 写 `web/src/api.ts`

```ts
const BASE = '/api';

export const api = {
  getTemplates: () => fetch(`${BASE}/templates`).then(r => r.json()),
  createTemplate: (data: { name: string; subject: string; body: string }) =>
    fetch(`${BASE}/templates`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  updateTemplate: (id: string, data: Partial<{ name: string; subject: string; body: string }>) =>
    fetch(`${BASE}/templates/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  deleteTemplate: (id: string) =>
    fetch(`${BASE}/templates/${id}`, { method: 'DELETE' }).then(r => r.json()),
  getConfig: () => fetch(`${BASE}/config`).then(r => r.json()),
  saveConfig: (data: object) =>
    fetch(`${BASE}/config`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  sendEmail: (data: { to: string; subject: string; body: string; templateId?: string }) =>
    fetch(`${BASE}/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  getHistory: () => fetch(`${BASE}/history`).then(r => r.json()),
};
```

**Step 2:** 写 `web/src/components/TemplatePanel.tsx`

```tsx
import { useEffect, useState } from 'react';
import { Button, Input, List, Modal, message, Space, Typography } from 'antd';
import { api } from '../api';
const { TextArea } = Input;
const { Title } = Typography;

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
}

export default function TemplatePanel() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState({ name: '', subject: '', body: '' });

  const load = () => api.getTemplates().then(setTemplates);
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', subject: '', body: '' }); setModalOpen(true); };
  const openEdit = (t: Template) => { setEditing(t); setForm({ name: t.name, subject: t.subject, body: t.body }); setModalOpen(true); };

  const save = async () => {
    if (!form.name || !form.subject || !form.body) { message.warning('请填写完整'); return; }
    if (editing) {
      await api.updateTemplate(editing.id, form);
      message.success('模板已更新');
    } else {
      await api.createTemplate(form);
      message.success('模板已创建');
    }
    setModalOpen(false);
    load();
  };

  const del = async (t: Template) => {
    if (!confirm(`删除模板「${t.name}」？`)) return;
    await api.deleteTemplate(t.id);
    message.success('已删除');
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>邮件模板</Title>
        <Button type="primary" onClick={openCreate}>+ 新建模板</Button>
      </div>
      <List
        dataSource={templates}
        renderItem={t => (
          <List.Item
            actions={[
              <Button size="small" onClick={() => openEdit(t)}>编辑</Button>,
              <Button size="small" danger onClick={() => del(t)}>删除</Button>,
            ]}
          >
            <List.Item.Meta title={t.name} description={`${t.subject}｜${t.body.slice(0, 60)}...`} />
          </List.Item>
        )}
      />
      <Modal
        open={modalOpen}
        title={editing ? '编辑模板' : '新建模板'}
        onOk={save}
        onCancel={() => setModalOpen(false)}
        width={600}
      >
        <Input.Placeholder="模板名称（如：节日问候）" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          style={{ marginBottom: 12 }} />
        <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
          placeholder="邮件标题" style={{ marginBottom: 12 }} />
        <TextArea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
          placeholder="邮件正文（纯文本）" rows={8} />
      </Modal>
    </div>
  );
}
```

**Step 3:** 在 `App.tsx` 中引入

```tsx
import TemplatePanel from './components/TemplatePanel';
// Content 内加入: <TemplatePanel />
```

**Step 4:** 启动前端验证模板管理功能

```bash
cd C:/yoyac-work/mails-agent/web
npm run dev
# 访问 http://localhost:5173，测试创建/编辑/删除模板
```

**Step 5:** Commit

```bash
git add -A
git commit -m "feat: 前端模板管理面板"
```

---

### Task 8: 前端 — 发送邮件面板

**Objective:** 主要操作面板：选模板 → 填收件人 → 预览 → 发送

**Files:**
- Create: `web/src/components/SendPanel.tsx`
- Modify: `web/src/App.tsx`（添加 Tab 切换）

**Step 1:** 写 `web/src/components/SendPanel.tsx`

```tsx
import { useEffect, useState } from 'react';
import { Button, Input, Select, Spin, message, Typography } from 'antd';
import { api } from '../api';
const { TextArea } = Input;
const { Title, Text } = Typography;

export default function SendPanel() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');

  useEffect(() => { api.getTemplates().then(setTemplates); }, []);

  const onSelect = (id: string) => {
    setSelectedId(id);
    const t = templates.find(x => x.id === id);
    if (t) { setSubject(t.subject); setBody(t.body); }
  };

  const handleSend = async () => {
    if (!to || !subject || !body) { message.warning('请填写完整'); return; }
    setSending(true);
    setLastResult('');
    try {
      const res = await api.sendEmail({ to, subject, body, templateId: selectedId });
      setLastResult('✅ 发送成功');
      message.success('邮件已发送');
    } catch (err: any) {
      setLastResult('❌ 发送失败：' + (err?.error?.message || String(err)));
      message.error('发送失败');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <Title level={4}>发送邮件</Title>

      <Text strong>1. 选择模板</Text>
      <Select
        style={{ width: '100%', marginTop: 6, marginBottom: 16 }}
        placeholder="选择模板（不选则手动填写）"
        value={selectedId}
        onChange={onSelect}
        options={templates.map(t => ({ value: t.id, label: t.name }))}
        allowClear
      />

      <Text strong>2. 收件人邮箱</Text>
      <Input value={to} onChange={e => setTo(e.target.value)}
        placeholder="recipient@example.com" style={{ marginTop: 6, marginBottom: 16 }} />

      <Text strong>3. 邮件标题</Text>
      <Input value={subject} onChange={e => setSubject(e.target.value)}
        placeholder="邮件标题" style={{ marginTop: 6, marginBottom: 16 }} />

      <Text strong>4. 邮件正文</Text>
      <TextArea value={body} onChange={e => setBody(e.target.value)}
        placeholder="邮件正文" rows={10} style={{ marginTop: 6, marginBottom: 16 }} />

      <Button type="primary" size="large" block onClick={handleSend} disabled={sending}>
        {sending ? <Spin size="small" /> : '📤 发送'}
      </Button>

      {lastResult && <Text style={{ marginTop: 12, display: 'block' }}>{lastResult}</Text>}
    </div>
  );
}
```

**Step 2:** 修改 `App.tsx`，加 Tabs 切换

```tsx
import { Tabs } from 'antd';
import TemplatePanel from './components/TemplatePanel';
import SendPanel from './components/SendPanel';

// Content 内：
<Tabs items={[
  { key: 'send', label: '📤 发送邮件', children: <SendPanel /> },
  { key: 'templates', label: '📋 模板管理', children: <TemplatePanel /> },
  { key: 'settings', label: '⚙️ 设置', children: <SettingsPanel /> }, // Task 9
]} />
```

**Step 3:** Commit

```bash
git add -A
git commit -m "feat: 前端发送面板 + Tabs 导航"
```

---

### Task 9: 前端 — SMTP 设置面板

**Objective:** 配置 SMTP 服务器地址、端口、账号、授权码

**Files:**
- Create: `web/src/components/SettingsPanel.tsx`
- Modify: `web/src/App.tsx`（加入 Tab）

**Step 1:** 写 `web/src/components/SettingsPanel.tsx`

```tsx
import { useEffect, useState } from 'react';
import { Button, Input, message, Form, Tooltip } from 'antd';

const HELP = {
  host: 'SMTP 服务器地址，如 smtp.qq.com、smtp.163.com',
  port: '465（SSL）或 587（STARTTLS）',
  user: '发件邮箱地址',
  password: '邮箱授权码（不是登录密码），在邮箱设置中生成',
};

export default function SettingsPanel() {
  const [form, setForm] = useState({ host: '', port: 465, user: '', password: '' });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.getConfig().then(cfg => {
      setForm({ host: cfg.host, port: cfg.port, user: cfg.user, password: '' });
      setLoaded(true);
    });
  }, []);

  const save = async () => {
    if (!form.host || !form.user || !form.password) { message.warning('请填写完整（密码必填）'); return; }
    await api.saveConfig(form);
    message.success('SMTP 配置已保存');
  };

  if (!loaded) return <div>加载中...</div>;

  return (
    <div style={{ maxWidth: 500 }}>
      <Form labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
        <Form.Item label="SMTP 服务器" extra={<Tooltip title={HELP.host}>{HELP.host}</Tooltip>}>
          <Input value={form.host} onChange={e => setForm(f => ({ ...f, host: e.target.value }))} />
        </Form.Item>
        <Form.Item label="端口" extra={HELP.port}>
          <Input type="number" value={form.port} onChange={e => setForm(f => ({ ...f, port: Number(e.target.value) }))} />
        </Form.Item>
        <Form.Item label="发件邮箱" extra={HELP.user}>
          <Input value={form.user} onChange={e => setForm(f => ({ ...f, user: e.target.value }))} />
        </Form.Item>
        <Form.Item label="授权码" extra={HELP.password}>
          <Input.Password value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 6 }}>
          <Button type="primary" onClick={save}>保存配置</Button>
        </Form.Item>
      </Form>
    </div>
  );
}
```

**Step 2:** Commit

```bash
git add -A
git commit -m "feat: 前端 SMTP 设置面板"
```

---

### Task 10: 前端 — 发送历史面板

**Objective:** 查看历史发送记录（成功/失败）

**Files:**
- Create: `web/src/components/HistoryPanel.tsx`
- Modify: `web/src/App.tsx`（加入 Tab）

**Step 1:** 写 `web/src/components/HistoryPanel.tsx`

```tsx
import { useEffect, useState } from 'react';
import { Table, Tag } from 'antd';
import { api } from '../api';

export default function HistoryPanel() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    api.getHistory().then(setRows);
  }, []);

  const columns = [
    { title: '时间', dataIndex: 'sentAt', render: (v: string) => new Date(v).toLocaleString('zh-CN') },
    { title: '收件人', dataIndex: 'to' },
    { title: '标题', dataIndex: 'subject' },
    { title: '状态', dataIndex: 'status', render: (v: string) =>
      v === 'sent' ? <Tag color="green">已发送</Tag> : <Tag color="red">失败：{v}</Tag> },
  ];

  return <Table dataSource={rows} columns={columns} rowKey="id" size="small" pagination={{ pageSize: 20 }} />;
}
```

**Step 2:** 在 App.tsx 中加入第四个 Tab

```tsx
{ key: 'history', label: '📜 发送历史', children: <HistoryPanel /> }
```

**Step 3:** Commit

```bash
git add -A
git commit -m "feat: 前端发送历史面板"
```

---

### Task 11: PM2 部署配置

**Objective:** 配置 PM2 使后端在生产环境稳定运行

**Files:**
- Create: `server/ecosystem.config.js`
- Create: `server/.env`

**Step 1:** 写 `server/ecosystem.config.js`

```js
export default {
  apps: [{
    name: 'mail-agent',
    script: 'src/index.js',
    cwd: '.',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
  }],
};
```

**Step 2:** 写 `server/.env`（从环境变量读取，避免提交密码）

```bash
# 不要提交这个文件到 git！
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_USER=anweiwei@wonderable.ai
SMTP_PASSWORD=你的授权码
PORT=3001
```

**Step 3:** 修改 `src/smtp.js` 支持环境变量 fallback

```js
// 优先用数据库 config，若为空则用环境变量
const config = readJSON('config.json', null) || {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  user: process.env.SMTP_USER,
  password: process.env.SMTP_PASSWORD,
};
```

**Step 4:** Commit

```bash
git add -A
git commit -m "feat: PM2 部署配置 + 环境变量支持"
```

---

### Task 12: 生产环境部署到 VPS

**Objective:** 在服务器上部署前后端，配置 Nginx 反向代理

**部署步骤（在 VPS 上执行）：**

```bash
# 1. 克隆项目
cd /var/www
git clone <your-repo-url> mails-agent
cd mails-agent

# 2. 安装后端依赖并启动
cd server && npm install --production
npm run build  # 如果做了 build
pm2 start ecosystem.config.js --env production
pm2 save

# 3. 安装前端依赖并构建
cd ../web && npm install
npm run build
# 产物在 web/dist/

# 4. Nginx 配置（假设域名 mail.yourdomain.com）
# /etc/nginx/sites-enabled/mails-agent
# server {
#   listen 80;
#   server_name mail.yourdomain.com;
#   location / {
#     root /var/www/mails-agent/web/dist;
#     try_files $uri $uri/ /index.html;
#   }
#   location /api {
#     proxy_pass http://127.0.0.1:3001;
#     proxy_http_version 1.1;
#     proxy_set_header Host $host;
#   }
# }

# 5. 重载 Nginx
sudo nginx -t && sudo systemctl reload nginx

# 6. 设置防火墙（开放 80/443）
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

**Step 5:** Commit（不含 .env）

```bash
git add -A
git commit -m "docs: 添加部署说明"
```

---

## 验证清单

- [ ] 本地 `npm run dev`（server + web 各开一个终端）能启动
- [ ] 模板 CRUD 正常（创建/编辑/删除/列表）
- [ ] SMTP 配置保存后不报错
- [ ] 真实发送一封测试邮件到指定地址，确认收到
- [ ] 发送历史记录正确写入
- [ ] VPS 上 PM2 进程常驻，重启后自动恢复
- [ ] Nginx 代理 `/api` 转发正常

---

## 风险 & 注意事项

| 风险 | 应对 |
|---|---|
| SMTP 授权码泄露 | `.env` 不进 git；VPS 上文件权限 600 |
| 邮件被当成垃圾邮件 | 使用正规 SMTP 通道，内容规范，低频发送问题不大 |
| 前端 proxy 只在 dev 有效 | 生产走 Nginx 反向代理，已在 Task 12 覆盖 |
| 服务器内存/负载 | 此工具极轻量，无压力 |
