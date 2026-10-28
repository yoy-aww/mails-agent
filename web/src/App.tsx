import { Layout, ConfigProvider, Tabs } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import TemplatePanel from './components/TemplatePanel';
import SendPanel from './components/SendPanel';
import SettingsPanel from './components/SettingsPanel';
import HistoryPanel from './components/HistoryPanel';

const { Header, Content } = Layout;

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ background: '#001529', color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center' }}>
          📧 邮件发送器
        </Header>
        <Content style={{ padding: 24, maxWidth: 900, margin: '0 auto', width: '100%' }}>
          <Tabs items={[
            { key: 'send', label: '📤 发送邮件', children: <SendPanel /> },
            { key: 'templates', label: '📋 模板管理', children: <TemplatePanel /> },
            { key: 'settings', label: '⚙️ 设置', children: <SettingsPanel /> },
            { key: 'history', label: '📜 发送历史', children: <HistoryPanel /> },
          ]} />
        </Content>
      </Layout>
    </ConfigProvider>
  );
}
