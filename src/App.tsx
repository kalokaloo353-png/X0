import React, { useState, useEffect, useRef } from 'react';
import TopNav from './components/TopNav';
import PromptBox from './components/PromptBox';
import EmptyWorkspace from './components/EmptyWorkspace';
import ChatMessageItem from './components/ChatMessageItem';
import HistoryDrawer from './components/HistoryDrawer';
import ModelsModal from './components/ModelsModal';
import SettingsModal from './components/SettingsModal';
import AuthModal from './components/AuthModal';
import SignInPromptPopup from './components/SignInPromptPopup';
import ThinkingEffortPopover, { ThinkingLevelId, THINKING_LEVELS } from './components/ThinkingEffortPopover';
import { Conversation, ChatMessage, Attachment, AVAILABLE_MODELS, UserProfile } from './types/chat';
import { chatService } from './services/chatService';
import { authService } from './services/authService';

const STORAGE_CHATS_KEY = 'x0_conversations_v1';
const STORAGE_ACTIVE_ID_KEY = 'x0_active_chat_id_v1';
const STORAGE_MODEL_KEY = 'x0_model_v1';
const STORAGE_SYSTEM_PROMPT_KEY = 'x0_system_prompt_v1';
const STORAGE_TEMP_KEY = 'x0_temperature_v1';
const STORAGE_THINKING_LEVEL_KEY = 'x0_thinking_level_v1';

export default function App() {
  // State
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHATS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeId, setActiveId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_ACTIVE_ID_KEY);
    } catch {
      return null;
    }
  });

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MODEL_KEY);
      if (saved && saved !== 'gemini-3.1-pro-preview') {
        return saved;
      }
      return 'gemini-3.8-flash';
    } catch {
      return 'gemini-3.8-flash';
    }
  });

  const [systemPrompt, setSystemPrompt] = useState<string>(() => {
    try {
      return (
        localStorage.getItem(STORAGE_SYSTEM_PROMPT_KEY) ||
        'You are X0, an ultra-minimalist, exceptionally capable software and reasoning assistant. Provide direct, rigorous, beautifully formatted answers. Use clean Markdown for code blocks, tables, and lists. Avoid conversational filler.'
      );
    } catch {
      return 'You are X0, an ultra-minimalist, exceptionally capable software and reasoning assistant.';
    }
  });

  const [temperature, setTemperature] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TEMP_KEY);
      return saved ? parseFloat(saved) : 0.7;
    } catch {
      return 0.7;
    }
  });

  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevelId>(() => {
    try {
      return (localStorage.getItem(STORAGE_THINKING_LEVEL_KEY) as ThinkingLevelId) || 'high';
    } catch {
      return 'high';
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Modals & Drawers
  const [historyOpen, setHistoryOpen] = useState(false);
  const [modelsOpen, setModelsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [thinkingOpen, setThinkingOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Persistence to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHATS_KEY, JSON.stringify(conversations));
    } catch (e) {
      console.error('Failed to save conversations to local storage:', e);
    }
  }, [conversations]);

  useEffect(() => {
    if (activeId) {
      localStorage.setItem(STORAGE_ACTIVE_ID_KEY, activeId);
    } else {
      localStorage.removeItem(STORAGE_ACTIVE_ID_KEY);
    }
  }, [activeId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_MODEL_KEY, selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem(STORAGE_SYSTEM_PROMPT_KEY, systemPrompt);
  }, [systemPrompt]);

  useEffect(() => {
    localStorage.setItem(STORAGE_TEMP_KEY, temperature.toString());
  }, [temperature]);

  useEffect(() => {
    localStorage.setItem(STORAGE_THINKING_LEVEL_KEY, thinkingLevel);
  }, [thinkingLevel]);

  // Check auth state on initial mount
  useEffect(() => {
    authService.getCurrentUser().then((user) => {
      if (user) {
        setCurrentUser(user);
        // Load cloud conversations
        authService.fetchCloudChats().then((cloudChats) => {
          if (cloudChats.length > 0) {
            setConversations(cloudChats);
          }
        });
      }
    });
  }, []);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations, isStreaming]);

  // Current active conversation
  const currentConversation = conversations.find((c) => c.id === activeId) || null;

  // New Chat
  const handleNewChat = () => {
    if (isStreaming && abortController) {
      abortController.abort();
      setIsStreaming(false);
    }
    setActiveId(null);
  };

  // Send Message
  const handleSendMessage = async (
    text: string,
    attachments: Attachment[] = [],
    baseConversation?: Conversation
  ) => {
    if (isStreaming) return;

    let targetConv = baseConversation || currentConversation;
    let isBrandNew = false;

    // Create a new conversation if on home workspace
    if (!targetConv) {
      isBrandNew = true;
      const initialTitle = text ? text.slice(0, 42).trim() : attachments[0]?.name || 'New Conversation';
      const newConv: Conversation = {
        id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: initialTitle,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        model: selectedModel,
        systemPrompt,
        temperature,
      };
      targetConv = newConv;
    }

    const userMsgId = `msg_user_${Date.now()}`;
    const assistantMsgId = `msg_asst_${Date.now() + 1}`;

    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const assistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 1,
      model: AVAILABLE_MODELS.find((m) => m.id === selectedModel)?.name || 'X0',
      isStreaming: true,
    };

    // Filter out previous error messages from the stored history
    const cleanPriorMessages = targetConv.messages.filter((m) => !m.error);

    const updatedMessages = [...cleanPriorMessages, userMessage, assistantMessage];
    const updatedConv: Conversation = {
      ...targetConv,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };

    if (isBrandNew) {
      setConversations((prev) => [updatedConv, ...prev]);
      setActiveId(updatedConv.id);
    } else {
      setConversations((prev) =>
        prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
      );
    }

    // Initiate streaming call
    const controller = new AbortController();
    setAbortController(controller);
    setIsStreaming(true);

    let accumulatedContent = '';

    await chatService.streamChat({
      prompt: text,
      history: cleanPriorMessages,
      model: selectedModel,
      attachments,
      systemInstruction: systemPrompt,
      temperature,
      thinkingLevel,
      signal: controller.signal,
      onChunk: (chunk: string) => {
        accumulatedContent += chunk;
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== updatedConv.id) return c;
            return {
              ...c,
              updatedAt: Date.now(),
              messages: c.messages.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: accumulatedContent, isStreaming: true }
                  : m
              ),
            };
          })
        );
      },
      onError: (err: string) => {
        setIsStreaming(false);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== updatedConv.id) return c;
            return {
              ...c,
              updatedAt: Date.now(),
              messages: c.messages.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: err,
                      isStreaming: false,
                      error: true,
                    }
                  : m
              ),
            };
          })
        );
      },
      onDone: () => {
        setIsStreaming(false);
        setConversations((prev) => {
          const next = prev.map((c) => {
            if (c.id !== updatedConv.id) return c;
            const finalizedConv = {
              ...c,
              updatedAt: Date.now(),
              messages: c.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, isStreaming: false } : m
              ),
            };
            // Persist to cloud if user is signed in
            if (currentUser) {
              authService.saveChat(finalizedConv);
            }
            return finalizedConv;
          });
          return next;
        });
      },
    });
  };

  // Stop Streaming
  const handleStopStreaming = () => {
    if (abortController) {
      abortController.abort();
    }
    setIsStreaming(false);
    if (activeId) {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeId) return c;
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.isStreaming ? { ...m, isStreaming: false } : m
            ),
          };
        })
      );
    }
  };

  // Retry last assistant message
  const handleRetry = () => {
    if (!currentConversation || currentConversation.messages.length === 0) return;
    const messages = currentConversation.messages;

    // Find the last user message
    let lastUserIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserIdx = i;
        break;
      }
    }
    if (lastUserIdx === -1) return;

    const lastUserMsg = messages[lastUserIdx];
    // Keep clean messages before this user message
    const priorMessages = messages.slice(0, lastUserIdx).filter((m) => !m.error);

    const baseConv: Conversation = {
      ...currentConversation,
      messages: priorMessages,
    };

    setConversations((prev) =>
      prev.map((c) => (c.id === baseConv.id ? baseConv : c))
    );

    handleSendMessage(lastUserMsg.content, lastUserMsg.attachments || [], baseConv);
  };

  // Conversation Management Handlers
  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
    }
    if (currentUser) {
      authService.deleteChat(id);
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, title: newTitle, updatedAt: Date.now() };
        if (currentUser) authService.saveChat(updated);
        return updated;
      })
    );
  };

  const handleTogglePin = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, pinned: !c.pinned, updatedAt: Date.now() };
        if (currentUser) authService.saveChat(updated);
        return updated;
      })
    );
  };

  const handleClearAllChats = () => {
    setConversations([]);
    setActiveId(null);
    localStorage.removeItem(STORAGE_CHATS_KEY);
    localStorage.removeItem(STORAGE_ACTIVE_ID_KEY);
  };

  const handleExportAllChats = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(conversations, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `x0_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const currentModelInfo = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col antialiased selection:bg-white selection:text-black">
      {/* Top Navigation */}
      <TopNav
        onNewChat={handleNewChat}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenModels={() => setModelsOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenThinking={() => setThinkingOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
        currentUser={currentUser}
        currentModelName={currentModelInfo.name}
        thinkingLevelName={THINKING_LEVELS.find((l) => l.id === thinkingLevel)?.name || 'High'}
        hasUnsavedLocalChats={!currentUser && conversations.length > 0}
      />

      {/* Main Workspace Canvas */}
      <main className="flex-1 flex flex-col justify-between max-w-4xl w-full mx-auto pb-4 sm:pb-6">
        {currentConversation && currentConversation.messages.length > 0 ? (
          // Active Chat Thread
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:py-8 space-y-2">
            {currentConversation.messages.map((message, index) => {
              const isLastAssistant =
                message.role === 'assistant' &&
                index === currentConversation.messages.length - 1;

              return (
                <ChatMessageItem
                  key={message.id}
                  message={message}
                  onRetry={handleRetry}
                  isLastAssistant={isLastAssistant && !isStreaming}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          // Empty State Spacious Workspace
          <EmptyWorkspace
            onSelectPrompt={(prompt) => handleSendMessage(prompt)}
            onOpenAuth={() => setAuthOpen(true)}
            isLoggedIn={Boolean(currentUser)}
          />
        )}

        {/* Bottom Prompt Box */}
        <div className="w-full pt-2">
          <PromptBox
            onSendMessage={handleSendMessage}
            onStopStreaming={handleStopStreaming}
            isStreaming={isStreaming}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </div>
      </main>

      {/* History Slide-Over Drawer */}
      <HistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={(id) => setActiveId(id)}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePin={handleTogglePin}
        isCloudSynced={Boolean(currentUser)}
      />

      {/* Models Modal */}
      <ModelsModal
        isOpen={modelsOpen}
        onClose={() => setModelsOpen(false)}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        systemPrompt={systemPrompt}
        onSaveSystemPrompt={setSystemPrompt}
        temperature={temperature}
        onSaveTemperature={setTemperature}
        onClearAllChats={handleClearAllChats}
        onExportAllChats={handleExportAllChats}
      />

      {/* Thinking Effort Popover */}
      <ThinkingEffortPopover
        isOpen={thinkingOpen}
        onClose={() => setThinkingOpen(false)}
        currentLevel={thinkingLevel}
        onChangeLevel={setThinkingLevel}
      />

      {/* Authentication & Cloud Sync Modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        localChats={conversations}
        onChatsSynced={(synced) => {
          setConversations(synced);
          if (synced.length > 0 && !activeId) {
            setActiveId(synced[0].id);
          }
        }}
      />

      {/* Non-intrusive floating Sign In popup for unauthenticated sessions */}
      <SignInPromptPopup
        currentUser={currentUser}
        onOpenAuth={() => setAuthOpen(true)}
        messageCount={conversations.reduce((acc, c) => acc + c.messages.length, 0)}
      />
    </div>
  );
}
