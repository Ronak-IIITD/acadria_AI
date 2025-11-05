import React from 'react';
import { AiModel } from '../types';

interface ModelSelectorProps {
  selectedModel: AiModel;
  onModelChange: (model: AiModel) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelChange }) => {
  return (
    <div>
      <label 
        htmlFor="model-select" 
        className="block text-sm font-semibold mb-2"
        style={{ color: 'var(--color-text-primary)' }}
      >
        AI Model
      </label>
      <select
        id="model-select"
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value as AiModel)}
        className="w-full rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-soft)',
          color: 'var(--color-text-primary)'
        }}
      >
        {Object.values(AiModel).map((model) => {
          const modelNames = {
            [AiModel.GEMINI_FLASH]: "Gemini 2.0 Flash",
            [AiModel.GROK]: "Grok (xAI)",
            [AiModel.GPT4ALL]: "GPT4All (Local)",
            [AiModel.LLAMA2]: "LLaMA 2 (Local)",
          };
          
          return (
            <option key={model} value={model} className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
              {modelNames[model] || model}
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default ModelSelector;