import React, { useState } from 'react';
import { X, Cloud, Lock, Mail, User as UserIcon, LogOut, CheckCircle2, ArrowRight } from 'lucide-react';
import { authService } from '../services/authService';
import { UserProfile, Conversation } from '../types/chat';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserChange: (user: UserProfile | null) => void;
  localChats: Conversation[];
  onChatsSynced: (syncedChats: Conversation[]) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  localChats,
  onChatsSynced,
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const result = await authService.login(email, password);
        onUserChange(result.user);
        // Automatically sync any offline chats to the newly signed-in account
        if (localChats.length > 0) {
          const synced = await authService.syncLocalChats(localChats);
          onChatsSynced(synced);
        } else {
          const cloudChats = await authService.fetchCloudChats();
          if (cloudChats.length > 0) {
            onChatsSynced(cloudChats);
          }
        }
        onClose();
      } else {
        const result = await authService.register(email, password, name);
        onUserChange(result.user);
        if (localChats.length > 0) {
          const synced = await authService.syncLocalChats(localChats);
          onChatsSynced(synced);
        }
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    onUserChange(null);
    onClose();
  };

  const handleManualSync = async () => {
    setSyncLoading(true);
    setSyncSuccess(false);
    try {
      const synced = await authService.syncLocalChats(localChats);
      onChatsSynced(synced);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to sync with cloud.');
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#090909] border border-neutral-800 rounded-xl shadow-2xl p-6 relative">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-900">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-white" />
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
              {currentUser ? 'X0 Cloud Account' : mode === 'signin' ? 'Sign In to X0' : 'Create X0 Account'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {currentUser ? (
          // Logged In Overview
          <div className="py-5 space-y-4">
            <div className="p-4 bg-[#0e0e0e] border border-neutral-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white font-semibold">
                  {currentUser.name?.[0]?.toUpperCase() || currentUser.email[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white truncate">
                    {currentUser.name || 'X0 User'}
                  </div>
                  <div className="text-xs text-neutral-400 truncate">
                    {currentUser.email}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-neutral-900/80 flex items-center justify-between text-xs text-neutral-500">
                <span>Member since</span>
                <span className="font-mono">
                  {new Date(currentUser.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Sync Controls */}
            <div className="p-4 bg-[#0e0e0e] border border-neutral-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Cross-Device Synchronization</div>
                  <div className="text-[11px] text-neutral-400">
                    {localChats.length} conversation{localChats.length === 1 ? '' : 's'} in active session.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={syncLoading}
                  className="px-3 py-1.5 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 rounded transition-colors flex items-center gap-1.5"
                >
                  {syncLoading ? 'Syncing...' : syncSuccess ? 'Synced' : 'Sync Now'}
                  {syncSuccess && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 hover:text-white hover:bg-neutral-900 rounded transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-medium text-black bg-white hover:bg-neutral-200 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          // Sign In / Register Form
          <form onSubmit={handleSubmit} className="py-4 space-y-3.5">
            <p className="text-xs text-neutral-400">
              Sign in to securely synchronize your chats, customized models, and system parameters across devices.
            </p>

            {error && (
              <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-300">
                {error}
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-300">Name</label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-[#0d0d0d] border border-neutral-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-300">Email Address</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-[#0d0d0d] border border-neutral-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-300">Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-[#0d0d0d] border border-neutral-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 text-xs font-medium text-black bg-white hover:bg-neutral-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <span>{loading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                {!loading && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'register' : 'signin');
                  setError(null);
                }}
                className="text-xs text-neutral-400 hover:text-white transition-colors"
              >
                {mode === 'signin' ? (
                  <>Don't have an account? <span className="text-white underline underline-offset-2">Register</span></>
                ) : (
                  <>Already have an account? <span className="text-white underline underline-offset-2">Sign In</span></>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
