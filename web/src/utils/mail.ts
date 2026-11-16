// 邮件正文格式转换工具（纯文本 <-> HTML）

const AMP = String.fromCharCode(38);
const LT = String.fromCharCode(60);
const GT = String.fromCharCode(62);
const QUOT = String.fromCharCode(34);
const APOS = String.fromCharCode(39);

const ENTITY_AMP = AMP + 'amp;';
const ENTITY_LT = AMP + 'lt;';
const ENTITY_GT = AMP + 'gt;';
const ENTITY_QUOT = AMP + 'quot;';
const ENTITY_APOS = AMP + '#39;';
const ENTITY_NBSP = AMP + 'nbsp;';

/** HTML 转义，用于把纯文本安全地包进 HTML */
export function escapeHtml(text: string): string {
  return (text || '')
    .split(AMP).join(ENTITY_AMP)
    .split(LT).join(ENTITY_LT)
    .split(GT).join(ENTITY_GT)
    .split(QUOT).join(ENTITY_QUOT)
    .split(APOS).join(ENTITY_APOS);
}

/** 纯文本 -> HTML 段落（用于把历史模板里的纯文本正文塞进富文本编辑器） */
export function plainToHtml(text: string): string {
  const raw = (text || '').replace(/\r\n/g, '\n');
  if (!raw.trim()) return '';
  return raw
    .split(/\n{2,}/)
    .map(block =>
      block
        .split('\n')
        .map(line => escapeHtml(line))
        .join('<br/>')
    )
    .map(block => '<p>' + block + '</p>')
    .join('');
}

/** HTML -> 纯文本（用于发送时的 text/plain 降级部分，以及模板列表摘要） */
export function htmlToPlain(html: string): string {
  if (!html) return '';
  // 浏览器环境用 DOM 解析最准确
  if (typeof document !== 'undefined') {
    const el = document.createElement('div');
    el.innerHTML = html;
    el.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    el.querySelectorAll('p,div,li,h1,h2,h3,h4,h5,h6,blockquote,pre,tr').forEach(node => {
      node.appendChild(document.createTextNode('\n'));
    });
    return (el.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
  }
  // 兜底（Node 环境）正则清洗
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|blockquote|pre|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .split(ENTITY_NBSP).join(' ')
    .split(ENTITY_AMP).join(AMP)
    .split(ENTITY_LT).join(LT)
    .split(ENTITY_GT).join(GT)
    .split(ENTITY_QUOT).join(QUOT)
    .split(ENTITY_APOS).join(APOS)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** 判断一段内容是否看起来像 HTML（用于兼容老的纯文本接口调用） */
export function looksLikeHtml(text: string): boolean {
  return /<\/?(p|div|br|b|i|u|strong|em|span|ul|ol|li|h[1-6]|a|table|tr|td|blockquote|pre|font|img)\b[^>]*>/i.test(
    text || ''
  );
}
