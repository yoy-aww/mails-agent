import nodemailer from 'nodemailer';
import fs from 'fs';

async function test() {
  // 使用 QQ SMTP（中文兼容性更好）
  const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
      user: 'anweiwei@wonderable.ai',  // 注意：如果是QQ邮箱才用这个，否则需要换成QQ邮箱账号
      pass: '你的QQ邮箱授权码',
    },
    debug: true,
    logger: true,
  });

  // 同时测试飞书 SMTP
  console.log('=== 测试 1: 飞书 SMTP ===');
  const feishu = nodemailer.createTransport({
    host: 'smtp.feishu.cn',
    port: 465,
    secure: true,
    auth: { user: 'anweiwei@wonderable.ai', pass: '2OdyDuvA14YeZxXk' },
    debug: true,
    logger: true,
  });

  const info1 = await feishu.sendMail({
    from: '"安伟伟" <anweiwei@wonderable.ai>',
    to: '17710717723@163.com',
    subject: '测试-飞书SMTP-中文',
    text: '这是中文测试邮件',
    charset: 'utf-8',
    encoding: 'quoted-printable',
  });
  console.log('飞书发送结果:', info1.messageId);

  // 尝试不同的 Content-Type 组合
  console.log('\n=== 测试 2: 带 GBK fallback ===');
  const info2 = await feishu.sendMail({
    from: '"安伟伟" <anweiwei@wonderable.ai>',
    to: '17710717723@163.com',
    subject: 'Test-GBK-Fallback',
    text: '中文测试',
    alternatives: [
      { contentType: 'text/plain; charset=gbk', content: Buffer.from('中文测试', 'binary').toString() },
      { contentType: 'text/plain; charset=utf-8', content: '中文测试' },
    ],
  });
  console.log('GBK fallback 结果:', info2.messageId);
}
test().catch(console.error);
