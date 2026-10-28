# nodemailer vs Python smtplib 中文编码问题

## 问题现象

使用 nodemailer 发送中文邮件到 163.com 邮箱时，标题和正文显示乱码（`₪₪₪-Python₪₪₪₪₪₪`）。

## 根本原因

- nodemailer 默认使用 base64 或 quoted-printable 编码
- 飞书 SMTP + 163.com 邮箱客户端组合存在编码兼容性问题
- 尝试多种编码方式（GBK、quoted-printable、base64、UTF-8）均失败

## 解决方案

**使用 Python smtplib 替代 nodemailer**

Python 的 smtplib 正确处理中文编码，在 163.com 邮箱中显示正常。

### Python 脚本示例

```python
#!/usr/bin/env python3
import smtplib
from email.mime.text import MIMEText
from email.header import Header
import json

def send_email(to, subject, body):
    with open('data/config.json') as f:
        config = json.load(f)
    
    msg = MIMEText(body, 'plain', 'utf-8')
    msg['Subject'] = Header(subject, 'utf-8')
    msg['From'] = config['user']
    msg['To'] = to
    
    server = smtplib.SMTP_SSL(config['host'], config['port'])
    server.login(config['user'], config['password'])
    server.sendmail(config['user'], [to], msg.as_string())
    server.quit()
```

### Node.js 调用 Python 脚本

```javascript
import { spawn } from 'child_process';
import path from 'path';

const SCRIPT_PATH = path.join(__dirname, '../../smtp.py');

const proc = spawn('python3', [SCRIPT_PATH, to, subject, body]);
await new Promise((resolve, reject) => {
  proc.on('close', (code) => code === 0 ? resolve() : reject());
});
```

## 验证结果

- ✅ 14:05 "测试-Python发送" 显示正常
- ❌ 14:06-14:08 nodemailer 发送的邮件全部乱码

## 结论

对于中文邮件发送，优先使用 Python smtplib，避免 nodemailer 的编码问题。
