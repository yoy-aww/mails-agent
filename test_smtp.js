const nodemailer = require('nodemailer');

async function test() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.feishu.cn',
    port: 465,
    secure: true,
    auth: {
      user: 'anweiwei@wonderable.ai',
      pass: '2OdyDuvA14YeZxXk',
    },
    debug: true,
    logger: true,
  });

  const info = await transporter.sendMail({
    from: '"安伟伟" <anweiwei@wonderable.ai>',
    to: 'anweiwei@wonderable.ai',
    subject: '测试UTF-8编码修复',
    text: '这是中文测试邮件，请检查是否乱码。',
    charset: 'utf-8',
  });

  console.log('Message sent:', info.messageId);
}

test().catch(console.error);
