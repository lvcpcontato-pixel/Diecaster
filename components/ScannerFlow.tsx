
import React, { useState } from 'react';
import { Car } from '../types';
import { analyzeCarImage } from '../services/aiService';
import { Camera, Search, AlertCircle, CheckCircle, Loader2, Image as ImageIcon, ScanLine, CloudUpload, X, Sparkles } from 'lucide-react';

interface ScannerFlowProps {
  cars: Car[];
  onCatalogItem: (preFilledData: Partial<Car>) => void;
  onDirectSave: (car: Car) => Promise<void>;
  onCancel: () => void;
}

export const ScannerFlow: React.FC<ScannerFlowProps> = ({ cars, onCatalogItem, onDirectSave, onCancel }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<Partial<Car> | null>(null);
  const [currentBase64, setCurrentBase64] = useState<string | null>(null);
  const [matches, setMatches] = useState<Car[]>([]);
  const [manualSearch, setManualSearch] = useState('');
  const [step, setStep] = useState<'scan' | 'result'>('scan');

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target?.result as string; };
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxDim = 1024; 
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) { height *= maxDim / width; width = maxDim; }
        } else {
          if (height > maxDim) { width *= maxDim / height; height = maxDim; }
        }
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => reject(new Error("Erro ao carregar imagem"));
      reader.readAsDataURL(file);
    });
  };

  const performCheck = (criteria: Partial<Car>) => {
    const searchTerm = String(criteria.modelo || manualSearch || '').toLowerCase().trim();
    if (!searchTerm) return;
    const found = cars.filter(car => {
      const carModelo = String(car.modelo || '').toLowerCase();
      const carMarca = String(car.marca || '').toLowerCase();
      return carModelo.includes(searchTerm) && (criteria.marca ? carMarca.includes(String(criteria.marca).toLowerCase()) : true);
    });
    setMatches(found);
    setStep('result');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnalyzing(true);
    try {
      const resizedBase64 = await resizeImage(file);
      setCurrentBase64(resizedBase64);
      const base64Data = resizedBase64.split(',')[1];
      const analysis = await analyzeCarImage(base64Data, 'image/jpeg');
      setAnalyzedData({ ...analysis, fotoBase64: resizedBase64 });
      performCheck(analysis);
    } catch (error: any) {
      alert("Houve um problema ao analisar a foto.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDirectSaveClick = async () => {
    if (!analyzedData) return;
    setIsSaving(true);
    try {
      const carToSave: Car = {
        id: Date.now().toString(),
        marca: analyzedData.marca || 'Desconhecida',
        modelo: analyzedData.modelo || 'Desconhecido',
        fabricante: analyzedData.fabricante || 'Desconhecido',
        cor: analyzedData.cor || '',
        ano: analyzedData.ano || '',
        pack: analyzedData.pack || '',
        observacoes: analyzedData.observacoes || '',
        fotoBase64: analyzedData.fotoBase64
      };
      await onDirectSave(carToSave);
    } catch (error) {
      alert("Erro ao salvar. Verifique se o Google Script está configurado.");
    } finally {
      setIsSaving(false);
    }
  };

  if (step === 'scan') {
    return (
      <div className="max-w-2xl mx-auto space-y-10 animate-fade-in text-center py-8">
        <div className="space-y-4">
           <div className="inline-flex items-center justify-center p-4 bg-emerald-500 rounded-3xl text-white shadow-xl shadow-emerald-500/20 mb-4">
              <ScanLine size={48} />
           </div>
           <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Scanner Inteligente</h2>
           <p className="text-slate-500 text-lg">Tire uma foto e a IA identificará os detalhes.</p>
           <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
             <Sparkles size={10}/> Tecnologia Gratuita Gemini Flash
           </div>
        </div>
        
        <div className="flex justify-center">
           <label className={`w-full max-w-sm aspect-square rounded-[40px] bg-white border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-all duration-300 group ${isAnalyzing ? 'opacity-75 pointer-events-none' : ''}`}>
             {isAnalyzing ? (
               <div className="flex flex-col items-center gap-6">
                 <div className="relative">
                    <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
                    <Camera className="absolute inset-0 m-auto text-emerald-300" size={24} />
                 </div>
                 <div className="text-center">
                    <span className="block text-emerald-600 font-bold text-xl animate-pulse">Analisando Imagem...</span>
                    <span className="text-slate-400 text-sm italic">Isso é grátis e leva poucos segundos</span>
                 </div>
               </div>
             ) : (
               <>
                 <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center group-hover:bg-emerald-100 transition-colors mb-4">
                   <Camera className="w-12 h-12 text-emerald-600" strokeWidth={1.5} />
                 </div>
                 <span className="text-xl font-bold text-slate-700 group-hover:text-emerald-700 uppercase tracking-tighter">Tirar Foto</span>
                 <span className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-bold">Usar Câmera</span>
               </>
             )}
             <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
           </label>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-20">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => setStep('scan')} className="text-slate-400 hover:text-slate-900 flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors">← Refazer Scan</button>
        <button onClick={onCancel} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={24} /></button>
      </div>
      
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row gap-8 items-center border-b-8 border-b-emerald-500 relative overflow-hidden">
         {isSaving && (
           <div className="absolute inset-0 bg-white/90 z-50 flex flex-col items-center justify-center animate-fade-in">
              <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
              <p className="font-display text-emerald-800 uppercase italic">Salvando na Nuvem...</p>
              <p className="text-slate-400 text-xs italic">Armazenamento grátis via Google Drive/Sheets</p>
           </div>
         )}
         <div className="relative">
            {currentBase64 && (
              <img src={currentBase64} className="w-48 h-48 object-cover rounded-2xl border border-slate-100 shadow-2xl rotate-2" alt="Preview" />
            )}
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-lg shadow-lg">
               <CheckCircle size={20} />
            </div>
         </div>
         <div className="flex-1 text-center md:text-left space-y-2">
            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.3em]">IA Identificou:</div>
            <h2 className="text-4xl font-display text-slate-900 uppercase italic tracking-tighter">
              {analyzedData?.marca || 'Desconhecido'} {analyzedData?.modelo || 'Miniatura'}
            </h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
               <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-600 text-xs font-bold uppercase">{analyzedData?.fabricante || 'HW'}</span>
               <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-600 text-xs font-bold uppercase">{analyzedData?.cor || 'Padrão'}</span>
            </div>
         </div>
         
         <div className="shrink-0">
           {matches.length === 0 ? (
              <div className="bg-emerald-50 border border-emerald-100 px-8 py-4 rounded-2xl text-center">
                 <div className="text-emerald-800 font-display text-lg">ITEM NOVO</div>
                 <div className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest">Livre de Repetidos</div>
              </div>
           ) : (
              <div className="bg-amber-50 border border-amber-100 px-8 py-4 rounded-2xl text-center">
                 <div className="text-amber-800 font-display text-lg">REPETIDO?</div>
                 <div className="text-amber-600 text-[10px] font-bold uppercase tracking-widest">{matches.length} similares na base</div>
              </div>
           )}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
         <div className="space-y-4">
            <h3 className="text-slate-400 font-bold uppercase text-[10px] tracking-widest ml-4">Dados da IA</h3>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-2 gap-4">
               <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Marca</label>
                  <p className="text-slate-800 font-bold">{analyzedData?.marca}</p>
               </div>
               <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Modelo</label>
                  <p className="text-slate-800 font-bold">{analyzedData?.modelo}</p>
               </div>
               <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Fabricante</label>
                  <p className="text-slate-800 font-bold">{analyzedData?.fabricante}</p>
               </div>
               <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Ano/Pack</label>
                  <p className="text-slate-800 font-bold">{analyzedData?.ano || '-'} {analyzedData?.pack || '-'}</p>
               </div>
            </div>
            
            <button 
              onClick={() => onCatalogItem(analyzedData || {})}
              className="w-full py-3 text-slate-400 hover:text-emerald-600 text-xs font-bold uppercase tracking-widest border border-slate-200 border-dashed rounded-xl transition-all"
            >
              Corrigir Manualmente
            </button>
         </div>
         
         <div className="bg-slate-900 p-8 rounded-[32px] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 text-white/5 rotate-12">
               <CloudUpload size={120} />
            </div>
            <h3 className="text-2xl font-display text-white italic mb-4 relative z-10">Tudo Certo?</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed relative z-10">Confirme para salvar na sua planilha do Google Sheets gratuitamente.</p>
            
            <button 
              onClick={handleDirectSaveClick}
              disabled={isSaving}
              className="w-full py-5 bg-emerald-500 hover:bg-white hover:text-slate-900 text-slate-950 rounded-2xl font-display text-xl uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)] active:scale-95 group relative z-10 disabled:opacity-50"
            >
               Confirmar & Salvar <CloudUpload size={24} className="group-hover:translate-y-[-2px] transition-transform" />
            </button>
            
            <p className="text-center text-slate-500 text-[10px] mt-6 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
              <Sparkles size={10}/> Processamento Gratuito via Gemini Flash
            </p>
         </div>
      </div>
    </div>
  );
};
