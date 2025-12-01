import { FC } from 'react';
import { AiModel } from '../types';
import type { StudyFile } from '../types';

interface ChatInputAreaProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  disabled: boolean;
  placeholder: string;
  selectedModel: AiModel;
  onModelChange: (model: AiModel) => void;
  levelUpEnabled: boolean;
  onToggleLevelUp: (enabled: boolean) => void;
  selectedFiles: StudyFile[];
  useWebSearch: boolean;
  onToggleWebSearch: (enabled: boolean) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

const ChatInputArea: FC<ChatInputAreaProps> = ({
  input,
  onInputChange,
  onSend,
  onKeyDown,
  isLoading,
  disabled,
  placeholder,
  selectedModel,
  onModelChange,
  levelUpEnabled,
  onToggleLevelUp,
  selectedFiles,
  useWebSearch,
  onToggleWebSearch,
  textareaRef
}) => {
  const models = [
    { id: AiModel.GEMINI_FLASH, name: 'Gemini 1.5 Flash' },
    { id: AiModel.GEMINI_PRO, name: 'Gemini 1.5 Pro' },
    { id: AiModel.GEMINI_2_0_FLASH_EXP, name: 'Gemini 2.0 Flash (Exp)' },
    { id: AiModel.GEMINI_2_5_FLASH, name: 'Gemini 2.5 Flash' },
    { id: AiModel.GEMINI_2_5_PRO, name: 'Gemini 2.5 Pro' },
    { id: AiModel.GEMINI_3_PRO, name: 'Gemini 3 Pro (Preview)' },
    { id: AiModel.GROK, name: 'Grok Beta' },
    { id: AiModel.GPT4ALL, name: 'GPT4All (Local)' },
    { id: AiModel.LLAMA2, name: 'LLaMA 2 (Local)' }
  ];

  return (
    <div className="px-6 pb-6 space-y-3">
      {/* Top Controls Row */}
      <div className="flex items-center justify-between gap-4 text-xs">
        {/* Left: Model Selector */}
        <div className="flex items-center gap-2">
          <span style={{ color: 'var(--color-text-tertiary)' }}>Model:</span>
          <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value as AiModel)}
            className="px-2 py-1 rounded-md text-xs cursor-pointer transition-colors border-0 outline-none"
            style={{
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)'
            }}
            disabled={isLoading}
          >
            {models.map(model => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Context & Web Search */}
        <div className="flex items-center gap-4">
          {/* Level Up+ Toggle */}
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--color-text-tertiary)' }}>Level Up+</span>
            <button
              onClick={() => onToggleLevelUp(!levelUpEnabled)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${levelUpEnabled ? 'bg-gradient-to-r from-cyan-500 to-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              disabled={isLoading}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${levelUpEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>

          {/* Web Search Toggle */}
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--color-text-tertiary)' }}>Web Search</span>
            <button
              onClick={() => onToggleWebSearch(!useWebSearch)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${useWebSearch ? 'bg-gradient-to-r from-cyan-500 to-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              disabled={isLoading}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${useWebSearch ? 'translate-x-5' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Active Context Info */}
      {selectedFiles.length > 0 && (
        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{
          background: 'var(--color-bg-secondary)',
          color: 'var(--color-text-secondary)'
        }}>
          <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>{selectedFiles.length} source{selectedFiles.length !== 1 ? 's' : ''} selected</span>
          <span className="mx-1">•</span>
          <span style={{ color: 'var(--color-text-tertiary)' }}>
            {selectedFiles.map(f => f.name).join(', ')}
          </span>
        </div>
      )}

      {/* Input Area */}
      <div className="relative flex items-center">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-3.5 pr-14 rounded-xl resize-none text-sm"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-soft)',
            color: 'var(--color-text-primary)',
            minHeight: '52px',
            maxHeight: '200px',
            outline: 'none'
          }}
          rows={1}
          disabled={disabled || isLoading}
        />

        <button
          onClick={onSend}
          disabled={isLoading || input.trim() === '' || disabled}
          className="absolute right-2.5 p-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          style={{
            background: 'rgb(59, 130, 246)',
            color: 'white',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
          aria-label="Send message"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

      {/* AI Response Disclaimer */}
      <p className="text-xs text-center" style={{ color: 'var(--color-text-tertiary)' }}>
        AI responses are based on your uploaded documents
      </p>
    </div>
  );
};

export default ChatInputArea;
