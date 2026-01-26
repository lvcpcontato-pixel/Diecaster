import React, { useState, useEffect } from 'react';
import { Car } from '../types';
import { parseCSV, exportToCSV, importBatch, getSyncUrl, setSyncUrl, pushAllToCloud } from '../services/storageService';
import { Download, Upload, CheckCircle, AlertTriangle, HardDrive, FileText, Cloud, CloudOff, Link2, Send } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DataManagementProps {
  cars: Car[];
  onRefresh: (data: Car[]) => void;
  setLoading: (loading: boolean) => void;
}

export const DataManagement: React.FC<DataManagementProps> = ({ cars, onRefresh, setLoading }) => {
  const [csvInput, setCsvInput] = useState('');
  const [syncUrlInput, setSyncUrlInput] = useState('');
  const [isSynced, setIsSynced] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  useEffect(() => {
    const url = getSyncUrl();
    if (url) {
      setSyncUrlInput(url);
      setIsSynced(true);
    }
  }, []);

  const handleSaveSyncUrl = () => {
    if (syncUrlInput.startsWith('https://script.google.com')) {
      setSyncUrl(syncUrlInput);
      setIsSynced(true);
      setFeedback({ type: 'success', message: 'Conexão configurada! O App agora lerá da sua planilha.' });
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setFeedback({ type: 'error', message: 'URL Inválida. Use a URL do App da Web do Google Script.' });
    }
  };

  const handlePushToCloud = async () => {
    if (!confirm(`Deseja enviar todos os ${cars.length} itens locais para o Google Sheets? Isso pode levar alguns segundos.`)) return;
    setLoading(true);
    try {
      await pushAllToCloud(cars);
      setFeedback({ type: 'success', message: 'Sincronização completa! Verifique sua planilha.' });
    } catch (e) {
      setFeedback({ type: 'error', message: 'Erro ao enviar dados para a nuvem.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSync = () => {
    setSyncUrl('');
    setSyncUrlInput('');
    setIsSynced(false);
    setFeedback({ type: 'info', message: 'Sincronização desativada. Voltando ao modo local.' });
  };

  const handleImport = async () => {
    if (!csvInput.trim()) return;
    setLoading(true);
    try {
      const parsedCars = parseCSV(csvInput);
      const updatedCars = await importBatch(parsedCars);
      onRefresh(updatedCars);
      setFeedback({ type: 'success', message: `${parsedCars.length} registros importados.` });
      setCsvInput('');
    } catch (e) {
      setFeedback({ type: 'error', message: 'Erro ao importar CSV.' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csv = exportToCSV(cars);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diecast_backup_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const sortedCars = [...cars].sort((a, b) => a.marca.localeCompare(b.marca) || a.modelo.localeCompare(b.modelo));
    const tableColumn = ["Marca", "Modelo", "Fabricante", "Cor", "Ano", "Pack", "Observações"];
    const tableRows = sortedCars.map(car => [car.marca, car.modelo, car.fabricante, car.cor, car.ano || '', car.pack || '', car.observacoes || '']);

    doc.setFontSize(18);
    doc.text("Catálogo de Miniaturas", 14, 22);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: 'striped',
      headStyles: { fillColor: [46, 125, 50] },
      styles: { fontSize: 7 }
    });
    doc.save(`catalogo_diecast.pdf`);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-20">
      
      {/* CLOUD SYNC SECTION */}
      <div className={`rounded-2xl p-8 shadow-xl transition-all duration-500 ${isSynced ? 'bg-emerald-900 border-l-8 border-emerald-400' : 'bg-slate-900 border-l-8 border-slate-700'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-full ${isSynced ? 'bg-emerald-400/20 text-emerald-400' : 'bg-white/10 text-slate-400'}`}>
              {isSynced ? <Cloud size={32} className="animate-pulse" /> : <CloudOff size={32} />}
            </div>
            <div>
               <h3 className="text-xl font-bold text-white">Sincronização Ativa</h3>
               <p className="text-slate-400 text-sm">{isSynced ? 'Conectado à sua planilha online no Google Sheets.' : 'Trabalhando em modo offline (Local).'}</p>
            </div>
          </div>
          {isSynced && (
            <div className="flex gap-3">
              <button onClick={handlePushToCloud} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all border border-white/10">
                <Send size={14} /> Subir Local p/ Planilha
              </button>
              <button onClick={handleRemoveSync} className="text-xs font-bold text-rose-400 hover:text-rose-300 underline uppercase tracking-widest">
                Desconectar
              </button>
            </div>
          )}
        </div>

        {!isSynced ? (
          <div className="mt-8 space-y-4">
             <p className="text-slate-300 text-sm leading-relaxed">
               Conecte sua coleção diretamente a uma Planilha do Google para manter os dados seguros e editáveis em qualquer lugar.
             </p>
             <div className="flex flex-col sm:flex-row gap-2">
               <div className="relative flex-1">
                 <Link2 className="absolute left-3 top-3 text-slate-500" size={18} />
                 <input 
                    type="text" 
                    placeholder="URL do Google Script..."
                    value={syncUrlInput}
                    onChange={(e) => setSyncUrlInput(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                 />
               </div>
               <button 
                onClick={handleSaveSyncUrl}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold px-6 py-3 rounded-xl transition-all shadow-lg active:scale-95"
               >
                 Conectar
               </button>
             </div>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono bg-black/20 p-3 rounded-lg border border-white/5">
               <CheckCircle size={14} /> Link Ativo: {syncUrlInput.substring(0, 50)}...
            </div>
          </div>
        )}
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border shadow-sm animate-bounce-short ${
          feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
          feedback.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-700' :
          'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : feedback.type === 'info' ? <Cloud size={20} /> : <AlertTriangle size={20} />}
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4 text-slate-800">
            <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600">
              <Download size={20} />
            </div>
            <h3 className="font-bold text-lg">Exportar Cópia Local</h3>
          </div>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">Baixe uma cópia de segurança em formato CSV ou um PDF formatado para impressão.</p>
          <div className="mt-auto grid grid-cols-2 gap-4">
            <button onClick={handleExportCSV} className="py-3 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex justify-center items-center gap-2 font-bold text-sm border border-slate-200">
              <HardDrive size={16} /> CSV
            </button>
            <button onClick={handleExportPDF} className="py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex justify-center items-center gap-2 font-bold text-sm shadow-sm">
              <FileText size={16} /> PDF
            </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4 text-slate-800">
            <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-600">
              <Upload size={20} />
            </div>
            <h3 className="font-bold text-lg">Importar do CSV</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">Adicione itens em massa colando dados no formato CSV abaixo.</p>
          <textarea
            className="w-full flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-600 outline-none min-h-[120px] mb-4"
            placeholder="Cole o CSV aqui..."
            value={csvInput}
            onChange={(e) => setCsvInput(e.target.value)}
          />
          <button onClick={handleImport} disabled={!csvInput.trim()} className="w-full py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 font-bold text-sm">
            Processar Importação
          </button>
        </div>
      </div>
    </div>
  );
};