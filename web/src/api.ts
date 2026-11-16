const BASE = '/api';

// 统一请求封装：HTTP 非 2xx 时抛出带后端 error 信息的异常，
// 否则前端会把 500 响应体当成成功结果，误报"发送成功"。
async function request<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options);
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err: any = new Error(data?.error || `请求失败（HTTP ${res.status}）`);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data as T;
}

const jsonHeaders = { 'Content-Type': 'application/json' };

export interface TemplatePayload {
  name: string;
  subject: string;
  body: string;      // 纯文本正文（兼容旧数据）
  bodyHtml?: string; // 富文本正文（HTML）
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  body: string;      // 纯文本正文（兼容旧接口）
  bodyHtml?: string; // 富文本正文（HTML）
  bodyText?: string; // 纯文本降级部分
  templateId?: string;
}

export const api = {
  getTemplates: () => request('/templates'),
  createTemplate: (data: TemplatePayload) =>
    request('/templates', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(data) }),
  updateTemplate: (id: string, data: Partial<TemplatePayload>) =>
    request(`/templates/${id}`, { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(data) }),
  deleteTemplate: (id: string) =>
    request(`/templates/${id}`, { method: 'DELETE' }),
  getConfig: () => request('/config'),
  saveConfig: (data: object) =>
    request('/config', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(data) }),
  sendEmail: (data: SendEmailPayload) =>
    request('/send', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(data) }),
  getHistory: () => request('/history'),
};
