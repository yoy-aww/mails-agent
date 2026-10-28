const BASE = '/api';

export const api = {
  getTemplates: () => fetch(`${BASE}/templates`).then(r => r.json()),
  createTemplate: (data: { name: string; subject: string; body: string }) =>
    fetch(`${BASE}/templates`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  updateTemplate: (id: string, data: Partial<{ name: string; subject: string; body: string }>) =>
    fetch(`${BASE}/templates/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  deleteTemplate: (id: string) =>
    fetch(`${BASE}/templates/${id}`, { method: 'DELETE' }).then(r => r.json()),
  getConfig: () => fetch(`${BASE}/config`).then(r => r.json()),
  saveConfig: (data: object) =>
    fetch(`${BASE}/config`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  sendEmail: (data: { to: string; subject: string; body: string; templateId?: string }) =>
    fetch(`${BASE}/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  getHistory: () => fetch(`${BASE}/history`).then(r => r.json()),
};
