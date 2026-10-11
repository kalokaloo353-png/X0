import React from 'react';
import X0Logo from './X0Logo';
import { Code2, Compass, Sparkles, Terminal } from 'lucide-react';

interface EmptyWorkspaceProps {
  onSelectPrompt: (prompt: string) => void;
  onOpenAuth?: () => void;
  isLoggedIn?: boolean;
}

export const EmptyWorkspace: React.FC<EmptyWorkspaceProps> = ({
  onSelectPrompt,
  onOpenAuth,
  isLoggedIn,
}) => {
  const suggestions = [
    {
      title: 'Architect a TypeScript service',
      description: 'Design a clean, fault-tolerant state machine with full type safety.',
      icon: Terminal,
      prompt: 'Help me design a clean, fault-tolerant TypeScript state machine for asynchronous API synchronization. Include full interfaces and error boundaries.',
    },
    {
      title: 'Analyze performance bottlenecks',
      description: 'Audit render cycles and data pipeline latency in React 19.',
      icon: Code2,
      prompt: 'What are the most common invisible performance bottlenecks in React 19 streaming applications, and how do we benchmark them quantitatively?',
    },
    {
      title: 'Refactor complex business logic',
      description: 'Clean up nested conditional branches into declarative strategies.',
      icon: Compass,
      prompt: 'Review this pattern for handling multi-tier permission checking and refactor it into an elegant declarative strategy pattern.',
    },
    {
      title: 'Executive technical summary',
      description: 'Synthesize raw technical findings into crisp leadership takeaways.',
      icon: Sparkles,
      prompt: 'Transform a complex distributed systems post-mortem into a concise executive briefing highlighting root cause, blast radius, and immediate remediations.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-3xl mx-auto text-center">
      {/* Brand Icon Monogram */}
      <div className="mb-6 flex items-center justify-center">
        <div className="w-16 h-12 flex items-center justify-center text-white">
          <X0Logo className="w-16 h-12 text-white" />
        </div>
      </div>

      {/* Required Heading & Subtitle */}
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-2">
        What can I help you with?
      </h1>
      <p className="text-sm sm:text-base text-neutral-400 font-normal mb-8">
        Your AI. Your workspace.
      </p>

      {/* Suggested Starting Points */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
        {suggestions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(item.prompt)}
              className="p-3.5 bg-[#0a0a0a] hover:bg-[#121212] border border-neutral-800/80 hover:border-neutral-700 rounded-lg transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 transition-colors" />
                <span className="text-xs font-semibold text-neutral-200 group-hover:text-white transition-colors">
                  {item.title}
                </span>
              </div>
              <p className="text-[12px] text-neutral-500 leading-normal line-clamp-2">
                {item.description}
              </p>
            </button>
          );
        })}
      </div>

      {!isLoggedIn && onOpenAuth && (
        <div className="mt-8 pt-4 border-t border-neutral-900/60 w-full flex items-center justify-center gap-2 text-xs text-neutral-400">
          <span>Sync conversations across devices?</span>
          <button
            onClick={onOpenAuth}
            className="text-white hover:underline underline-offset-2 font-medium"
          >
            Sign in to your X0 account
          </button>
        </div>
      )}
    </div>
  );
};

export default EmptyWorkspace;
