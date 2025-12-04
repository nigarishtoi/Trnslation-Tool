import React from 'react';
import { SupportedLanguage } from '../types';
import { ChevronDown } from 'lucide-react';

interface Props {
  label: string;
  value: SupportedLanguage;
  onChange: (lang: SupportedLanguage) => void;
  options: SupportedLanguage[];
}

export const LanguageSelector: React.FC<Props> = ({ label, value, onChange, options }) => {
  return (
    <div className="flex flex-col">
      <label className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as SupportedLanguage)}
          className="appearance-none w-full bg-white border border-slate-300 text-slate-900 py-2 pl-3 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-pointer"
        >
          {options.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
};