import React from 'react';
import { Plus, History, Cpu, Settings, User, Cloud, LogOut } from 'lucide-react';
import X0Logo from './X0Logo';
import { UserProfile } from '../types/chat';

interface TopNavProps {
  onNewChat: () => void;
  onOpenHistory: () => void;
  onOpenModels: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  currentUser: UserProfile | null;
  currentModelName: string;
  hasUnsavedLocalChats?: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  onNewChat,
  onOpenHistory,
  onOpenModels,
  onOpenSettings,
  onOpenAuth,
  currentUser,
  currentModelName,
  hasUnsavedLocalChats,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-black border-b border-neutral-900 px-4 md:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: MY AI Banner & X0 Brand Logo */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-bold tracking-[0.25em] text-white uppercase select-none">
              MY AI
            </span>
            <span className="text-neutral-700 select-none">/</span>
            <button
              onClick={onNewChat}
              className="flex items-center gap-2 group hover:opacity-85 transition-opacity focus:outline-none"
              title="X0 Workspace"
            >
              <div className="text-white w-7 h-5 flex items-center justify-center">
                <X0Logo className="w-7 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold tracking-wider text-white">
                X0
              </span>
            </button>
          </div>
        </div>

        {/* Center: Primary Navigation Controls */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 rounded transition-all whitespace-nowrap"
            title="Start a new conversation"
          >
            <Plus className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">New Chat</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 rounded transition-all whitespace-nowrap"
            title="View chat history"
          >
            <History className="w-3.5 h-3.5 text-neutral-400" />
            <span>History</span>
          </button>

          <button
            onClick={onOpenModels}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 rounded transition-all whitespace-nowrap"
            title="Choose AI model"
          >
            <Cpu className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden md:inline">Models</span>
            <span className="hidden lg:inline text-[10px] text-neutral-500 font-mono">
              ({currentModelName})
            </span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 rounded transition-all whitespace-nowrap"
            title="Workspace preferences"
          >
            <Settings className="w-3.5 h-3.5 text-neutral-400" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Right: User Authentication & Sync Status */}
        <div className="flex items-center gap-2 shrink-0">
          {currentUser ? (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded transition-all"
              title={`Logged in as ${currentUser.email}. Click to manage sync.`}
            >
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="max-w-[100px] sm:max-w-[140px] truncate">
                {currentUser.name || currentUser.email}
              </span>
              <Cloud className="w-3.5 h-3.5 text-neutral-400 hidden sm:inline" />
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded transition-all whitespace-nowrap"
              title="Sign in to sync your conversations across devices"
            >
              <User className="w-3.5 h-3.5 text-neutral-400" />
              <span>Sign In</span>
              {hasUnsavedLocalChats && (
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" title="Unsynced local chats" />
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;
