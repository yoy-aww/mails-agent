import { readJSON, writeJSON } from '../data.js';

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function initTemplatesRoutes(app) {
  // GET /api/templates
  app.get('/api/templates', (req, res) => {
    const templates = readJSON('templates.json', []);
    res.json(templates);
  });

  // POST /api/templates
  app.post('/api/templates', (req, res) => {
    const templates = readJSON('templates.json', []);
    const { name, subject, body } = req.body;
    const template = { id: genId(), name, subject, body, createdAt: new Date().toISOString() };
    templates.push(template);
    writeJSON('templates.json', templates);
    res.json({ ok: true, id: template.id });
  });

  // PUT /api/templates/:id
  app.put('/api/templates/:id', (req, res) => {
    const templates = readJSON('templates.json', []);
    const idx = templates.findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'not found' });
    templates[idx] = { ...templates[idx], ...req.body };
    writeJSON('templates.json', templates);
    res.json({ ok: true });
  });

  // DELETE /api/templates/:id
  app.delete('/api/templates/:id', (req, res) => {
    let templates = readJSON('templates.json', []);
    templates = templates.filter(t => t.id !== req.params.id);
    writeJSON('templates.json', templates);
    res.json({ ok: true });
  });
}
