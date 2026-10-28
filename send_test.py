#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import smtplib
from email.mime.text import MIMEText
from email.header import Header
import sys

def send_email(to, subject, body):
    # SMTP 配置
    smtp_host = 'smtp.feishu.cn'
    smtp_port = 465
    username = 'anweiwei@wonderable.ai'
    password = '2OdyDuvA14YeZxXk'

    # 创建邮件
    msg = MIMEText(body, 'plain', 'utf-8')
    msg['From'] = f'安伟伟 <{username}>'
    msg['To'] = to
    msg['Subject'] = Header(subject, 'utf-8')

    try:
        # 发送
        server = smtplib.SMTP_SSL(smtp_host, smtp_port)
        server.login(username, password)
        server.sendmail(username, [to], msg.as_string())
        server.quit()
        print(f"SUCCESS: Email sent to {to}")
        return True
    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == '__main__':
    if len(sys.argv) < 4:
        print("Usage: python3 send_test.py <to> <subject> <body>")
        sys.exit(1)

    to = sys.argv[1]
    subject = sys.argv[2]
    body = sys.argv[3]

    send_email(to, subject, body)
