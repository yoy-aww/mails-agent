import { useEffect, useState } from 'react';
import { Button, Input, Select, Spin, message, Typography } from 'antd';
import { api } from '../api';
const { TextArea } = Input;
const { Title, Text } = Typography;

export default function SendPanel() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');

  useEffect(() => { api.getTemplates().then(setTemplates); }, []);

  const onSelect = (id: string) => {
    setSelectedId(id);
    const t = templates.find(x => x.id === id);
    if (t) { setSubject(t.subject); setBody(t.body); }
  };

  const handleSend = async () => {
    if (!to || !subject || !body) { message.warning('请填写完整'); return; }
    setSending(true);
    setLastResult('');
    try {
      const res = await api.sendEmail({ to, subject, body, templateId: selectedId });
      setLastResult('✅ 发送成功');
      message.success('邮件已发送');
    } catch (err: any) {
      setLastResult('❌ 发送失败：' + (err?.error?.message || String(err)));
      message.error('发送失败');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <Title level={4}>发送邮件</Title>

      <Text strong>1. 选择模板</Text>
      <Select
        style={{ width: '100%', marginTop: 6, marginBottom: 16 }}
        placeholder="选择模板（不选则手动填写）"
        value={selectedId}
        onChange={onSelect}
        options={templates.map(t => ({ value: t.id, label: t.name }))}
        allowClear
      />

      <Text strong>2. 收件人邮箱</Text>
      <Input value={to} onChange={e => setTo(e.target.value)}
        placeholder="recipient@example.com" style={{ marginTop: 6, marginBottom: 16 }} />

      <Text strong>3. 邮件标题</Text>
      <Input value={subject} onChange={e => setSubject(e.target.value)}
        placeholder="邮件标题" style={{ marginTop: 6, marginBottom: 16 }} />

      <Text strong>4. 邮件正文</Text>
      <TextArea value={body} onChange={e => setBody(e.target.value)}
        placeholder="邮件正文" rows={10} style={{ marginTop: 6, marginBottom: 16 }} />

      <Button type="primary" size="large" block onClick={handleSend} disabled={sending}>
        {sending ? <Spin size="small" /> : '📤 发送'}
      </Button>

      {lastResult && <Text style={{ marginTop: 12, display: 'block' }}>{lastResult}</Text>}
    </div>
  );
}
