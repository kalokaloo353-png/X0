import React from 'react';
import { X, Check, Zap, Cpu, Sparkles } from 'lucide-react';
import { AVAILABLE_MODELS } from '../types/chat';

interface ModelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

export const ModelsModal: React.FC<ModelsModalProps> = ({
  isOpen,
  onClose,
  selectedModel,
  onSelectModel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-[#090909] border border-neutral-800 rounded-xl shadow-2xl p-6 relative">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-900">
          <div>
            <h2 className="text-base font-semibold text-white tracking-wide">
              X0 Intelligence Models
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Select the optimal engine for your workspace.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-3">
          {AVAILABLE_MODELS.map((model) => {
            const isSelected = selectedModel === model.id;
            return (
              <div
                key={model.id}
                onClick={() => {
                  onSelectModel(model.id);
                  onClose();
                }}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-neutral-950 border-white text-white'
                    : 'bg-[#0e0e0e] border-neutral-800/80 hover:border-neutral-700 text-neutral-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">{model.name}</span>
                      <span className="text-[11px] text-neutral-500 font-mono">
                        ({model.versionLabel})
                      </span>
                      {model.requiresPaidKey ? (
                        <span className="text-[10px] text-neutral-400 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded">
                          Paid Key
                        </span>
                      ) : (
                        <span className="text-[10px] text-white bg-neutral-900 border border-neutral-700 px-1.5 py-0.5 rounded">
                          Free Tier
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 font-medium">
                      {model.tagline}
                    </p>
                    <p className="text-[12px] text-neutral-500 pt-1 leading-relaxed">
                      {model.description}
                    </p>
                  </div>
                  <div className="shrink-0 ml-4 pt-1">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-white bg-white text-black'
                          : 'border-neutral-700 bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-neutral-900 flex items-center gap-6 text-[11px] font-mono text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-neutral-500" />
                    <span>Speed: {model.speed}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-neutral-500" />
                    <span>Reasoning: {model.intelligence}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelsModal;
