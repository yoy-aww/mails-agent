import nodemailer from 'nodemailer';
import fs from 'fs';

async function test() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.feishu.cn',
    port: 465,
    secure: true,
    auth: {
      user: 'anweiwei@wonderable.ai',
      pass: '2OdyDuvA14YeZxXk',
    },
  });

  const info = await transporter.sendMail({
    from: '"安伟伟" <anweiwei@wonderable.ai>',
    to: 'anweiwei@wonderable.ai',
    subject: '测试UTF-8编码修复',
    text: '这是中文测试邮件，请检查是否乱码。',
    charset: 'utf-8',
  });

  // info.message 包含原始 MIME 内容
  if (info.message) {
    fs.writeFileSync('/tmp/raw_email.txt', info.message, 'utf-8');
    console.log('Raw MIME saved to /tmp/raw_email.txt');
    console.log('\n=== First 800 chars ===');
    console.log(info.message.slice(0, 800));
  }
}

test().catch(console.error);
