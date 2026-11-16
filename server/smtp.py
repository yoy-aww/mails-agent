#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import smtplib
import html as html_mod
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
import json
import os
import re
import sys

# 配置文件路径：相对脚本自身目录（不依赖 cwd）
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SMTP_CONFIG_FILE = os.path.join(SCRIPT_DIR, 'data', 'config.json')
SMTP_TIMEOUT = 30

# 富文本邮件外层容器样式：邮件客户端普遍不支持外部 CSS，内联样式最稳
EMAIL_WRAPPER_STYLE = (
    'font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',\'PingFang SC\','
    '\'Hiragino Sans GB\',\'Microsoft YaHei\',Arial,sans-serif;'
    'font-size:14px;line-height:1.7;color:#333;max-width:640px;'
)


def load_config():
    try:
        with open(SMTP_CONFIG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}


def html_to_plain(html):
    """把 HTML 正文降级成纯文本（text/plain 备用部分），纯文本客户端也能读懂"""
    if not html:
        return ''
    text = re.sub(r'(?i)<br\s*/?>', '\n', html)
    text = re.sub(r'(?i)</(p|div|li|h[1-6]|blockquote|pre|tr)>', '\n', text)
    text = re.sub(r'(?i)<li[^>]*>', '- ', text)
    text = re.sub(r'<[^>]+>', '', text)
    # 用标准库解码 HTML 实体（避免源码里出现裸实体常量）
    text = html_mod.unescape(text).replace('\xa0', ' ')
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def looks_like_html(text):
    return bool(re.search(
        r'(?i)<\/?(p|div|br|b|i|u|strong|em|span|ul|ol|li|h[1-6]|a|table|tr|td|'
        r'blockquote|pre|font|img)\b[^>]*>', text or ''))


def wrap_html(html_content):
    """把富文本正文套一层内联样式容器。

    邮件客户端普遍不支持外部 CSS 和 <style> 块（Outlook/QQ 邮箱会直接丢弃），
    所以样式必须内联在标签上；正文本身由编辑器产出，保留原有格式。
    """
    if not html_content:
        return html_content
    return ('<div style="' + EMAIL_WRAPPER_STYLE + '">' + html_content + '</div>')


def build_message(to, subject, body, body_html=None, body_text=None, from_addr=None):
    """构造邮件对象。

    body       : 用户输入的正文（可能是纯文本，也可能是 HTML）
    body_html  : 明确的 HTML 正文（富文本编辑器输出）
    body_text  : 明确的纯文本正文（富文本编辑器降级出来的）
    """
    html_content = body_html if body_html else (body if looks_like_html(body) else None)
    text_content = body_text if body_text else html_to_plain(body)

    if html_content:
        # multipart/alternative：纯文本在前（老客户端取这个），HTML 在后（现代客户端优先取 HTML）
        msg = MIMEMultipart('alternative')
        msg.attach(MIMEText(text_content or html_to_plain(html_content), 'plain', 'utf-8'))
        msg.attach(MIMEText(wrap_html(html_content), 'html', 'utf-8'))
    else:
        msg = MIMEText(body, 'plain', 'utf-8')

    # 发件人：From 头只放裸邮箱地址（HELO 必须是纯 ASCII，带中文名会被飞书拒收）
    msg['From'] = from_addr or ''
    msg['To'] = to
    # 标题：用 Header 编码（中文 → =?utf-8?b?...? 或 qp）
    msg['Subject'] = Header(subject, 'utf-8')
    return msg


def send_email(to, subject, body, body_html=None, body_text=None, from_addr=None):
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

    msg = build_message(to, subject, body, body_html, body_text, from_addr=username)

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
        body_html = data.get('bodyHtml') or None
        body_text = data.get('bodyText') or None
    else:
        print(json.dumps({'success': False, 'error': 'No parameters file'}, ensure_ascii=False))
        sys.exit(1)

    result = send_email(to, subject, body, body_html, body_text)
    print(json.dumps(result, ensure_ascii=False))
    # 失败必须以非 0 退出码结束，调用方不能只靠 exit code 判断
    sys.exit(0 if result.get('success') else 1)
