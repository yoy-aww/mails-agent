# 邮件发送器 部署指南

## 项目信息

- **GitHub**: https://github.com/yoy-aww/mails-agent.git
- **本地路径**: `C:/yoyac-work/mails-agent`
- **技术栈**: Node.js 24 + Express + React 18 + antd
- **发件邮箱**: anweiwei@wonderable.ai (飞书 SMTP)

---

## VPS 部署步骤

### 1. 拉取代码

```bash
# 在 VPS (43.153.148.187) 上执行
cd /var/www
git clone https://github.com/yoy-aww/mails-agent.git
cd mails-agent
```

### 2. 安装后端依赖

```bash
cd server
export PATH="C:/Users/aww/AppData/Roaming/fnm/node-versions/v24.18.0/installation:$PATH"
# 注意：VPS 是 Linux，需要用 Linux 版本的 Node.js
# 检查是否已有 node：
node --version
npm --version

# 如果没有，安装 fnm 并切换版本：
curl -fsSL https://fnm.vercel.app/install | bash
source ~/.bashrc
fnm use --install-if-missing 24
```

### 3. 配置 SMTP（可选）

编辑 `server/.env`：

```bash
SMTP_HOST=smtp.feishu.cn
SMTP_PORT=465
SMTP_USER=anweiwei@wonderable.ai
SMTP_PASSWORD=你的授权码
PORT=3001
```

或直接在前端设置页面配置（更安全）。

### 4. 构建前端

```bash
cd ../web
export PATH="C:/Users/aww/AppData/Roaming/fnm/node-versions/v24.18.0/installation:$PATH"
npm install
npm run build
# 产物在 web/dist/
```

### 5. PM2 启动后端

```bash
cd ../server
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # 自动重启配置
```

### 6. Nginx 配置

创建 `/etc/nginx/sites-enabled/mails-agent`：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 或直接用 IP

    location / {
        root /var/www/mails-agent/web/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

重载 Nginx：

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 7. 防火墙

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

---

## 访问地址

- **本地测试**: http://localhost:5173
- **VPS 部署后**: http://your-vps-ip 或 http://your-domain.com

---

## 常见问题

### 中文乱码问题（已修复）
- 使用 `multipart/alternative` + UTF-8 编码
- 兼容飞书邮箱

### 授权码获取
- 飞书邮箱 → 设置 → 账户 → 第三方应用授权码
- 不要将授权码提交到 git（使用 .env 文件）
