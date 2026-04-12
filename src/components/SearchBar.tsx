import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder = 'Search...' }) => {
  return (
    <div className="relative flex-1 max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search size={16} className="text-surface-400" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-9 pr-9 py-2 border border-surface-200 rounded-lg leading-5 bg-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-sm font-sans transition-shadow"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <X size={14} className="text-surface-400 hover:text-surface-600 transition-colors" />
        </button>
      )}
    </div>
  );
};
