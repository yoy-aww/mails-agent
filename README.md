# 邮件发送器 (Mail Agent)

一个轻量级的邮件发送工具，替代手动在飞书/网页邮箱中逐条填写收件人、选模板、粘贴正文的操作。

## 功能特性

- **模板管理**：预设固定邮件模板，一键调用
- **简洁发件**：选择模板 → 填写收件人 → 点击发送
- **发送历史**：记录每次发送状态（成功/失败）
- **中文兼容**：UTF-8 编码，完美支持中文显示
- **Web 界面**：基于 React + antd，现代简洁的 UI

## 技术栈

| 层 | 技术 |
|---|---|
| 后端 | Node.js 24 + Express + nodemailer |
| 前端 | React 18 + TypeScript + Vite + antd |
| 数据存储 | JSON 文件（模板、配置、历史记录） |
| 邮件协议 | SMTP (飞书邮箱 smtp.feishu.cn) |

## 快速开始

### 本地运行

```bash
# 1. 启动后端
cd server
export PATH="C:/Users/aww/AppData/Roaming/fnm/node-versions/v24.18.0/installation:$PATH"
npm install
npm run dev

# 2. 启动前端（新终端）
cd web
npm install
npm run dev
```

访问 http://localhost:5173

### 部署到服务器

详见 [DEPLOY.md](./DEPLOY.md)

## 项目结构

```
mails-agent/
├── server/                 # Node 后端
│   ├── src/
│   │   ├── index.js        # Express 入口
│   │   ├── smtp.js         # SMTP 发件逻辑
│   │   ├── data.js         # JSON 读写工具
│   │   └── routes/
│   │       ├── config.js   # SMTP 配置 API
│   │       ├── templates.js # 模板 CRUD API
│   │       └── email.js    # 发送 + 历史 API
│   ├── data/
│   │   ├── templates.json  # 模板数据
│   │   ├── config.json     # SMTP 配置
│   │   └── history.json    # 发送记录
│   ├── ecosystem.config.js # PM2 配置
│   └── package.json
├── web/                    # React 前端
│   ├── src/
│   │   ├── App.tsx         # 主布局 + Tabs
│   │   ├── api.ts          # API 请求封装
│   │   └── components/
│   │       ├── SendPanel.tsx        # 发送面板
│   │       ├── TemplatePanel.tsx    # 模板管理
│   │       ├── SettingsPanel.tsx    # SMTP 设置
│   │       └── HistoryPanel.tsx     # 发送历史
│   ├── package.json
│   └── vite.config.ts
├── DEPLOY.md               # 部署指南
└── README.md
```

## API 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/templates` | 获取所有模板 |
| POST | `/api/templates` | 创建模板 |
| PUT | `/api/templates/:id` | 更新模板 |
| DELETE | `/api/templates/:id` | 删除模板 |
| GET | `/api/config` | 获取 SMTP 配置（隐藏密码）|
| POST | `/api/config` | 保存 SMTP 配置 |
| POST | `/api/send` | 发送邮件 |
| GET | `/api/history` | 获取发送历史 |
| GET | `/api/health` | 健康检查 |

## 安全说明

- 授权码存储在 `server/data/config.json`（本地不提交 git）
- 生产环境建议通过环境变量 `SMTP_PASSWORD` 传入
- `.env` 文件已加入 `.gitignore`

## License

MIT
