import { useEffect, useState } from 'react';
import { Button, Input, List, Modal, message, Typography } from 'antd';
import { api } from '../api';
import RichTextEditor from './RichTextEditor';
import { htmlToPlain, plainToHtml } from '../utils/mail';
const { Title } = Typography;

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;      // 纯文本（兼容旧数据 + 摘要用）
  bodyHtml?: string; // 富文本正文（HTML），新模板必有
  createdAt: string;
}

export default function TemplatePanel() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState({ name: '', subject: '', bodyHtml: '' });

  const load = () => api.getTemplates().then(setTemplates);
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', subject: '', bodyHtml: '' });
    setModalOpen(true);
  };
  const openEdit = (t: Template) => {
    setEditing(t);
    setForm({
      name: t.name,
      subject: t.subject,
      bodyHtml: t.bodyHtml || plainToHtml(t.body || ''),
    });
    setModalOpen(true);
  };

  const save = async () => {
    const bodyText = htmlToPlain(form.bodyHtml);
    if (!form.name || !form.subject || !bodyText) { message.warning('请填写完整'); return; }
    // body 存纯文本（兼容旧逻辑/摘要），bodyHtml 存富文本 HTML
    const payload = { name: form.name, subject: form.subject, body: bodyText, bodyHtml: form.bodyHtml };
    if (editing) {
      await api.updateTemplate(editing.id, payload);
      message.success('模板已更新');
    } else {
      await api.createTemplate(payload);
      message.success('模板已创建');
    }
    setModalOpen(false);
    load();
  };

  const del = async (t: Template) => {
    if (!confirm(`删除模板「${t.name}」？`)) return;
    await api.deleteTemplate(t.id);
    message.success('已删除');
    load();
  };

  const preview = (t: Template) => htmlToPlain(t.bodyHtml || '').slice(0, 60) || (t.body || '').slice(0, 60);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>邮件模板</Title>
        <Button type="primary" onClick={openCreate}>+ 新建模板</Button>
      </div>
      <List
        dataSource={templates}
        renderItem={t => (
          <List.Item
            actions={[
              <Button size="small" onClick={() => openEdit(t)}>编辑</Button>,
              <Button size="small" danger onClick={() => del(t)}>删除</Button>,
            ]}
          >
            <List.Item.Meta title={t.name} description={`${t.subject}｜${preview(t)}...`} />
          </List.Item>
        )}
      />
      <Modal
        open={modalOpen}
        title={editing ? '编辑模板' : '新建模板'}
        onOk={save}
        onCancel={() => setModalOpen(false)}
        width={700}
      >
        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="模板名称（如：节日问候）" style={{ marginBottom: 12 }} />
        <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
          placeholder="邮件标题" style={{ marginBottom: 12 }} />
        <div style={{ marginBottom: 6 }}>
          <Typography.Text type="secondary">邮件正文（支持富文本）</Typography.Text>
        </div>
        <RichTextEditor
          value={form.bodyHtml}
          onChange={html => setForm(f => ({ ...f, bodyHtml: html }))}
          placeholder="支持加粗、标题、列表、链接、颜色等富文本格式"
          minHeight={200}
        />
      </Modal>
    </div>
  );
}
