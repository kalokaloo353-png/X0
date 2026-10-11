import React, { useMemo, useState } from 'react';
import { marked } from 'marked';
import { Check, Copy } from 'lucide-react';

interface MarkdownViewProps {
  content: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Configure marked for clean security and formatting
  const html = useMemo(() => {
    marked.setOptions({
      gfm: true,
      breaks: true,
    });
    return marked.parse(content) as string;
  }, [content]);

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="prose prose-invert max-w-none text-[15px] leading-relaxed text-neutral-200">
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        className="markdown-body space-y-3"
      />
    </div>
  );
};

export default MarkdownView;
