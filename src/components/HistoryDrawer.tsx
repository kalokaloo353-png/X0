import React, { useState } from 'react';
import { X, Search, Plus, Trash2, Pin, Edit2, Check, Download, MessageSquare } from 'lucide-react';
import { Conversation } from '../types/chat';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePin: (id: string) => void;
  isCloudSynced: boolean;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onTogglePin,
  isCloudSynced,
}) => {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  if (!isOpen) return null;

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const pinned = filtered.filter((c) => c.pinned);
  const unpinned = filtered.filter((c) => !c.pinned);

  const startEditing = (c: Conversation) => {
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const saveEditing = (id: string) => {
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const exportConversation = (c: Conversation) => {
    const markdown = `# ${c.title}\n*Exported from X0 on ${new Date().toISOString()}*\n\n` +
      c.messages
        .map((m) => `### ${m.role === 'user' ? 'User' : 'X0'}\n\n${m.content}\n`)
        .join('\n---\n\n');

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${c.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-sm h-full bg-[#080808] border-r border-neutral-900 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-neutral-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-wide text-white uppercase">History</span>
            <span className="text-[11px] text-neutral-500 font-mono">({conversations.length})</span>
            {isCloudSynced && (
              <span className="text-[10px] text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                Cloud
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action & Search Bar */}
        <div className="p-3 border-b border-neutral-900 space-y-2">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-[#0e0e0e] border border-neutral-800 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-500">
              No conversations found.
            </div>
          ) : (
            <>
              {pinned.length > 0 && (
                <div className="mb-2">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase text-neutral-500 tracking-wider">
                    Pinned
                  </div>
                  {pinned.map((c) => renderItem(c))}
                </div>
              )}

              <div>
                {pinned.length > 0 && unpinned.length > 0 && (
                  <div className="px-2 py-1 text-[10px] font-mono uppercase text-neutral-500 tracking-wider">
                    Recent
                  </div>
                )}
                {unpinned.map((c) => renderItem(c))}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="flex-1" onClick={onClose} />
    </div>
  );

  function renderItem(c: Conversation) {
    const isActive = c.id === activeId;
    const isEditing = c.id === editingId;

    return (
      <div
        key={c.id}
        className={`group relative flex items-center justify-between p-2 rounded text-xs transition-colors ${
          isActive
            ? 'bg-neutral-900 text-white border border-neutral-800'
            : 'text-neutral-300 hover:bg-neutral-950 hover:text-white border border-transparent'
        }`}
      >
        {isEditing ? (
          <div className="flex items-center gap-1 w-full">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEditing(c.id);
                if (e.key === 'Escape') setEditingId(null);
              }}
              autoFocus
              className="flex-1 bg-black border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:outline-none"
            />
            <button
              onClick={() => saveEditing(c.id)}
              className="p-1 text-white hover:bg-neutral-800 rounded"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => {
                onSelectConversation(c.id);
                onClose();
              }}
              className="flex items-center gap-2 flex-1 min-w-0 text-left pr-2"
            >
              <MessageSquare className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <div className="truncate">
                <span className="font-medium">{c.title}</span>
              </div>
            </button>

            {/* Hover Actions */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onTogglePin(c.id)}
                className={`p-1 rounded hover:bg-neutral-800 transition-colors ${
                  c.pinned ? 'text-white' : 'text-neutral-500 hover:text-white'
                }`}
                title={c.pinned ? 'Unpin' : 'Pin'}
              >
                <Pin className="w-3 h-3" />
              </button>
              <button
                onClick={() => startEditing(c)}
                className="p-1 text-neutral-500 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                title="Rename"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => exportConversation(c)}
                className="p-1 text-neutral-500 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                title="Export Markdown"
              >
                <Download className="w-3 h-3" />
              </button>
              <button
                onClick={() => onDeleteConversation(c.id)}
                className="p-1 text-neutral-500 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
};

export default HistoryDrawer;
