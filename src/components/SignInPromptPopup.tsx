import React, { useState, useEffect } from 'react';
import { X, Cloud, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types/chat';

interface SignInPromptPopupProps {
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  messageCount: number;
}

export const SignInPromptPopup: React.FC<SignInPromptPopupProps> = ({
  currentUser,
  onOpenAuth,
  messageCount,
}) => {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('x0_signin_popup_dismissed') === 'true';
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('x0_signin_popup_dismissed', 'true');
  };

  // If already logged in or dismissed, don't show
  if (currentUser || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-4 sm:right-8 z-30 max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#0e0e0e] border border-neutral-800 rounded-xl p-4 shadow-2xl relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 text-neutral-500 hover:text-white rounded transition-colors"
          title="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-start gap-3 pr-4">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white shrink-0 mt-0.5">
            <Cloud className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-semibold text-white tracking-wide">
              Sync Across Devices
            </h3>
            <p className="text-[12px] text-neutral-400 mt-1 leading-relaxed">
              Sign in to securely backup your chats, preferences, and workspace history.
            </p>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => {
                  onOpenAuth();
                  handleDismiss();
                }}
                className="px-3 py-1.5 text-xs font-medium text-black bg-white hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-1"
              >
                <span>Sign In</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={handleDismiss}
                className="px-2.5 py-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPromptPopup;
