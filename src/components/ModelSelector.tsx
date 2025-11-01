import React from 'react';
import { AiModel } from '../types';

interface ModelSelectorProps {
  selectedModel: AiModel;
  onModelChange: (model: AiModel) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelChange }) => {
  return (
    <div>
      <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
        {Object.values(AiModel).map((model) => (
          <option key={model} value={model} className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
            {model === AiModel.GEMINI_FLASH ? "Gemini 2.5 Flash" : model}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ModelSelector;