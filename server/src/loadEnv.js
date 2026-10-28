// 极简 .env 加载器（零依赖）：把 server/.env 的键值塞进 process.env（不覆盖已存在的）
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ENV_FILE = join(import.meta.dirname, '..', '.env');

if (existsSync(ENV_FILE)) {
  const lines = readFileSync(ENV_FILE, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2];
    }
  }
}
