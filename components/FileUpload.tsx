import React, { useRef } from 'react';
import { Upload, FileText, Image as ImageIcon } from 'lucide-react';

interface Props {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export const FileUpload: React.FC<Props> = ({ onFileSelect, isProcessing }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onFileSelect(file);
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    }
  };

  const handleClick = () => {
    if (!isProcessing) {
      inputRef.current?.click();
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-200 
      ${isProcessing 
        ? 'border-slate-300 bg-slate-50 cursor-not-allowed opacity-60' 
        : 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-400 cursor-pointer'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        className="hidden"
        disabled={isProcessing}
      />
      <div className="bg-white p-3 rounded-full shadow-sm mb-4">
        <Upload className="h-6 w-6 text-indigo-600" />
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-1">Upload Document</h3>
      <p className="text-sm text-slate-500 mb-4">Support PDF, JPG, PNG</p>
      
      <div className="flex space-x-2">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-800">
          <FileText className="w-3 h-3 mr-1" /> PDF
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-800">
          <ImageIcon className="w-3 h-3 mr-1" /> JPG
        </span>
      </div>
    </div>
  );
};