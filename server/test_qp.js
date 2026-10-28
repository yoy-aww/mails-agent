import nodemailer from 'nodemailer';
import fs from 'fs';

async function test() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.feishu.cn',
    port: 465,
    secure: true,
    auth: { user: 'anweiwei@wonderable.ai', pass: '2OdyDuvA14YeZxXk' },
    debug: true,
    logger: true,
  });

  // 强制使用 quoted-printable 编码
  console.log('=== 强制 QP 编码测试 ===');
  const info = await transporter.sendMail({
    from: '"安伟伟" <anweiwei@wonderable.ai>',
    to: '17710717723@163.com',
    subject: '测试-修正编码',
    text: '这是中文测试邮件，检查是否正常显示。',
    textEncoding: 'quoted-printable',
    subjectEncoding: 'utf-8',
  });
  console.log('结果:', info.messageId);
}
test().catch(console.error);
