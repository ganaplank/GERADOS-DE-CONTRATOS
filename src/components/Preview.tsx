import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import Draggable from 'react-draggable';
import { replaceVariables } from '../utils/documentUtils';
import { Download, FileDown, Eye, GripHorizontal, Loader2, Minimize2, Maximize2, Move } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface PreviewProps {
  template: string;
  values: Record<string, string>;
  onDownloadPDF: () => Promise<void>;
  onDownloadWord: () => Promise<void>;
  logoPosition: { x: number, y: number };
  setLogoPosition: (pos: { x: number, y: number }) => void;
  isDraggingEnabled: boolean;
  showFooterLogo: boolean;
}

export const Preview: React.FC<PreviewProps> = ({ 
  template, 
  values, 
  onDownloadPDF, 
  onDownloadWord,
  logoPosition,
  setLogoPosition,
  isDraggingEnabled,
  showFooterLogo
}) => {
  const processedContent = replaceVariables(template, values);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);
  const [isMinimized, setIsMinimized] = useLocalStorage<boolean>('sell-preview-minimized', false);
  const nodeRef = useRef(null);

  // Window position state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDraggingWindow, setIsDraggingWindow] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Resize state
  const [size, setSize] = useLocalStorage('sell-preview-size', { width: 550, height: 700 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Initialize window position on mount
  useEffect(() => {
    const initialX = Math.max(20, window.innerWidth - size.width - 40);
    const initialY = 100;
    setPosition({ x: initialX, y: initialY });
  }, []);

  // Handle window drag events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingWindow) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingWindow(false);
    };

    if (isDraggingWindow) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingWindow, dragOffset]);

  // Handle resize events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = Math.max(400, resizeStart.width + (e.clientX - resizeStart.x));
        const newHeight = Math.max(400, resizeStart.height + (e.clientY - resizeStart.y));
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart, setSize]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDraggingWindow(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    });
  };

  const handlePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await onDownloadPDF();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleWord = async () => {
    setIsGeneratingWord(true);
    try {
      await onDownloadWord();
    } finally {
      setIsGeneratingWord(false);
    }
  };

  const isGenerating = isGeneratingPDF || isGeneratingWord;

  if (isMinimized) {
    return (
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-3 px-6 py-4 bg-sell-blue text-white rounded-full shadow-2xl hover:bg-slate-800 transition-all font-bold text-sm border-2 border-white/20"
        >
          <Eye className="w-5 h-5" />
          Visualizar Prévia
        </button>
      </div>
    );
  }

  return (
    <div 
      className="fixed z-50 flex flex-col bg-slate-100 overflow-hidden rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-300"
      style={{ 
        left: position.x, 
        top: position.y,
        width: size.width,
        height: size.height,
        maxWidth: '95vw',
        maxHeight: '85vh'
      }}
    >
      {/* Header / Drag Handle */}
      <div 
        className="p-4 border-b border-slate-300 bg-white flex items-center justify-between shadow-sm z-10 shrink-0 cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-3">
          <GripHorizontal className="w-5 h-5 text-slate-300" />
          <h2 className="text-sm font-bold text-sell-blue flex items-center gap-2">
            <Eye className="w-4 h-4 text-sell-green" />
            PRÉVIA DO DOCUMENTO
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleWord}
            disabled={isGenerating}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-bold text-[10px] uppercase tracking-wider shadow-sm disabled:opacity-50"
          >
            {isGeneratingWord ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
            {isGeneratingWord ? 'Gerando...' : 'Word'}
          </button>
          <button
            onClick={handlePDF}
            disabled={isGenerating}
            className="flex items-center gap-2 px-3 py-1.5 bg-sell-green text-white rounded-lg hover:bg-green-600 transition-all font-bold text-[10px] uppercase tracking-wider shadow-sm disabled:opacity-50"
          >
            {isGeneratingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {isGeneratingPDF ? 'Gerando...' : 'PDF'}
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 text-slate-400 hover:text-sell-blue hover:bg-slate-100 rounded-lg transition-colors"
            title="Minimizar"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar (Indeterminate) */}
      {isGenerating && (
        <div className="h-1 w-full bg-slate-100 overflow-hidden shrink-0 z-20">
          <div className="h-full bg-sell-green animate-[progress_2s_ease-in-out_infinite] w-1/3"></div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-slate-200/50 relative">
        {/* Generation Overlay */}
        {isGenerating && (
          <div className="absolute inset-0 z-30 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-sell-green border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  {isGeneratingPDF ? <Download className="w-6 h-6 text-sell-green" /> : <FileDown className="w-6 h-6 text-sell-green" />}
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-sm font-black text-sell-blue uppercase tracking-widest">Processando Documento</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                  {isGeneratingPDF ? 'Convertendo para PDF de alta qualidade...' : 'Preparando arquivo Word...'}
                </p>
              </div>
            </div>
          </div>
        )}
        {/* A4 Paper representation */}
        <div 
          className="bg-white w-full max-w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl rounded-sm ring-1 ring-black/5 transition-all flex flex-col relative"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          {/* Page Break Indicators (Visual only) */}
          <div className="absolute left-0 right-0 top-[297mm] border-t-2 border-dashed border-slate-200 z-10 pointer-events-none">
            <span className="absolute right-2 -top-3 bg-slate-100 px-2 py-0.5 rounded text-[8px] font-black text-slate-400 uppercase tracking-widest">Fim da Página 1</span>
          </div>
          <div className="absolute left-0 right-0 top-[594mm] border-t-2 border-dashed border-slate-200 z-10 pointer-events-none">
            <span className="absolute right-2 -top-3 bg-slate-100 px-2 py-0.5 rounded text-[8px] font-black text-slate-400 uppercase tracking-widest">Fim da Página 2</span>
          </div>

          {/* Header do Timbrado na Prévia */}
          <div className="flex flex-col items-center mb-8 relative">
            <Draggable
              nodeRef={nodeRef}
              disabled={!isDraggingEnabled}
              position={logoPosition}
              onStop={(e, data) => setLogoPosition({ x: data.x, y: data.y })}
            >
              <div ref={nodeRef} className={`cursor-${isDraggingEnabled ? 'move' : 'default'} relative group`}>
                <img 
                  src="/logo-sell.png" 
                  alt="Logo Sell" 
                  className={`h-14 object-contain mb-2 transition-all ${isDraggingEnabled ? 'ring-2 ring-sell-green ring-offset-4 rounded-sm' : ''}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {isDraggingEnabled && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-sell-green text-white text-[8px] font-black px-2 py-1 rounded shadow-lg flex items-center gap-1 whitespace-nowrap">
                    <Move className="w-2 h-2" />
                    ARRASTE PARA POSICIONAR
                  </div>
                )}
              </div>
            </Draggable>
            <h1 className="text-sell-blue font-bold text-lg tracking-[0.2em] uppercase font-serif mt-2">SELL ADMINISTRADORA</h1>
            <div className="w-full h-[1px] bg-sell-green mt-4"></div>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 markdown-body text-[11pt] leading-relaxed text-slate-800 text-justify">
            {processedContent ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                {processedContent}
              </ReactMarkdown>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 mt-20 font-sans italic">
                <p>O conteúdo do documento aparecerá aqui.</p>
              </div>
            )}
          </div>

          {/* Rodapé do Timbrado na Prévia */}
          <div className="mt-12 pt-6 border-t border-slate-200 text-center text-[9pt] text-slate-400 font-sans flex flex-col items-center gap-4">
            {showFooterLogo && (
              <img 
                src="/logo-sell.png" 
                alt="Logo Sell" 
                className="h-6 object-contain opacity-50 grayscale"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <p>(11) 3796-0203 | atendimento@selladm.com.br | selladm.com.br</p>
          </div>
        </div>
      </div>

      {/* Resize Handle */}
      <div 
        className="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize z-20 flex items-end justify-end p-2"
        onMouseDown={handleResizeMouseDown}
      >
        <div className="w-4 h-4 border-r-4 border-b-4 border-slate-300 rounded-br-sm opacity-50 hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};
