// 启动时确保 data/config.json 存在；若缺失（如新部署环境），从 process.env（.env）生成一份。
// 这样凭据源头统一为 gitignored 的 .env，config.json 只是运行时派生物。
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(import.meta.dirname, '..', 'data');
const CFG = join(DATA_DIR, 'config.json');

if (!existsSync(CFG)) {
  mkdirSync(DATA_DIR, { recursive: true });
  const cfg = {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
  };
  if (cfg.host && cfg.user && cfg.password) {
    writeFileSync(CFG, JSON.stringify(cfg, null, 2) + '\n', 'utf-8');
    console.log('[config] 从 .env 生成 data/config.json');
  } else {
    console.warn('[config] 缺少 SMTP 凭据（.env 未配 SMTP_HOST/SMTP_USER/SMTP_PASSWORD），跳过生成');
  }
}
