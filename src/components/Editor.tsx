import React, { useRef, useState, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  List, 
  Image as ImageIcon, 
  Type, 
  Plus, 
  Database,
  ChevronRight,
  Info,
  Mic,
  MicOff,
  Loader2
} from 'lucide-react';

interface EditorProps {
  template: string;
  setTemplate: (val: string) => void;
  variables: string[];
  values: Record<string, string>;
  setValues: (val: Record<string, string>) => void;
}

export const Editor: React.FC<EditorProps> = ({ template, setTemplate, variables, values, setValues }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isVariablesOpen, setIsVariablesOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          insertText(finalTranscript + ' ');
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // Ignore no-speech errors, they happen when the user is silent for a while
          return;
        }
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Seu navegador não suporta reconhecimento de voz.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);

    setTemplate(newText);
    
    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const handleValueChange = (variable: string, value: string) => {
    setValues({
      ...values,
      [variable]: value
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        insertText(`\n<img src="${base64}" width="300" style="display: block; margin: 20px auto;" alt="Imagem" />\n`);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-slate-200 bg-slate-50 shrink-0 z-10">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => insertText('**', '**')} 
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600" 
            title="Negrito"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button 
            onClick={() => insertText('*', '*')} 
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600" 
            title="Itálico"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button 
            onClick={() => insertText('\n- ')} 
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600" 
            title="Lista"
          >
            <List className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-slate-300 mx-1"></div>
          <label className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600 cursor-pointer" title="Inserir Imagem">
            <ImageIcon className="w-4 h-4" />
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
          <div className="w-px h-6 bg-slate-300 mx-1"></div>
          <button 
            onClick={() => insertText('{', '}')} 
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors text-[10px] font-black uppercase tracking-widest"
            title="Inserir Variável"
          >
            <Plus className="w-3.5 h-3.5" />
            Variável
          </button>
          <div className="w-px h-6 bg-slate-300 mx-1"></div>
          <button 
            onClick={toggleListening}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest border ${
              isListening 
                ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' 
                : 'bg-white text-slate-600 border-slate-200 hover:border-sell-green hover:text-sell-green'
            }`}
            title={isListening ? "Parar Ditado" : "Iniciar Ditado por Voz"}
          >
            {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            {isListening ? "Ouvindo..." : "Ditado"}
          </button>
        </div>

        <button 
          onClick={() => setIsVariablesOpen(!isVariablesOpen)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest shadow-sm border ${
            isVariablesOpen 
              ? 'bg-sell-blue text-white border-sell-blue' 
              : 'bg-white text-slate-600 border-slate-200 hover:border-sell-green hover:text-sell-green'
          }`}
        >
          <Database className={`w-4 h-4 ${isVariablesOpen ? 'text-sell-green' : ''}`} />
          Dados do Contrato
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Editor de Documento</span>
            </div>
            <div className="flex items-center gap-4 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
              <span>Markdown Ativo</span>
              <div className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-red-500 animate-ping' : 'bg-sell-green animate-pulse'}`}></div>
            </div>
          </div>
          <textarea
            ref={textareaRef}
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="flex-1 p-10 font-mono text-sm resize-none focus:outline-none text-slate-700 leading-relaxed selection:bg-indigo-100"
            placeholder="Comece a escrever seu contrato aqui... Use {Variavel} para campos dinâmicos."
          />
        </div>

        {/* Variables Sidebar (Retrátil) */}
        <div 
          className={`absolute inset-y-0 right-0 z-20 w-80 bg-slate-50 border-l border-slate-200 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
            isVariablesOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-sell-green" />
              <span className="text-[11px] font-black text-sell-blue uppercase tracking-[0.2em]">Preenchimento</span>
            </div>
            <button 
              onClick={() => setIsVariablesOpen(false)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {variables.length === 0 ? (
              <div className="text-center py-12 px-6 flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-slate-100">
                  <Info className="w-6 h-6 text-slate-200" />
                </div>
                <p className="text-[10px] text-slate-400 italic leading-relaxed">
                  Nenhuma variável detectada no texto.<br />Use o formato {'{Nome}'} para criar campos.
                </p>
              </div>
            ) : (
              variables.map((variable) => (
                <div key={variable} className="flex flex-col gap-2 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-sell-blue transition-colors">
                    {variable.replace(/_/g, ' ')}
                  </label>
                  <input
                    type="text"
                    value={values[variable] || ''}
                    onChange={(e) => handleValueChange(variable, e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sell-blue focus:border-sell-blue transition-all shadow-sm placeholder:text-slate-300"
                    placeholder={`Inserir ${variable.toLowerCase()}...`}
                  />
                </div>
              ))
            )}
          </div>

          <div className="p-5 bg-white border-t border-slate-100">
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-[9px] text-indigo-700 font-bold leading-relaxed">
                DICA: Os dados preenchidos aqui serão aplicados automaticamente em todas as instâncias da variável no documento.
              </p>
            </div>
          </div>
        </div>

        {/* Overlay sutil para o editor quando o painel de variáveis está aberto */}
        {isVariablesOpen && (
          <div 
            className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 md:hidden"
            onClick={() => setIsVariablesOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

