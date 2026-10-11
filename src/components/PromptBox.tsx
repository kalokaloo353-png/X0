import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Square, Paperclip, X, FileText, Image as ImageIcon, Sliders, Check } from 'lucide-react';
import { Attachment, AVAILABLE_MODELS } from '../types/chat';

interface PromptBoxProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  onStopStreaming: () => void;
  isStreaming: boolean;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  onOpenSettings: () => void;
  disabled?: boolean;
}

export const PromptBox: React.FC<PromptBoxProps> = ({
  onSendMessage,
  onStopStreaming,
  isStreaming,
  selectedModel,
  onSelectModel,
  onOpenSettings,
  disabled = false,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  // Auto resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 24), 200)}px`;
    }
  }, [input]);

  // Click outside model menu listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setShowModelMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (isStreaming) {
      onStopStreaming();
      return;
    }

    const trimmed = input.trim();
    if (!trimmed && attachments.length === 0) return;

    onSendMessage(trimmed, attachments);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result as string;
        const newAtt: Attachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          type: file.type || 'text/plain',
          size: file.size,
          dataUrl: isImage ? result : undefined,
          textPreview: !isImage ? result.substring(0, 4000) : undefined,
        };
        setAttachments((prev) => [...prev, newAtt]);
      };

      if (isImage) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const activeModelInfo = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      {/* Container with dark surface and thin gray border */}
      <div className="relative bg-[#0d0d0d] border border-neutral-800 hover:border-neutral-700 focus-within:border-neutral-600 rounded-xl transition-colors shadow-2xl p-3">
        {/* Attachment Badges Preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 pb-2 border-b border-neutral-900">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-300"
              >
                {att.dataUrl ? (
                  <ImageIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                )}
                <span className="max-w-[140px] truncate">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="p-0.5 text-neutral-500 hover:text-white rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Input Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask X0 anything..."
          rows={1}
          disabled={disabled}
          className="w-full bg-transparent text-white placeholder-neutral-500 text-[15px] focus:outline-none resize-none px-1 py-1 max-h-48 leading-relaxed"
        />

        {/* Bottom Action Controls */}
        <div className="flex items-center justify-between pt-2 mt-1 border-t border-neutral-900/60">
          {/* Left Controls: File Attachment, Model Selector, Settings */}
          <div className="flex items-center gap-1 relative" ref={modelMenuRef}>
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              className="hidden"
            />

            {/* Attach File Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg transition-colors"
              title="Attach document or image"
              disabled={disabled}
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Model Selector Dropdown Trigger */}
            <button
              type="button"
              onClick={() => setShowModelMenu(!showModelMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 rounded-md transition-all"
              title="Select AI model"
            >
              <span>{activeModelInfo.name}</span>
              <span className="text-[10px] text-neutral-500 font-mono">▾</span>
            </button>

            {/* Model Selector Popup Menu */}
            {showModelMenu && (
              <div className="absolute left-0 bottom-full mb-2 w-72 bg-[#0c0c0c] border border-neutral-800 rounded-lg shadow-2xl py-1.5 z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider uppercase text-neutral-500 border-b border-neutral-900">
                  Select Model
                </div>
                {AVAILABLE_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onSelectModel(model.id);
                      setShowModelMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-neutral-900 transition-colors ${
                      selectedModel === model.id ? 'text-white bg-neutral-900/60' : 'text-neutral-400'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-neutral-200">{model.name}</div>
                      <div className="text-[11px] text-neutral-500">{model.tagline}</div>
                    </div>
                    {selectedModel === model.id && (
                      <Check className="w-3.5 h-3.5 text-white shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Settings Quick Access */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg transition-colors"
              title="Model tuning & settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>

          {/* Right Control: Send Arrow / Stop Button */}
          <div className="flex items-center">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-200 text-black hover:bg-white transition-all"
                title="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={disabled || (!input.trim() && attachments.length === 0)}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                  input.trim() || attachments.length > 0
                    ? 'bg-white text-black hover:bg-neutral-200 cursor-pointer'
                    : 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
                }`}
                title="Send message (Enter)"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="text-center mt-2">
        <span className="text-[11px] text-neutral-600 select-none">
          X0 may provide inaccurate info. Verify important code & facts.
        </span>
      </div>
    </div>
  );
};

export default PromptBox;
