import nodemailer from 'nodemailer';

async function test() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.feishu.cn',
    port: 465,
    secure: true,
    auth: { user: 'anweiwei@wonderable.ai', pass: '2OdyDuvA14YeZxXk' },
    encoding: 'utf-8',
  });

  const info = await transporter.sendMail({
    from: '"安伟伟" <anweiwei@wonderable.ai>',
    to: '17710717723@163.com',
    subject: '测试-QP编码',
    text: '这是中文测试邮件，检查是否正常显示。',
    encoding: 'utf-8',
  });
  console.log('OK', info.messageId);
}
test().catch(console.error);
