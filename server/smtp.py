#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import smtplib
from email.mime.text import MIMEText
from email.header import Header
import json
import os

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
        # 从环境变量读取
        username = os.getenv('SMTP_USER', 'anweiwei@wonderable.ai')
        password = os.getenv('SMTP_PASSWORD', '')
        smtp_host = os.getenv('SMTP_HOST', 'smtp.feishu.cn')
        smtp_port = int(os.getenv('SMTP_PORT', '465'))
    
    # 创建邮件
    msg = MIMEText(body, 'plain', 'utf-8')
    msg['From'] = f'安伟伟 <{username}>'
    msg['To'] = to
    msg['Subject'] = Header(subject, 'utf-8')
    
    try:
        # 发送
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
    import sys
    if len(sys.argv) < 4:
        print("Usage: python3 smtp.py <to> <subject> <body>")
        sys.exit(1)
    
    result = send_email(sys.argv[1], sys.argv[2], sys.argv[3])
    print(json.dumps(result))
