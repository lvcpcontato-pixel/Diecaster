
import React, { useState, useEffect } from 'react';
import { Car } from '../types';
import { parseCSV, exportToCSV, importBatch, getSyncUrl, pushAllToCloud } from '../services/storageService';
import { Download, Upload, CheckCircle, AlertTriangle, FileText, Cloud, Send, ShieldCheck, Save } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DataManagementProps {
  cars: Car[];
  onRefresh: (data: Car[]) => void;
  setLoading: (loading: boolean) => void;
}

export const DataManagement: React.FC<DataManagementProps> = ({ cars, onRefresh, setLoading }) => {
  const [csvInput, setCsvInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  const handlePushToCloud = async () => {
    if (!confirm(`Deseja enviar todos os ${cars.length} itens locais para a planilha?`)) return;
    setLoading(true);
    try {
      await pushAllToCloud(cars);
      setFeedback({ type: 'success', message: 'Sincronização completa!' });
    } catch (e) { setFeedback({ type: 'error', message: 'Erro ao sincronizar.' }); }
    finally { setLoading(false); }
  };

  const handleImport = async () => {
    if (!csvInput.trim()) return;
    setLoading(true);
    try {
      const parsedCars = parseCSV(csvInput);
      const updatedCars = await importBatch(parsedCars);
      onRefresh(updatedCars);
      setFeedback({ type: 'success', message: 'Importado com sucesso!' });
      setCsvInput('');
    } catch (e) { setFeedback({ type: 'error', message: 'Erro ao importar.' }); }
    finally { setLoading(false); }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const sortedCars = [...cars].sort((a, b) => a.marca.localeCompare(b.marca) || a.modelo.localeCompare(b.modelo));
    autoTable(doc, { 
      head: [["Marca", "Modelo", "Fabricante", "Cor", "Ano"]], 
      body: sortedCars.map(c => [c.marca, c.modelo, c.fabricante, c.cor, c.ano || '']), 
      startY: 30 
    });
    doc.save(`catalogo_leo.pdf`);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-20">
      
      {/* HEADER STATUS */}
      <div className="bg-slate-900 rounded-[32px] p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 justify-center md:justify-start">
              <Cloud className="text-emerald-400" /> Status da Nuvem
            </h3>
            <p className="text-slate-400 text-sm">O app está conectado à sua planilha oficial.</p>
          </div>
          <button 
            onClick={handlePushToCloud}
            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl flex items-center gap-3 transition-all shadow-xl shadow-emerald-500/20"
          >
            <Send size={20} /> Forçar Sincronização Geral
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border animate-bounce-short ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          <CheckCircle size={20} /> {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full">
          <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Download size={18} className="text-blue-500" /> Exportar Dados</h3>
          <p className="text-xs text-slate-500 mb-6">Baixe uma cópia do seu catálogo em PDF ou CSV.</p>
          <div className="mt-auto flex gap-3">
            <button onClick={() => { 
              const csv = exportToCSV(cars); 
              const blob = new Blob([csv], { type: 'text/csv' }); 
              const url = URL.createObjectURL(blob); 
              const a = document.createElement('a'); 
              a.href = url; 
              a.download = 'backup_garagem_leo.csv'; 
              a.click(); 
            }} className="flex-1 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-sm">CSV Excel</button>
            <button onClick={handleExportPDF} className="flex-1 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold text-sm">PDF Catálogo</button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full">
          <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-500" /> Segurança</h3>
          <p className="text-xs text-slate-500 mb-4">Suas chaves de acesso estão embutidas no aplicativo para sua conveniência.</p>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
             <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Configuração</span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase">Ativa</span>
             </div>
             <p className="text-[10px] text-slate-600 truncate italic">Conectado a: Google Sheets API v4</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-2">Importar de Backup</h3>
        <p className="text-xs text-slate-500 mb-4">Cole o conteúdo de um arquivo CSV para restaurar itens em massa.</p>
        <textarea 
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-[10px] outline-none min-h-[120px] mb-4 focus:ring-2 focus:ring-slate-900 transition-all" 
          placeholder="Cole aqui o texto do seu CSV..." 
          value={csvInput} 
          onChange={(e) => setCsvInput(e.target.value)} 
        />
        <button 
          onClick={handleImport} 
          disabled={!csvInput.trim()} 
          className="w-full py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 font-bold text-sm disabled:opacity-50 transition-all"
        >
          Processar Importação
        </button>
      </div>
    </div>
  );
};
