import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import './loadEnv.js'; // 必须在业务模块之前加载 .env
import './ensureConfig.js'; // 启动时若 config.json 缺失则从 .env 生成
import { initConfigRoutes } from './routes/config.js';
import { initTemplatesRoutes } from './routes/templates.js';
import { initEmailRoutes } from './routes/email.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

initConfigRoutes(app);
initTemplatesRoutes(app);
initEmailRoutes(app);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
