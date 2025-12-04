export enum SupportedLanguage {
  English = 'English',
  Hindi = 'Hindi',
  Marathi = 'Marathi',
  Gujarati = 'Gujarati',
  Bengali = 'Bengali',
  Kannada = 'Kannada'
}

export interface ProcessedPage {
  id: string;
  pageNumber: number;
  originalImageUrl: string; // Base64 or Blob URL
  translatedHtml: string | null;
  status: 'pending' | 'translating' | 'completed' | 'error';
}

export interface DocumentState {
  file: File | null;
  fileName: string;
  totalPages: number;
  pages: ProcessedPage[];
  sourceLang: SupportedLanguage;
  targetLang: SupportedLanguage;
}