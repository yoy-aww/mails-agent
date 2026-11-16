import { useEffect, useRef, useState } from 'react';
import { Button, Space, Tooltip } from 'antd';

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

interface ToolbarItem {
  key: string;
  label: string;
  title: string;
  cmd: string;
  arg?: string;
}

interface ToolbarGroup {
  items: ToolbarItem[];
}

const GROUPS: ToolbarGroup[] = [
  {
    items: [
      { key: 'bold', label: 'B', title: '加粗 (Ctrl+B)', cmd: 'bold' },
      { key: 'italic', label: 'I', title: '斜体 (Ctrl+I)', cmd: 'italic' },
      { key: 'underline', label: 'U', title: '下划线 (Ctrl+U)', cmd: 'underline' },
      { key: 'strikeThrough', label: 'S', title: '删除线', cmd: 'strikeThrough' },
    ],
  },
  {
    items: [
      { key: 'h2', label: 'H2', title: '二级标题', cmd: 'formatBlock', arg: 'H2' },
      { key: 'h3', label: 'H3', title: '三级标题', cmd: 'formatBlock', arg: 'H3' },
      { key: 'p', label: '正文', title: '正文段落', cmd: 'formatBlock', arg: 'P' },
    ],
  },
  {
    items: [
      { key: 'insertUnorderedList', label: '• 列表', title: '无序列表', cmd: 'insertUnorderedList' },
      { key: 'insertOrderedList', label: '1. 列表', title: '有序列表', cmd: 'insertOrderedList' },
      { key: 'formatBlock-blockquote', label: '❝ 引用', title: '引用块', cmd: 'formatBlock', arg: 'BLOCKQUOTE' },
      { key: 'formatBlock-pre', label: '</>', title: '代码块', cmd: 'formatBlock', arg: 'PRE' },
    ],
  },
  {
    items: [
      { key: 'justifyLeft', label: '⇤', title: '左对齐', cmd: 'justifyLeft' },
      { key: 'justifyCenter', label: '⇔', title: '居中', cmd: 'justifyCenter' },
      { key: 'justifyRight', label: '⇥', title: '右对齐', cmd: 'justifyRight' },
    ],
  },
  {
    items: [
      { key: 'foreColor', label: '🖍 颜色', title: '文字颜色', cmd: 'foreColor', arg: '#1677ff' },
      { key: 'hiliteColor', label: '🖌 高亮', title: '背景高亮', cmd: 'hiliteColor', arg: '#fff2a8' },
      { key: 'createLink', label: '🔗 链接', title: '插入链接', cmd: 'createLink' },
      { key: 'insertHorizontalRule', label: '—', title: '分割线', cmd: 'insertHorizontalRule' },
    ],
  },
];

// execCommand 已废弃但仍是唯一无依赖的富文本命令接口，各主流浏览器均支持
// TS 的 lib.dom 只声明了两参数重载，这里显式取 any 调用第三个参数（value）
function exec(cmd: string, arg?: string): boolean {
  try {
    return (document.execCommand as any)(cmd, false, arg);
  } catch {
    return false;
  }
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = '请输入邮件正文…',
  minHeight = 240,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  // 记录编辑器内部当前 HTML，避免父组件回写时覆盖用户正在输入的内容
  const innerRef = useRef<string>('');
  const [active, setActive] = useState<Record<string, boolean>>({});

  // 外部值同步：模板切换等场景下重置编辑器内容
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (value !== innerRef.current) {
      el.innerHTML = value || '';
      innerRef.current = value || '';
    }
  }, [value]);

  const emit = () => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    innerRef.current = html;
    onChange(html);
  };

  const refreshActive = () => {
    const next: Record<string, boolean> = {};
    for (const group of GROUPS) {
      for (const item of group.items) {
        try {
          next[item.key] = document.queryCommandState(item.cmd);
        } catch {
          next[item.key] = false;
        }
      }
    }
    setActive(next);
  };

  const run = (cmd: string, arg?: string) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    if (cmd === 'createLink') {
      const url = window.prompt('请输入链接地址（留空则移除链接）', 'https://');
      if (url === null) return;
      if (!url.trim()) {
        exec('unlink');
      } else {
        exec('createLink', url.trim());
      }
    } else {
      exec(cmd, arg);
    }
    emit();
    refreshActive();
  };

  const clearFormat = () => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    exec('formatBlock', 'P');
    exec('removeFormat');
    exec('unlink');
    emit();
    refreshActive();
  };

  // 粘贴一律按纯文本处理：避免从 Word/网页粘贴带入巨量内联样式，邮件体积和兼容性都更好
  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData('text/plain');
    if (!text) return;
    e.preventDefault();
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    lines.forEach((line, i) => {
      if (i > 0) exec('insertParagraph');
      (document.execCommand as any)('insertText', false, line);
    });
    emit();
  };

  const onKeyUp = () => refreshActive();
  const onMouseUp = () => refreshActive();

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden', marginTop: 6 }}>
      <div
        style={{
          padding: '6px 8px',
          borderBottom: '1px solid #f0f0f0',
          background: '#fafafa',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        {GROUPS.map((group, gi) => (
          <Space.Compact key={gi}>
            {group.items.map(item => (
              <Tooltip title={item.title} key={item.key}>
                <Button
                  size="small"
                  type={active[item.key] ? 'primary' : 'default'}
                  style={{ fontWeight: item.key === 'bold' ? 700 : undefined }}
                  // preventDefault 避免按钮抢焦点导致选区丢失
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => run(item.cmd, item.arg)}
                >
                  {item.label}
                </Button>
              </Tooltip>
            ))}
          </Space.Compact>
        ))}
        <Tooltip title="清除所有格式">
          <Button
            size="small"
            onMouseDown={e => e.preventDefault()}
            onClick={clearFormat}
          >
            🧹 清格式
          </Button>
        </Tooltip>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        onPaste={onPaste}
        onKeyUp={onKeyUp}
        onMouseUp={onMouseUp}
        data-placeholder={placeholder}
        style={{
          minHeight,
          padding: '12px 14px',
          outline: 'none',
          lineHeight: 1.7,
          fontSize: 14,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
        className="mails-rich-editor"
      />
    </div>
  );
}
