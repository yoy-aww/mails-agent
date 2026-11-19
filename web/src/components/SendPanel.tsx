import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Select, Spin, message, Typography } from 'antd';
import { api } from '../api';
import RichTextEditor from './RichTextEditor';
import { htmlToPlain, plainToHtml } from '../utils/mail';
const { Title, Text } = Typography;

export default function SendPanel() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  // 富文本正文（HTML）
  const [bodyHtml, setBodyHtml] = useState('');
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');

  useEffect(() => { api.getTemplates().then(setTemplates); }, []);

  // 纯文本降级内容：给不支持 HTML 的邮件客户端用，同时用于"是否为空"校验
  const bodyText = useMemo(() => htmlToPlain(bodyHtml), [bodyHtml]);

  const onSelect = (id: string) => {
    setSelectedId(id);
    const t = templates.find(x => x.id === id);
    if (t) {
      setSubject(t.subject);
      // 老模板存的是纯文本，新模板可能是 HTML，统一转成 HTML 交给编辑器
      setBodyHtml(t.bodyHtml || plainToHtml(t.body || ''));
    }
  };

  const handleSend = async () => {
    if (!to || !subject || !bodyText) { message.warning('请填写完整'); return; }
    setSending(true);
    setLastResult('');
    try {
      const res = await api.sendEmail({
        to,
        subject,
        body: bodyText,          // 兼容旧字段：纯文本
        bodyHtml,                // 富文本正文（HTML）
        bodyText,                // 纯文本降级部分
        templateId: selectedId,
      });
      if (res?.deduped) {
        // 后端 30 秒去重命中：没真正发送，提醒用户不要频繁发送
        setLastResult('⚠️ ' + (res.message || '30秒内已发送过相同主题，已跳过'));
        message.warning(res.message || '30秒内已向该邮箱发送过相同主题，已跳过重复发送');
      } else {
        setLastResult('✅ 发送成功');
        message.success('邮件已发送');
      }
    } catch (err: any) {
      setLastResult('❌ 发送失败：' + (err?.message || String(err)));
      message.error('发送失败：' + (err?.message || ''));
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
      <RichTextEditor
        value={bodyHtml}
        onChange={setBodyHtml}
        placeholder="支持加粗、标题、列表、链接、颜色等富文本格式；粘贴内容会自动转为纯文本以保证兼容性"
        minHeight={220}
      />
      <Text type="secondary" style={{ display: 'block', marginTop: 4, marginBottom: 16 }}>
        共 {bodyText.length} 字
      </Text>

      <Button type="primary" size="large" block onClick={handleSend} disabled={sending}>
        {sending ? <Spin size="small" /> : '📤 发送'}
      </Button>

      {lastResult && <Text style={{ marginTop: 12, display: 'block' }}>{lastResult}</Text>}
    </div>
  );
}
