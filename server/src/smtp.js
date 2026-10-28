import nodemailer from 'nodemailer';
import { readJSON } from './data.js';

export async function sendEmail({ to, subject, body }) {
  const dbConfig = readJSON('config.json', null);
  // 优先用数据库配置，若为空则用环境变量（部署到服务器时用）
  const config = dbConfig || {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
  };
  if (!config?.host || !config?.password) {
    throw new Error('SMTP 配置未设置，请先在设置中保存 SMTP 信息');
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port || 465,
    secure: config.secure !== false,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });

  const info = await transporter.sendMail({
    from: `"安伟伟" <${config.user}>`,
    to,
    subject,
    text: body,
    charset: 'utf-8',
  });

  return { messageId: info.messageId, success: true };
}
