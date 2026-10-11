import React, { useState, useEffect } from 'react';
import { X, Check, ShieldCheck, AlertCircle, RefreshCw, Trash2, Download } from 'lucide-react';
import { authService } from '../services/authService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemPrompt: string;
  onSaveSystemPrompt: (prompt: string) => void;
  temperature: number;
  onSaveTemperature: (temp: number) => void;
  onClearAllChats: () => void;
  onExportAllChats: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  systemPrompt,
  onSaveSystemPrompt,
  temperature,
  onSaveTemperature,
  onClearAllChats,
  onExportAllChats,
}) => {
  const [localPrompt, setLocalPrompt] = useState(systemPrompt);
  const [localTemp, setLocalTemp] = useState(temperature);
  const [apiStatus, setApiStatus] = useState<{ configured: boolean; checking: boolean }>({
    configured: false,
    checking: true,
  });

  useEffect(() => {
    setLocalPrompt(systemPrompt);
    setLocalTemp(temperature);
  }, [systemPrompt, temperature]);

  useEffect(() => {
    if (isOpen) {
      checkHealth();
    }
  }, [isOpen]);

  const checkHealth = async () => {
    setApiStatus((prev) => ({ ...prev, checking: true }));
    const result = await authService.checkHealth();
    setApiStatus({ configured: result.configured, checking: false });
  };

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSystemPrompt(localPrompt);
    onSaveTemperature(localTemp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#090909] border border-neutral-800 rounded-xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-900">
          <div>
            <h2 className="text-base font-semibold text-white tracking-wide">
              Workspace Settings
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Configure system parameters and backend telemetry.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-5">
          {/* Server Connection Status */}
          <div className="p-3 bg-[#0d0d0d] border border-neutral-800/80 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {apiStatus.checking ? (
                  <RefreshCw className="w-4 h-4 text-neutral-500 animate-spin" />
                ) : apiStatus.configured ? (
                  <ShieldCheck className="w-4 h-4 text-white" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-neutral-400" />
                )}
                <div>
                  <div className="text-xs font-semibold text-white">
                    {apiStatus.checking
                      ? 'Verifying Engine Connection...'
                      : apiStatus.configured
                      ? 'Cloud Intelligence Engine: Connected'
                      : 'Cloud Intelligence Engine: Key Needed'}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {apiStatus.configured
                      ? 'Secure backend proxy is active. Keys are stored server-side.'
                      : 'Ensure API key is configured in application secrets.'}
                  </div>
                </div>
              </div>
              <button
                onClick={checkHealth}
                className="p-1 text-neutral-500 hover:text-white rounded transition-colors"
                title="Refresh connection status"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* System Instruction */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white flex items-center justify-between">
              <span>System Persona & Directive</span>
              <span className="text-[11px] text-neutral-500 font-mono">systemInstruction</span>
            </label>
            <textarea
              value={localPrompt}
              onChange={(e) => setLocalPrompt(e.target.value)}
              placeholder="e.g. You are X0, an ultra-minimalist, exceptionally capable software and reasoning assistant..."
              rows={4}
              className="w-full bg-[#0d0d0d] border border-neutral-800 rounded-lg p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 leading-relaxed"
            />
            <p className="text-[11px] text-neutral-500">
              Steers the model's tone, formatting, and behavioral constraints across all sessions.
            </p>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-white">Temperature</span>
              <span className="font-mono text-neutral-300">{localTemp.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={localTemp}
              onChange={(e) => setLocalTemp(parseFloat(e.target.value))}
              className="w-full accent-white bg-neutral-800 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>0.0 (Deterministic / Code)</span>
              <span>0.7 (Balanced)</span>
              <span>1.0 (Creative)</span>
            </div>
          </div>

          {/* Data Export & Reset */}
          <div className="pt-2 border-t border-neutral-900 space-y-2">
            <div className="text-xs font-medium text-white">Data Management</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onExportAllChats}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-md transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-neutral-400" />
                <span>Export All (JSON)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to clear all local conversations?')) {
                    onClearAllChats();
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-md transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-neutral-500" />
                <span>Clear All Local Chats</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-neutral-900 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-medium text-black bg-white hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
