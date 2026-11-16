#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import smtplib
from email.mime.text import MIMEText
from email.header import Header
import json
import os
import sys

# 配置文件路径：相对脚本自身目录（不依赖 cwd）
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SMTP_CONFIG_FILE = os.path.join(SCRIPT_DIR, 'data', 'config.json')
SMTP_TIMEOUT = 30


def load_config():
    try:
        with open(SMTP_CONFIG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}


def send_email(to, subject, body):
    config = load_config()

    smtp_host = config.get('host', 'smtp.feishu.cn')
    smtp_port = int(config.get('port', 465))
    username = config.get('user', '')
    password = config.get('password', '')

    if not username or not password:
        username = os.getenv('SMTP_USER', 'anweiwei@wonderable.ai')
        password = os.getenv('SMTP_PASSWORD', '')
        smtp_host = os.getenv('SMTP_HOST', 'smtp.feishu.cn')
        smtp_port = int(os.getenv('SMTP_PORT', '465'))

    if not username or not password:
        return {'success': False, 'error': 'SMTP 凭据未配置（user/password 为空）'}

    # 正文：MIMEText 自动选择 CTE（中文内容默认 base64），不要手动覆盖
    msg = MIMEText(body, 'plain', 'utf-8')

    # 发件人：From 头只放裸邮箱地址（HELO 必须是纯 ASCII，带中文名会被飞书拒收）
    msg['From'] = username
    msg['To'] = to

    # 标题：用 Header 编码（中文 → =?utf-8?b?...? 或 qp）
    msg['Subject'] = Header(subject, 'utf-8')

    try:
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=SMTP_TIMEOUT)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=SMTP_TIMEOUT)
            server.starttls()

        server.login(username, password)
        server.sendmail(username, [to], msg.as_string())
        server.quit()
        return {'success': True}
    except Exception as e:
        return {'success': False, 'error': '{}: {}'.format(type(e).__name__, e)}


if __name__ == '__main__':
    if len(sys.argv) >= 2:
        params_file = sys.argv[1]
        try:
            with open(params_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(json.dumps({'success': False, 'error': '读取参数文件失败: {}'.format(e)}, ensure_ascii=False))
            sys.exit(1)
        to = data.get('to', '')
        subject = data.get('subject', '')
        body = data.get('body', '')
    else:
        print(json.dumps({'success': False, 'error': 'No parameters file'}, ensure_ascii=False))
        sys.exit(1)

    result = send_email(to, subject, body)
    print(json.dumps(result, ensure_ascii=False))
    # 失败必须以非 0 退出码结束，调用方不能只靠 exit code 判断
    sys.exit(0 if result.get('success') else 1)
