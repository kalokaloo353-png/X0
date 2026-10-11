import React, { useState } from 'react';
import { Copy, Check, RotateCcw, AlertTriangle, FileText, Image as ImageIcon } from 'lucide-react';
import MarkdownView from './MarkdownView';
import X0Logo from './X0Logo';
import { ChatMessage } from '../types/chat';

interface ChatMessageItemProps {
  message: ChatMessage;
  onRetry?: () => void;
  isLastAssistant?: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onRetry,
  isLastAssistant,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[85%] sm:max-w-[75%]">
          {/* User Attachments Preview */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap justify-end gap-2 mb-2">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-300"
                >
                  {att.dataUrl ? (
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      className="w-4 h-4 object-cover rounded"
                    />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                  <span className="max-w-[150px] truncate">{att.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* User Message Text */}
          <div className="bg-[#121212] border border-neutral-800 rounded-2xl rounded-tr-sm px-4 py-3 text-white text-[15px] leading-relaxed break-words">
            {message.content}
          </div>
          <div className="text-[11px] text-neutral-600 text-right mt-1 font-mono">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  }

  // Assistant Message
  return (
    <div className="flex gap-3 sm:gap-4 mb-6 group">
      {/* Brand Monogram Avatar */}
      <div className="shrink-0 pt-0.5">
        <div className="w-7 h-7 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center text-white">
          <X0Logo className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Message Content Container */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white">X0</span>
            {message.model && (
              <span className="text-[10px] text-neutral-500 font-mono">
                {message.model}
              </span>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-1 text-neutral-500 hover:text-white rounded hover:bg-neutral-900 transition-colors"
              title="Copy answer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-neutral-300" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {isLastAssistant && onRetry && (
              <button
                onClick={onRetry}
                className="p-1 text-neutral-500 hover:text-white rounded hover:bg-neutral-900 transition-colors"
                title="Regenerate response"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Error Notification */}
        {message.error ? (
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-white mb-0.5">Response error</div>
              <p className="text-neutral-400 leading-relaxed">{message.content}</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-2 text-xs text-white underline underline-offset-2 hover:text-neutral-300"
                >
                  Retry request
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="relative">
            <MarkdownView content={message.content} />
            {message.isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-1 bg-white animate-pulse align-middle" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessageItem;
