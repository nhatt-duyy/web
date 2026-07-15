import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Render nội dung Markdown (CMS) với style đồng bộ design system.
// Component server-safe (không dùng hook), dùng trong blog / trang tĩnh.
export default function Markdown({ content }: { content: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
