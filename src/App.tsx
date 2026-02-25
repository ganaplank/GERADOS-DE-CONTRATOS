import React, { useMemo, useState } from 'react';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { HiddenPDFTemplate } from './components/HiddenPDFTemplate';
import { useLocalStorage } from './hooks/useLocalStorage';
import { extractVariables, generatePDF, generateWord, replaceVariables } from './utils/documentUtils';
import { 
  Settings, 
  X, 
  Upload, 
  FileText, 
  Save, 
  Trash2, 
  PlusCircle, 
  LayoutDashboard, 
  Menu,
  ChevronLeft,
  Library,
  HelpCircle,
  Info,
  BookOpen
} from 'lucide-react';

const DEFAULT_TEMPLATE = `# CONTRATO DE PRESTAÇÃO DE SERVIÇOS

Pelo presente instrumento particular, de um lado **SELL ADMINISTRADORA**, com sede em São Paulo/SP, doravante denominada CONTRATADA, e de outro lado **{Nome_Cliente}**, portador(a) do CPF nº {CPF_Cliente}, residente e domiciliado(a) em {Endereco_Cliente}, doravante denominado(a) CONTRATANTE, firmam o presente contrato mediante as cláusulas a seguir:

## 1. DO OBJETO
O presente contrato tem como objeto a prestação de serviços de administração e consultoria imobiliária pela CONTRATADA ao CONTRATANTE.

## 2. DO VALOR E PAGAMENTO
Pela prestação dos serviços, o CONTRATANTE pagará à CONTRATADA o valor total de **R$ {Valor_Contrato}** ({Valor_Extenso}), a ser quitado na data de {Data_Pagamento}.

## 3. DO PRAZO
O presente contrato terá vigência de {Prazo_Meses} meses, iniciando-se na data de sua assinatura.

## 4. DO FORO
As partes elegem o foro da Comarca de São Paulo/SP para dirimir quaisquer dúvidas oriundas deste instrumento.

E por estarem justos e contratados, assinam o presente em 02 (duas) vias de igual teor.

{Cidade}, {Data_Atual}

<br /><br />

___________________________________________________
**SELL ADMINISTRADORA**

<br /><br />

___________________________________________________
**{Nome_Cliente}**
`;

export default function App() {
  const [template, setTemplate] = useLocalStorage<string>('sell-doc-template', DEFAULT_TEMPLATE);
  const [values, setValues] = useLocalStorage<Record<string, string>>('sell-doc-values', {});
  const [savedTemplates, setSavedTemplates] = useLocalStorage<Array<{id: string, name: string, content: string}>>('sell-saved-templates', []);
  const [currentTemplateName, setCurrentTemplateName] = useState('Novo Contrato');
  
  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'templates' | 'help'>('templates');

  const variables = useMemo(() => extractVariables(template), [template]);

  const handleDownloadPDF = async () => {
    try {
      await generatePDF('hidden-pdf-export', `Contrato_${values['Nome_Cliente'] || 'Sell'}.pdf`);
    } catch (error) {
      alert('Erro ao gerar PDF. Verifique se o logo existe na pasta public.');
    }
  };

  const handleDownloadWord = async () => {
    const processedContent = replaceVariables(template, values);
    await generateWord(processedContent, `Contrato_${values['Nome_Cliente'] || 'Sell'}.docx`);
  };

  const saveTemplate = () => {
    const name = prompt('Nome do modelo:', currentTemplateName);
    if (name) {
      const newTemplate = {
        id: Date.now().toString(),
        name,
        content: template
      };
      setSavedTemplates([...savedTemplates, newTemplate]);
      setCurrentTemplateName(name);
    }
  };

  const loadTemplate = (id: string) => {
    const t = savedTemplates.find(item => item.id === id);
    if (t) {
      setTemplate(t.content);
      setCurrentTemplateName(t.name);
      setIsSidebarOpen(false); // Fecha a sidebar ao carregar
    }
  };

  const deleteTemplate = (id: string) => {
    if (confirm('Deseja excluir este modelo?')) {
      setSavedTemplates(savedTemplates.filter(item => item.id !== id));
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Header Corporativo Sell */}
      <header className="bg-sell-blue text-white px-6 py-4 shadow-2xl z-40 shrink-0 border-b-4 border-sell-green">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-all active:scale-95"
              title="Meus Modelos"
            >
              <Menu className="w-6 h-6 text-sell-green" />
            </button>
            
            <div className="bg-white p-1.5 rounded-lg shadow-sm">
              <img 
                src="/logo-sell.png" 
                alt="Sell Administradora" 
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="h-8 w-8 flex items-center justify-center text-sell-blue font-black text-lg">S</div>';
                }}
              />
            </div>
            <div className="h-8 w-px bg-white/20 hidden sm:block"></div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-black tracking-[0.1em] uppercase leading-tight">SISTEMA DE DOCUMENTOS</h1>
              <p className="text-[9px] text-white/50 font-bold tracking-widest uppercase">Sell Administradora</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-black/20 px-4 py-2 rounded-lg border border-white/5 mr-2">
              <FileText className="w-3.5 h-3.5 text-sell-green" />
              <span className="text-xs font-bold text-white/80 truncate max-w-[150px]">{currentTemplateName}</span>
            </div>
            
            <button 
              onClick={saveTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-sell-green hover:bg-green-600 text-white rounded-lg transition-all text-[10px] font-black uppercase tracking-wider shadow-lg active:scale-95"
            >
              <Save className="w-4 h-4" />
              Salvar
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Retrátil (Drawer) */}
        <div 
          className={`absolute inset-y-0 left-0 z-30 w-80 bg-white border-r border-slate-200 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="text-[11px] font-black text-sell-blue uppercase tracking-[0.2em] flex items-center gap-2">
              <Library className="w-4 h-4 text-sell-green" />
              Menu do Sistema
            </h3>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 hover:bg-slate-200 rounded-md text-slate-400 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setActiveSidebarTab('templates')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-b-2 ${
                activeSidebarTab === 'templates' 
                  ? 'border-sell-green text-sell-blue bg-slate-50/50' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Library className="w-3.5 h-3.5" />
              Modelos
            </button>
            <button
              onClick={() => setActiveSidebarTab('help')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-b-2 ${
                activeSidebarTab === 'help' 
                  ? 'border-sell-green text-sell-blue bg-slate-50/50' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Como Usar
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {activeSidebarTab === 'templates' ? (
              <div className="p-3 space-y-1">
                {savedTemplates.length === 0 ? (
                  <div className="p-10 text-center flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-[10px] text-slate-400 italic leading-relaxed">
                      Sua biblioteca está vazia.<br />Crie um modelo e salve para vê-lo aqui.
                    </p>
                  </div>
                ) : (
                  savedTemplates.map(t => (
                    <div 
                      key={t.id} 
                      className={`group flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer border ${
                        currentTemplateName === t.name 
                          ? 'bg-indigo-50 border-indigo-100 text-indigo-700' 
                          : 'hover:bg-slate-50 border-transparent text-slate-600'
                      }`}
                      onClick={() => loadTemplate(t.id)}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className={`w-4 h-4 shrink-0 ${currentTemplateName === t.name ? 'text-indigo-500' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold truncate">{t.name}</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id); }}
                        className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="p-6 space-y-8">
                <section className="space-y-3">
                  <h4 className="text-[10px] font-black text-sell-blue uppercase tracking-widest flex items-center gap-2">
                    <PlusCircle className="w-3.5 h-3.5 text-sell-green" />
                    Campos Automáticos
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Para criar um campo que você preencherá depois, use chaves. 
                    O sistema criará um formulário automaticamente para cada campo.
                  </p>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-[10px] text-indigo-600">
                    Exemplo: "Eu, {"{Nome_Completo}"}, portador do CPF {"{CPF}"}..."
                  </div>
                </section>

                <section className="space-y-3">
                  <h4 className="text-[10px] font-black text-sell-blue uppercase tracking-widest flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-sell-green" />
                    Títulos e Seções
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Organize seu documento usando o símbolo de cerquilha (#) no início da linha.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-[10px] text-slate-600">
                      <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sell-blue font-bold">#</code>
                      Título Principal (Grande)
                    </li>
                    <li className="flex items-center gap-2 text-[10px] text-slate-600">
                      <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sell-blue font-bold">##</code>
                      Subtítulo (Médio)
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h4 className="text-[10px] font-black text-sell-blue uppercase tracking-widest flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-sell-green" />
                    Formatação de Texto
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Destaque partes importantes do seu contrato com estilos simples.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-[10px] font-mono text-slate-500">**texto em negrito**</span>
                      <span className="text-[10px] font-bold text-slate-800">Negrito</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-[10px] font-mono text-slate-500">*texto em itálico*</span>
                      <span className="text-[10px] italic text-slate-800">Itálico</span>
                    </div>
                  </div>
                </section>

                <div className="p-4 bg-sell-blue/5 rounded-xl border border-sell-blue/10">
                  <p className="text-[10px] text-sell-blue font-bold leading-relaxed text-center">
                    Dúvidas? Entre em contato com o suporte interno da Sell Administradora.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {activeSidebarTab === 'templates' && (
            <div className="p-5 border-t border-slate-100 bg-slate-50">
              <button 
                onClick={() => { 
                  setTemplate(DEFAULT_TEMPLATE); 
                  setCurrentTemplateName('Novo Contrato'); 
                  setIsSidebarOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 hover:border-sell-green hover:text-sell-green text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Novo Documento
              </button>
            </div>
          )}
        </div>

        {/* Overlay de desfoque ao abrir a sidebar */}
        {isSidebarOpen && (
          <div 
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] z-20 transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Área Principal (Editor + Variáveis) */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Editor
            template={template}
            setTemplate={setTemplate}
            variables={variables}
            values={values}
            setValues={setValues}
          />
        </div>

        {/* Floating Preview Window */}
        <Preview
          template={template}
          values={values}
          onDownloadPDF={handleDownloadPDF}
          onDownloadWord={handleDownloadWord}
        />

        {/* Hidden PDF Export Container */}
        <HiddenPDFTemplate 
          template={template}
          values={values}
          id="hidden-pdf-export"
        />
      </main>

      {/* Rodapé Corporativo Sell */}
      <footer className="bg-white border-t border-slate-200 py-3 shrink-0 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-[1800px] mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">
            © 2026 SELL ADMINISTRADORA • USO INTERNO E CONFIDENCIAL
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 text-[9px] text-slate-500 font-bold tracking-wider">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-sell-green rounded-full"></span>
              (11) 3796-0203
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-sell-green rounded-full"></span>
              atendimento@selladm.com.br
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-sell-green rounded-full"></span>
              selladm.com.br
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
