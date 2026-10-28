import { useEffect, useState } from 'react';
import { Table, Tag } from 'antd';
import { api } from '../api';

export default function HistoryPanel() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    api.getHistory().then(setRows);
  }, []);

  const columns = [
    { title: '时间', dataIndex: 'sentAt', render: (v: string) => new Date(v).toLocaleString('zh-CN') },
    { title: '收件人', dataIndex: 'to' },
    { title: '标题', dataIndex: 'subject' },
    { title: '状态', dataIndex: 'status', render: (v: string) =>
      v === 'sent' ? <Tag color="green">已发送</Tag> : <Tag color="red">失败：{v}</Tag> },
  ];

  return <Table dataSource={rows} columns={columns} rowKey="id" size="small" pagination={{ pageSize: 20 }} />;
}
