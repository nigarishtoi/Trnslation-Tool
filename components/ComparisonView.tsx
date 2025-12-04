import React, { useRef, useEffect } from 'react';
import { ProcessedPage } from '../types';
import { Loader2, AlertCircle, RotateCw, Eraser } from 'lucide-react';

interface Props {
  page: ProcessedPage;
  pageIndex: number;
  onRetry: () => void;
  onDiscard: () => void;
}

export const ComparisonView: React.FC<Props> = ({ page, pageIndex, onRetry, onDiscard }) => {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const isSyncingLeft = useRef(false);
  const isSyncingRight = useRef(false);

  useEffect(() => {
    const leftEl = leftRef.current;
    const rightEl = rightRef.current;

    if (!leftEl || !rightEl) return;

    const handleLeftScroll = () => {
      if (!isSyncingLeft.current) {
        isSyncingRight.current = true;
        const percentage = leftEl.scrollTop / (leftEl.scrollHeight - leftEl.clientHeight);
        rightEl.scrollTop = percentage * (rightEl.scrollHeight - rightEl.clientHeight);
      }
      isSyncingLeft.current = false;
    };

    const handleRightScroll = () => {
      if (!isSyncingRight.current) {
        isSyncingLeft.current = true;
        const percentage = rightEl.scrollTop / (rightEl.scrollHeight - rightEl.clientHeight);
        leftEl.scrollTop = percentage * (leftEl.scrollHeight - leftEl.clientHeight);
      }
      isSyncingRight.current = false;
    };

    leftEl.addEventListener('scroll', handleLeftScroll);
    rightEl.addEventListener('scroll', handleRightScroll);

    return () => {
      leftEl.removeEventListener('scroll', handleLeftScroll);
      rightEl.removeEventListener('scroll', handleRightScroll);
    };
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4 h-full p-4">
      {/* Original Panel */}
      <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
          <span className="text-sm font-semibold text-slate-700">Original - Page {pageIndex + 1}</span>
        </div>
        <div 
          ref={leftRef} 
          className="flex-1 overflow-y-auto p-4 bg-slate-200 flex justify-center items-start"
        >
          <img 
            src={page.originalImageUrl} 
            alt={`Original Page ${pageIndex + 1}`} 
            className="max-w-full shadow-md" 
          />
        </div>
      </div>

      {/* Translated Panel */}
      <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100 flex justify-between items-center">
          <span className="text-sm font-semibold text-indigo-700">Translated - Page {pageIndex + 1}</span>
          
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-0.5 rounded-full mr-2 ${
              page.status === 'completed' ? 'bg-green-100 text-green-800' :
              page.status === 'error' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {page.status === 'translating' ? 'Translating...' : 
               page.status === 'completed' ? 'Done' : 
               page.status === 'error' ? 'Failed' : 'Pending'}
            </span>

            <button 
              onClick={onRetry}
              disabled={page.status === 'translating'}
              className="p-1 hover:bg-indigo-200 rounded text-indigo-700 disabled:opacity-50 transition-colors"
              title="Refresh / Retry Translation"
            >
              <RotateCw className={`w-4 h-4 ${page.status === 'translating' ? 'animate-spin' : ''}`} />
            </button>
            
             <button 
              onClick={onDiscard}
              disabled={page.status === 'translating' || (!page.translatedHtml && page.status !== 'error')}
              className="p-1 hover:bg-red-200 rounded text-red-600 disabled:opacity-50 transition-colors"
              title="Discard Translation"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div 
          ref={rightRef} 
          className="flex-1 overflow-y-auto p-6 bg-white relative translated-view"
        >
          {page.status === 'translating' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 backdrop-blur-sm">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
              <p className="text-sm text-slate-500">Analyzing layout & translating...</p>
            </div>
          )}
          
          {page.status === 'error' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 p-4 text-center">
               <AlertCircle className="w-10 h-10 mb-2" />
               <p>Translation failed. Please try again.</p>
             </div>
          )}

          {page.translatedHtml ? (
            <div 
              dangerouslySetInnerHTML={{ __html: page.translatedHtml }} 
              className="prose max-w-none text-slate-900"
            />
          ) : (
            page.status === 'pending' && (
              <div className="flex items-center justify-center h-full text-slate-400 italic">
                Waiting for translation...
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};