import React from 'react';
import { Search, X } from 'lucide-react';

export const SearchInput = ({ 
  value, 
  onChange, 
  placeholder, 
  className = '', 
  onClear,
  ...props 
}) => {
  const showClear = value && value.length > 0;

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
  };

  return (
    <div className={`relative flex-1 ${className}`}>
      <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 rounded-lg text-sm form-input-custom"
        {...props}
      />
      {showClear && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Clear search"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
