#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import smtplib
from email.mime.text import MIMEText
from email.header import Header
from email.utils import formataddr
import json
import os
import sys

SMTP_CONFIG_FILE = 'data/config.json'

def load_config():
    try:
        with open(SMTP_CONFIG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {}

def send_email(to, subject, body):
    config = load_config()

    smtp_host = config.get('host', 'smtp.feishu.cn')
    smtp_port = config.get('port', 465)
    username = config.get('user', '')
    password = config.get('password', '')

    if not username or not password:
        username = os.getenv('SMTP_USER', 'anweiwei@wonderable.ai')
        password = os.getenv('SMTP_PASSWORD', '')
        smtp_host = os.getenv('SMTP_HOST', 'smtp.feishu.cn')
        smtp_port = int(os.getenv('SMTP_PORT', '465'))

    # 正文：MIMEText 自动选择 CTE（中文内容默认 base64），不要手动覆盖
    msg = MIMEText(body, 'plain', 'utf-8')

    # 发件人：From 头只放裸邮箱地址（HELO 必须是纯 ASCII，带中文名会被飞书拒收）
    msg['From'] = username
    msg['To'] = to

    # 标题：用 Header 编码（中文 → =?utf-8?b?...? 或 qp）
    msg['Subject'] = Header(subject, 'utf-8')

    try:
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port)
            server.starttls()

        server.login(username, password)
        server.sendmail(username, [to], msg.as_string())
        server.quit()
        return {'success': True}
    except Exception as e:
        return {'success': False, 'error': str(e)}

if __name__ == '__main__':
    if len(sys.argv) >= 2:
        params_file = sys.argv[1]
        with open(params_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        to = data.get('to', '')
        subject = data.get('subject', '')
        body = data.get('body', '')
    else:
        print(json.dumps({'success': False, 'error': 'No parameters file'}))
        sys.exit(1)

    result = send_email(to, subject, body)
    print(json.dumps(result, ensure_ascii=False))
