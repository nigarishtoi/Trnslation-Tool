import React, { useState } from 'react';
import { SupportedLanguage, DocumentState, ProcessedPage } from './types';
import { translatePageImage } from './services/geminiService';
import { convertPdfToImages, fileToBase64, generateWordDocument, generatePdfDocument } from './utils/fileProcessor';
import { FileUpload } from './components/FileUpload';
import { LanguageSelector } from './components/LanguageSelector';
import { ComparisonView } from './components/ComparisonView';
import { FileDown, ArrowRightLeft, Layout, Sparkles, FileText, Upload } from 'lucide-react';

const App: React.FC = () => {
  const [docState, setDocState] = useState<DocumentState>({
    file: null,
    fileName: '',
    totalPages: 0,
    pages: [],
    sourceLang: SupportedLanguage.English,
    targetLang: SupportedLanguage.Hindi,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState(0);

  // File Selection Handler
  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setDocState(prev => ({ ...prev, file, fileName: file.name, pages: [], totalPages: 0 }));

    try {
      let images: string[] = [];

      if (file.type === 'application/pdf') {
        images = await convertPdfToImages(file);
      } else if (file.type.startsWith('image/')) {
        const base64 = await fileToBase64(file);
        images = [base64];
      } else {
        alert('Unsupported file type. Please upload PDF or JPG/PNG.');
        setIsProcessing(false);
        return;
      }

      const initialPages: ProcessedPage[] = images.map((img, idx) => ({
        id: `page-${idx}`,
        pageNumber: idx + 1,
        originalImageUrl: img,
        translatedHtml: null,
        status: 'pending'
      }));

      setDocState(prev => ({
        ...prev,
        pages: initialPages,
        totalPages: initialPages.length
      }));

      // Trigger translation for first page automatically
      if (initialPages.length > 0) {
        processTranslation(initialPages, 0, docState.sourceLang, docState.targetLang);
      }

    } catch (error) {
      console.error(error);
      alert('Error processing file.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Translation Logic
  const processTranslation = async (currentPages: ProcessedPage[], index: number, source: SupportedLanguage, target: SupportedLanguage) => {
    if (index >= currentPages.length) return;

    // Check if already completed to avoid redundant calls in recursion (unless forced)
    if (currentPages[index].status === 'completed') {
       if (index + 1 < currentPages.length) {
        processTranslation(currentPages, index + 1, source, target);
      }
      return;
    }

    // Update status to translating
    setDocState(prev => {
      // Guard: if pages were cleared (reset), stop
      if (prev.pages.length <= index) return prev;
      const newPages = [...prev.pages];
      newPages[index] = { ...newPages[index], status: 'translating' };
      return { ...prev, pages: newPages };
    });

    try {
      const html = await translatePageImage(currentPages[index].originalImageUrl, source, target);
      
      setDocState(prev => {
        // Guard: if pages were cleared (reset) during await, stop
        if (prev.pages.length <= index) return prev;
        
        const newPages = [...prev.pages];
        newPages[index] = { ...newPages[index], translatedHtml: html, status: 'completed' };
        return { ...prev, pages: newPages };
      });

      // Continue to next page automatically
      if (index + 1 < currentPages.length) {
        processTranslation(currentPages, index + 1, source, target);
      }

    } catch (error) {
      setDocState(prev => {
        // Guard check
        if (prev.pages.length <= index) return prev;
        
        const newPages = [...prev.pages];
        newPages[index] = { ...newPages[index], status: 'error' };
        return { ...prev, pages: newPages };
      });
    }
  };

  const translateSinglePage = async (index: number) => {
    if (index < 0 || index >= docState.pages.length) return;

    setDocState(prev => {
      if (prev.pages.length <= index) return prev;
      const newPages = [...prev.pages];
      newPages[index] = { ...newPages[index], status: 'translating' };
      return { ...prev, pages: newPages };
    });

    try {
      const page = docState.pages[index];
      const html = await translatePageImage(page.originalImageUrl, docState.sourceLang, docState.targetLang);
      
      setDocState(prev => {
        if (prev.pages.length <= index) return prev;
        const newPages = [...prev.pages];
        newPages[index] = { ...newPages[index], translatedHtml: html, status: 'completed' };
        return { ...prev, pages: newPages };
      });
    } catch (error) {
       setDocState(prev => {
        if (prev.pages.length <= index) return prev;
        const newPages = [...prev.pages];
        newPages[index] = { ...newPages[index], status: 'error' };
        return { ...prev, pages: newPages };
      });
    }
  };

  const handleLanguageSwap = () => {
    setDocState(prev => ({
      ...prev,
      sourceLang: prev.targetLang,
      targetLang: prev.sourceLang
    }));
  };

  const handleRetranslateAll = () => {
    if (docState.pages.length === 0) return;
    // Retranslate all pages with new language settings
    const resetPages = docState.pages.map(p => ({ ...p, status: 'pending' as const, translatedHtml: null }));
    setDocState(prev => ({ ...prev, pages: resetPages }));
    processTranslation(resetPages, 0, docState.sourceLang, docState.targetLang);
  };

  // Specific page handlers
  const handleRetryPage = () => {
    translateSinglePage(activePageIndex);
  };

  const handleDiscardPage = () => {
    // Reset state immediately without confirmation to allow quick new project start
    setDocState(prev => ({
      ...prev,
      file: null,
      fileName: '',
      totalPages: 0,
      pages: []
    }));
    setActivePageIndex(0);
    setIsProcessing(false);
  };

  // Export Functions
  const handleDownloadWord = () => {
    const fullHtml = docState.pages.map(p => p.translatedHtml || '').join('<br style="page-break-after: always;" />');
    generateWordDocument(fullHtml, docState.fileName);
  };

  const handleDownloadPdf = () => {
    // We construct a hidden div with all pages to print
    const container = document.createElement('div');
    container.id = 'print-container';
    container.className = 'print-content';
    docState.pages.forEach((page, i) => {
      const pageDiv = document.createElement('div');
      pageDiv.innerHTML = page.translatedHtml || '';
      if (i < docState.pages.length - 1) {
        pageDiv.style.pageBreakAfter = 'always';
      }
      container.appendChild(pageDiv);
    });
    
    // Temporarily append to body to capture
    document.body.appendChild(container);
    generatePdfDocument('print-container', docState.fileName);
    document.body.removeChild(container);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm z-10 flex-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Translation for TOI</h1>
            </div>
          </div>

          <div className="flex items-end space-x-4 bg-slate-50 p-2 rounded-xl border border-slate-200">
             <LanguageSelector 
              label="Translate from"
              value={docState.sourceLang}
              onChange={(lang) => setDocState(prev => ({...prev, sourceLang: lang}))}
              options={Object.values(SupportedLanguage)}
             />
             
             <button 
               onClick={handleLanguageSwap}
               className="mb-1 p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
               title="Swap Languages"
             >
               <ArrowRightLeft className="w-4 h-4" />
             </button>

             <LanguageSelector 
              label="Translate to"
              value={docState.targetLang}
              onChange={(lang) => setDocState(prev => ({...prev, targetLang: lang}))}
              options={Object.values(SupportedLanguage)}
             />

             {docState.pages.length > 0 && (
                <button 
                  onClick={handleRetranslateAll}
                  className="mb-0.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                  Translate All
                </button>
             )}
          </div>

          <div className="flex items-center space-x-3">
             {docState.pages.length > 0 && (
               <div className="flex space-x-2">
                 <button 
                   onClick={handleDiscardPage}
                   className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                 >
                   <Upload className="w-4 h-4 mr-2 text-indigo-600" /> New File
                 </button>

                 <button 
                   onClick={handleDownloadPdf}
                   className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                 >
                   <FileDown className="w-4 h-4 mr-2 text-red-500" /> PDF
                 </button>
                 <button 
                    onClick={handleDownloadWord}
                    className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                 >
                   <FileDown className="w-4 h-4 mr-2 text-blue-600" /> Word
                 </button>
               </div>
             )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {docState.pages.length === 0 ? (
          <div className="h-full flex items-center justify-center p-6">
            <div className="max-w-md w-full">
              <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />
              
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                 <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-100">
                    <Layout className="w-8 h-8 mx-auto text-indigo-500 mb-2" />
                    <h3 className="font-medium text-slate-900">Layout Preservation</h3>
                    <p className="text-xs text-slate-500 mt-1">Maintains original structure, tables, and lists</p>
                 </div>
                 <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-100">
                    <Sparkles className="w-8 h-8 mx-auto text-indigo-500 mb-2" />
                    <h3 className="font-medium text-slate-900">AI Powered</h3>
                    <p className="text-xs text-slate-500 mt-1">Utilizes advanced Gemini models for accuracy</p>
                 </div>
                 <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-100">
                    <FileText className="w-8 h-8 mx-auto text-indigo-500 mb-2" />
                    <h3 className="font-medium text-slate-900">Multi-Format</h3>
                    <p className="text-xs text-slate-500 mt-1">Supports PDF & Images with dual export options</p>
                 </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Page Navigation if multiple pages */}
            {docState.totalPages > 1 && (
              <div className="bg-white border-b border-slate-200 py-2 px-4 flex justify-center items-center space-x-4">
                <button 
                  disabled={activePageIndex === 0}
                  onClick={() => setActivePageIndex(p => p - 1)}
                  className="px-3 py-1 rounded-md text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm font-medium text-slate-600">
                  Page {activePageIndex + 1} of {docState.totalPages}
                </span>
                <button 
                  disabled={activePageIndex === docState.totalPages - 1}
                  onClick={() => setActivePageIndex(p => p + 1)}
                  className="px-3 py-1 rounded-md text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
            
            {/* Split View */}
            <div className="flex-1 overflow-hidden">
               <ComparisonView 
                 page={docState.pages[activePageIndex]} 
                 pageIndex={activePageIndex}
                 onRetry={handleRetryPage}
                 onDiscard={handleDiscardPage}
               />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;