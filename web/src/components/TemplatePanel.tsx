import { useEffect, useState } from 'react';
import { Button, Input, List, Modal, message, Space, Typography } from 'antd';
import { api } from '../api';
const { TextArea } = Input;
const { Title } = Typography;

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
}

export default function TemplatePanel() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState({ name: '', subject: '', body: '' });

  const load = () => api.getTemplates().then(setTemplates);
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', subject: '', body: '' }); setModalOpen(true); };
  const openEdit = (t: Template) => { setEditing(t); setForm({ name: t.name, subject: t.subject, body: t.body }); setModalOpen(true); };

  const save = async () => {
    if (!form.name || !form.subject || !form.body) { message.warning('请填写完整'); return; }
    if (editing) {
      await api.updateTemplate(editing.id, form);
      message.success('模板已更新');
    } else {
      await api.createTemplate(form);
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
            <List.Item.Meta title={t.name} description={`${t.subject}｜${t.body.slice(0, 60)}...`} />
          </List.Item>
        )}
      />
      <Modal
        open={modalOpen}
        title={editing ? '编辑模板' : '新建模板'}
        onOk={save}
        onCancel={() => setModalOpen(false)}
        width={600}
      >
        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="模板名称（如：节日问候）" style={{ marginBottom: 12 }} />
        <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
          placeholder="邮件标题" style={{ marginBottom: 12 }} />
        <TextArea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
          placeholder="邮件正文（纯文本）" rows={8} />
      </Modal>
    </div>
  );
}
