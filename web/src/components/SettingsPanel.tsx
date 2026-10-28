import { useEffect, useState } from 'react';
import { Button, Input, message, Form, Tooltip } from 'antd';
import { api } from '../api';

const HELP = {
  host: 'SMTP 服务器地址，如 smtp.feishu.cn、smtp.qq.com',
  port: '465（SSL）或 587（STARTTLS）',
  user: '发件邮箱地址',
  password: '邮箱授权码（不是登录密码），在飞书邮箱设置中生成',
};

export default function SettingsPanel() {
  const [form, setForm] = useState({ host: '', port: 465, user: '', password: '' });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.getConfig().then(cfg => {
      setForm({ host: cfg.host, port: cfg.port, user: cfg.user, password: '' });
      setLoaded(true);
    });
  }, []);

  const save = async () => {
    if (!form.host || !form.user || !form.password) { message.warning('请填写完整（密码必填）'); return; }
    await api.saveConfig(form);
    message.success('SMTP 配置已保存');
  };

  if (!loaded) return <div>加载中...</div>;

  return (
    <div style={{ maxWidth: 500 }}>
      <Form labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
        <Form.Item label="SMTP 服务器" extra={<Tooltip title={HELP.host}>{HELP.host}</Tooltip>}>
          <Input value={form.host} onChange={e => setForm(f => ({ ...f, host: e.target.value }))} />
        </Form.Item>
        <Form.Item label="端口" extra={HELP.port}>
          <Input type="number" value={form.port} onChange={e => setForm(f => ({ ...f, port: Number(e.target.value) }))} />
        </Form.Item>
        <Form.Item label="发件邮箱" extra={HELP.user}>
          <Input value={form.user} onChange={e => setForm(f => ({ ...f, user: e.target.value }))} />
        </Form.Item>
        <Form.Item label="授权码" extra={HELP.password}>
          <Input.Password value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 6 }}>
          <Button type="primary" onClick={save}>保存配置</Button>
        </Form.Item>
      </Form>
    </div>
  );
}
