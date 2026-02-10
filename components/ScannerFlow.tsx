
import React, { useState } from 'react';
import { Car } from '../types';
import { analyzeCarImage } from '../services/aiService';
import { Camera, CheckCircle, Loader2, ScanLine, CloudUpload, X, Sparkles, AlertTriangle, Layers, AlertCircle } from 'lucide-react';

interface ScannerFlowProps {
  cars: Car[];
  onCatalogItem: (preFilledData: Partial<Car>) => void;
  onDirectSave: (car: Car) => Promise<void>;
  onCancel: () => void;
}

interface MatchResult extends Car {
  matchType: 'exact' | 'strong' | 'potential';
  matchReason: string;
}

export const ScannerFlow: React.FC<ScannerFlowProps> = ({ cars, onCatalogItem, onDirectSave, onCancel }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<Partial<Car> | null>(null);
  const [currentBase64, setCurrentBase64] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [step, setStep] = useState<'scan' | 'result'>('scan');

  const normalize = (val: string | undefined) => (val || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

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

  const performCheck = (aiData: Partial<Car>) => {
    const aiMarca = normalize(aiData.marca);
    const aiModeloRaw = normalize(aiData.modelo);
    
    // Remove brand name from model string to avoid "Toyota Corolla" matching "Toyota Supra" just because of "Toyota"
    const cleanModel = (model: string, brand: string) => {
       return model.replace(brand, '').trim();
    };

    const aiModelo = cleanModel(aiModeloRaw, aiMarca);

    if (!aiModelo) return;

    // Helper: Split model into words (tokens)
    const getTokens = (str: string) => str.split(/\s+/).filter(w => w.length > 1);
    const aiTokens = getTokens(aiModelo);

    const foundMatches: MatchResult[] = [];

    cars.forEach(car => {
      const carMarca = normalize(car.marca);
      
      // 1. Strict Brand Filter: Only compare if brands match (or if one is missing)
      if (aiMarca && carMarca && aiMarca !== carMarca) {
         return; 
      }

      const carModeloRaw = normalize(car.modelo);
      const carModelo = cleanModel(carModeloRaw, carMarca); // Remove brand from existing car model too

      // 2. Check for Exact Match
      if (carModelo === aiModelo) {
         foundMatches.push({ ...car, matchType: 'exact', matchReason: 'Modelo Idêntico' });
         return;
      }

      // 3. Token-based matching (Words Intersection)
      const carTokens = getTokens(carModelo);
      
      // Find words present in both
      const commonTokens = aiTokens.filter(token => carTokens.includes(token));
      
      // Logic: 
      // - Must have overlap.
      // - If numeric model (e.g. "911", "350z"), 1 token match is enough.
      // - If word model (e.g. "Land Cruiser"), require significant overlap or subset.
      
      const isSubset = commonTokens.length === Math.min(aiTokens.length, carTokens.length);
      const hasMultiTokenMatch = commonTokens.length >= 2;
      const hasNumericMatch = commonTokens.length === 1 && /\d/.test(commonTokens[0]); // Matches "911", "GT3", "F-150"

      if ((isSubset && commonTokens.length > 0) || hasMultiTokenMatch || hasNumericMatch) {
          const mfgMatch = normalize(car.fabricante) === normalize(aiData.fabricante);
          const colorMatch = normalize(car.cor) === normalize(aiData.cor);

          if (mfgMatch && colorMatch) {
             foundMatches.push({ ...car, matchType: 'strong', matchReason: 'Variação muito próxima' });
          } else {
             foundMatches.push({ ...car, matchType: 'potential', matchReason: 'Modelo Similar' });
          }
      }
    });

    foundMatches.sort((a, b) => {
      const order = { exact: 0, strong: 1, potential: 2 };
      return order[a.matchType] - order[b.matchType];
    });

    setMatches(foundMatches);
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
             <Sparkles size={10}/> Tecnologia Gemini
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
                    <span className="text-slate-400 text-sm italic">Identificando miniatura</span>
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
    <div className="max-w-6xl mx-auto animate-fade-in pb-20 px-4">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => setStep('scan')} className="text-slate-400 hover:text-slate-900 flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors">← Refazer Scan</button>
        <button onClick={onCancel} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={24} /></button>
      </div>
      
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row gap-8 items-center border-b-8 border-b-emerald-500 relative overflow-hidden">
         {isSaving && (
           <div className="absolute inset-0 bg-white/90 z-50 flex flex-col items-center justify-center animate-fade-in">
              <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
              <p className="font-display text-emerald-800 uppercase italic">Salvando na Nuvem...</p>
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
                 <div className="text-amber-800 font-display text-lg flex items-center gap-2 justify-center">
                    <AlertTriangle size={18} /> POSSÍVEL REPETIDO
                 </div>
                 <div className="text-amber-600 text-[10px] font-bold uppercase tracking-widest">{matches.length} similares encontrados</div>
              </div>
           )}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
         <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <h3 className="text-slate-400 font-bold uppercase text-[10px] tracking-widest ml-4 flex items-center gap-2">
                 <Sparkles size={12}/> Dados Extraídos pela IA
              </h3>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-2 gap-6">
                <div className="space-y-4">
                   <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Marca (Carro)</label>
                      <p className="text-slate-800 font-bold text-lg">{analyzedData?.marca || '-'}</p>
                   </div>
                   <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Fabricante (Mini)</label>
                      <p className="text-slate-800 font-bold text-lg">{analyzedData?.fabricante || '-'}</p>
                   </div>
                </div>
                <div className="space-y-4">
                   <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Modelo</label>
                      <p className="text-slate-800 font-bold text-lg">{analyzedData?.modelo || '-'}</p>
                   </div>
                   <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Cor</label>
                      <p className="text-slate-800 font-bold text-lg">{analyzedData?.cor || '-'}</p>
                   </div>
                </div>
              </div>
            </div>

            {matches.length > 0 && (
              <div className="space-y-4 animate-slide-up">
                <h3 className="text-amber-600 font-bold uppercase text-[10px] tracking-widest ml-4 flex items-center gap-2">
                   <AlertCircle size={12}/> Alertas de Cruzamento ({matches.length})
                </h3>
                <div className="bg-amber-50/30 border border-amber-100 rounded-3xl overflow-hidden shadow-inner">
                   {matches.map((car, idx) => (
                      <div key={car.id} className={`p-5 flex items-center gap-5 ${idx !== matches.length - 1 ? 'border-b border-amber-100' : ''} hover:bg-amber-50 transition-colors`}>
                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${car.matchType === 'exact' ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-amber-100 text-amber-600 border-amber-200'}`}>
                            {car.matchType === 'exact' ? <AlertCircle size={24} /> : <Layers size={24} />}
                         </div>
                         <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                               <p className="text-sm font-bold text-slate-900 truncate">{car.marca} {car.modelo}</p>
                               <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${car.matchType === 'exact' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'}`}>
                                  {car.matchReason}
                               </span>
                            </div>
                            <p className="text-[10px] text-slate-500 truncate uppercase tracking-tight flex items-center gap-2">
                               <span className="font-bold text-slate-700">{car.fabricante}</span> • {car.cor} • {car.ano || 'S/ Ano'}
                            </p>
                         </div>
                      </div>
                   ))}
                </div>
              </div>
            )}
            
            <button 
              onClick={() => onCatalogItem(analyzedData || {})}
              className="w-full py-4 text-slate-500 hover:text-emerald-600 text-xs font-bold uppercase tracking-widest border-2 border-slate-200 border-dashed rounded-2xl transition-all hover:border-emerald-500/50 hover:bg-emerald-50/50"
            >
              Corrigir Manualmente antes de Salvar
            </button>
         </div>
         
         <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col h-full lg:sticky lg:top-8">
            <div className="absolute top-0 right-0 p-8 text-white/5 rotate-12 pointer-events-none">
               <CloudUpload size={160} />
            </div>
            
            <div className="relative z-10 flex-1">
              <h3 className="text-3xl font-display text-white italic mb-4">Finalizar?</h3>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                Este item será adicionado à sua planilha e ficará disponível em todos os dispositivos.
              </p>

              {matches.some(m => m.matchType === 'exact') ? (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl mb-8">
                  <p className="text-rose-400 text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={14} /> ITEM IDÊNTICO DETECTADO
                  </p>
                  <p className="text-rose-400/70 text-[10px] mt-1">
                    Você já possui exatamente este modelo. Catalogar duplicatas pode poluir seu inventário.
                  </p>
                </div>
              ) : matches.length > 0 ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-8">
                  <p className="text-amber-400 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle size={14} /> POSSÍVEL REPETIDO
                  </p>
                  <p className="text-amber-400/70 text-[10px] mt-1">
                    Modelos similares encontrados. Verifique a lista ao lado.
                  </p>
                </div>
              ) : null}
            </div>
            
            <div className="relative z-10 space-y-4">
              <button 
                onClick={handleDirectSaveClick}
                disabled={isSaving}
                className="w-full py-6 bg-emerald-500 hover:bg-white hover:text-slate-900 text-slate-950 rounded-2xl font-display text-2xl uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-[0_10px_40px_rgba(16,185,129,0.3)] active:scale-95 group disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={28} /> : <>Salvar na Frota <CloudUpload size={28} /></>}
              </button>
            </div>
         </div>
      </div>
    </div>
  );
};
