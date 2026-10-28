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

  // 尝试不同的编码方式
  console.log('=== 测试 1: quoted-printable + UTF-8 ===');
  const info1 = await transporter.sendMail({
    from: '"安伟伟" <anweiwei@wonderable.ai>',
    to: '17710717723@163.com',
    subject: '测试-QP编码',
    text: '这是中文测试邮件，检查是否正常显示。',
    charset: 'utf-8',
    encoding: 'quoted-printable',
  });
  console.log('QP 结果:', info1.messageId);

  console.log('\n=== 测试 2: base64 + 明确 Content-Type ===');
  const info2 = await transporter.sendMail({
    from: '"安伟伟" <anweiwei@wonderable.ai>',
    to: '17710717723@163.com',
    subject: '测试-Base64编码',
    text: '这是中文测试邮件，检查是否正常显示。',
    charset: 'utf-8',
    forceBase64: true,
  });
  console.log('Base64 结果:', info2.messageId);
}
test().catch(console.error);
