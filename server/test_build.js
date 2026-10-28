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

  // 发送并捕获原始 MIME（通过 info.message）
  const info = await transporter.sendMail({
    from: '"安伟伟" <anweiwei@wonderable.ai>',
    to: 'anweiwei@wonderable.ai',
    subject: 'Test-QP-QP',
    text: '中文测试邮件',
    encoding: 'quoted-printable',
    forceBase64: false,
  });

  console.log('Sent:', info.messageId);

  // 用 nodemailer 的 compiledMessage 获取原始内容
  const compiled = await transporter.compileMessage({
    from: '"安伟伟" <anweiwei@wonderable.ai>',
    to: 'anweiwei@wonderable.ai',
    subject: 'Test-QP-QP',
    text: '中文测试邮件',
    encoding: 'quoted-printable',
    forceBase64: false,
  });

  if (compiled && compiled.message) {
    fs.writeFileSync('C:/yoyac-work/mails-agent/server/raw_email.txt', compiled.message, 'utf-8');
    console.log('\n=== Raw MIME ===');
    console.log(compiled.message);
  }
}
test().catch(console.error);
