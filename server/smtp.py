#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import smtplib
from email.mime.text import MIMEText
from email.header import Header
import json
import os
import sys
import base64

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
    
    # 创建邮件 - 使用 UTF-8 编码
    msg = MIMEText(body, 'plain', 'utf-8')
    
    # 编码发件人名称
    sender_name = base64.b64encode('安伟伟'.encode('utf-8')).decode('utf-8')
    msg['From'] = '=?UTF-8?B?{}?= <{}>'.format(sender_name, username)
    msg['To'] = to
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
    # 从临时文件读取参数（避免命令行编码问题）
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
