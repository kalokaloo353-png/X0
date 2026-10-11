import React, { useState, useRef, useEffect } from 'react';
import { Cpu, Check, Sliders, Sparkles, X } from 'lucide-react';

export type ThinkingLevelId = 'low' | 'medium' | 'high' | 'extra_high' | 'ultra';

export interface ThinkingLevelInfo {
  id: ThinkingLevelId;
  name: string;
  description: string;
  levelIndex: number;
}

export const THINKING_LEVELS: ThinkingLevelInfo[] = [
  {
    id: 'low',
    name: 'Low',
    description: 'Fast responses, minimal reasoning. Best for quick edits and conversational queries.',
    levelIndex: 0,
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'Balanced speed and reasoning. Ideal for standard code refactoring and explanations.',
    levelIndex: 1,
  },
  {
    id: 'high',
    name: 'High',
    description: 'Deeper reasoning for difficult tasks. Recommended for complex code and architecture.',
    levelIndex: 2,
  },
  {
    id: 'extra_high',
    name: 'Extra High',
    description: 'Very deep reasoning for complex tasks. Thorough analysis of multi-file systems and logic.',
    levelIndex: 3,
  },
  {
    id: 'ultra',
    name: 'Ultra',
    description: 'Maximum available reasoning effort. Exhaustive synthesis for advanced algorithmic problems.',
    levelIndex: 4,
  },
];

interface ThinkingEffortPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: ThinkingLevelId;
  onChangeLevel: (level: ThinkingLevelId) => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export const ThinkingEffortPopover: React.FC<ThinkingEffortPopoverProps> = ({
  isOpen,
  onClose,
  currentLevel,
  onChangeLevel,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const activeLevelInfo =
    THINKING_LEVELS.find((l) => l.id === currentLevel) || THINKING_LEVELS[2]; // Default High

  // Click outside listener to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, clickX / width));
    const rawIndex = Math.round(percentage * (THINKING_LEVELS.length - 1));
    onChangeLevel(THINKING_LEVELS[rawIndex].id);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clickX = clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, clickX / width));
    const rawIndex = Math.round(percentage * (THINKING_LEVELS.length - 1));
    onChangeLevel(THINKING_LEVELS[rawIndex].id);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    e.stopPropagation();
  };

  const activePercentage = (activeLevelInfo.levelIndex / (THINKING_LEVELS.length - 1)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div
        ref={popoverRef}
        className="w-full max-w-md bg-[#080808] border border-neutral-800 rounded-xl shadow-2xl p-6 text-white relative animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-900">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
              Thinking Effort
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Explanation */}
        <p className="text-xs text-neutral-400 mt-4 leading-relaxed">
          Adjust how deeply X0 reasons through complex architectural, coding, and logical tasks before responding.
        </p>

        {/* Selected Level Display */}
        <div className="mt-5 p-3.5 bg-[#0f0f0f] border border-neutral-800/80 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              {activeLevelInfo.name}
            </span>
            <span className="text-[11px] font-mono text-blue-400">
              Level {activeLevelInfo.levelIndex + 1} / {THINKING_LEVELS.length}
            </span>
          </div>
          <p className="text-[12px] text-neutral-400 leading-normal">
            {activeLevelInfo.description}
          </p>
        </div>

        {/* Horizontal Slider with 5 Snap Points */}
        <div className="mt-8 px-2">
          <div
            ref={trackRef}
            onClick={handleTrackClick}
            className="relative h-6 flex items-center cursor-pointer select-none"
          >
            {/* Background Track */}
            <div className="absolute inset-x-0 h-1.5 bg-neutral-900 border border-neutral-800 rounded-full overflow-hidden">
              {/* Restrained Blue Active Section */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-blue-600 transition-all duration-150"
                style={{ width: `${activePercentage}%` }}
              />
            </div>

            {/* Tick Marks & Snap Points */}
            <div className="absolute inset-x-0 flex justify-between px-1 pointer-events-none">
              {THINKING_LEVELS.map((level) => {
                const isReached = level.levelIndex <= activeLevelInfo.levelIndex;
                return (
                  <div
                    key={level.id}
                    className={`w-2 h-2 rounded-full border transition-colors ${
                      isReached
                        ? 'bg-blue-500 border-blue-400 shadow-[0_0_8px_rgba(37,99,235,0.4)]'
                        : 'bg-neutral-800 border-neutral-700'
                    }`}
                  />
                );
              })}
            </div>

            {/* Draggable Handle */}
            <div
              onPointerDown={handlePointerDown}
              className="absolute top-1/2 -translate-y-1/2 -ml-3.5 w-7 h-7 rounded-full bg-white border-2 border-neutral-900 shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              style={{ left: `${activePercentage}%` }}
              role="slider"
              aria-valuemin={0}
              aria-valuemax={THINKING_LEVELS.length - 1}
              aria-valuenow={activeLevelInfo.levelIndex}
              aria-label="Thinking Effort Slider"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                  const next = Math.min(THINKING_LEVELS.length - 1, activeLevelInfo.levelIndex + 1);
                  onChangeLevel(THINKING_LEVELS[next].id);
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                  const prev = Math.max(0, activeLevelInfo.levelIndex - 1);
                  onChangeLevel(THINKING_LEVELS[prev].id);
                }
              }}
            >
              <div className="w-2 h-2 rounded-full bg-blue-600" />
            </div>
          </div>

          {/* Level Labels under track */}
          <div className="flex justify-between text-[11px] font-mono text-neutral-500 mt-2 px-0.5">
            {THINKING_LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => onChangeLevel(level.id)}
                className={`transition-colors hover:text-white ${
                  level.id === currentLevel ? 'text-blue-400 font-semibold' : ''
                }`}
              >
                {level.name}
              </button>
            ))}
          </div>
        </div>

        {/* Selectable List of All 5 Levels */}
        <div className="mt-6 space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {THINKING_LEVELS.map((level) => {
            const isSelected = level.id === currentLevel;
            return (
              <button
                key={level.id}
                onClick={() => onChangeLevel(level.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between group ${
                  isSelected
                    ? 'bg-neutral-900/90 border-blue-500/80 text-white shadow-sm'
                    : 'bg-[#0b0b0b] border-neutral-900 hover:border-neutral-800 text-neutral-300'
                }`}
              >
                <div className="space-y-0.5 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{level.name}</span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      Tier {level.levelIndex + 1}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 line-clamp-1">
                    {level.description}
                  </p>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-blue-500 bg-blue-600 text-white' : 'border-neutral-700 bg-transparent'
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-neutral-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-black bg-white hover:bg-neutral-200 rounded-lg transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThinkingEffortPopover;
