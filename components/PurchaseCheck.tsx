import React, { useState } from 'react';
import { Car } from '../types';
import { analyzeCarImage } from '../services/aiService';
import { Camera, Search, AlertCircle, CheckCircle, Loader2, Image as ImageIcon, ScanSearch } from 'lucide-react';

interface PurchaseCheckProps {
  cars: Car[];
  onNavigateToCollection: () => void;
}

export const PurchaseCheck: React.FC<PurchaseCheckProps> = ({ cars, onNavigateToCollection }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<Partial<Car> | null>(null);
  const [matches, setMatches] = useState<Car[]>([]);
  const [manualSearch, setManualSearch] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const performCheck = (criteria: Partial<Car>) => {
    if (!criteria.modelo && !criteria.marca) return;

    const searchTerm = (criteria.modelo || manualSearch).toLowerCase();
    const brandTerm = (criteria.marca || '').toLowerCase();

    const found = cars.filter(car => {
      const matchModel = car.modelo.toLowerCase().includes(searchTerm);
      // If brand is provided by AI, strictly check it. If manual search, ignore brand unless typed.
      const matchBrand = brandTerm ? car.marca.toLowerCase().includes(brandTerm) : true;
      return matchModel && matchBrand;
    });

    setMatches(found);
    setHasSearched(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setHasSearched(false);
    
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        
        const analysis = await analyzeCarImage(base64Data, file.type);
        setAnalyzedData(analysis);
        performCheck(analysis);
      } catch (error) {
        alert("Erro ao analisar imagem.");
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzedData({ modelo: manualSearch }); // Mock for display
    performCheck({ modelo: manualSearch });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-20">
      
      {/* Header Section */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-2">
          <ScanSearch className="text-blue-600" />
          Verificador de Compra
        </h2>
        <p className="text-slate-500 text-sm">
          Está na loja? Tire uma foto ou digite o nome para saber se já tem esse item.
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          
          {/* AI Camera Input */}
          <div className="space-y-3">
             <div className="font-semibold text-slate-700 text-sm mb-2">Opção 1: Scan Inteligente</div>
             <label className={`
                w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-blue-200 rounded-xl cursor-pointer
                hover:bg-blue-50 transition-colors group
                ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}
              `}>
                {isAnalyzing ? (
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                ) : (
                  <Camera className="w-10 h-10 text-blue-400 group-hover:text-blue-600 transition-colors" />
                )}
                <span className="mt-2 text-sm text-slate-600 font-medium">
                  {isAnalyzing ? 'Analisando...' : 'Tirar Foto / Carregar'}
                </span>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="hidden" 
                  onChange={handleImageUpload}
                />
             </label>
          </div>

          {/* Manual Input */}
          <div className="h-full flex flex-col justify-center">
             <div className="font-semibold text-slate-700 text-sm mb-3">Opção 2: Busca Rápida</div>
             <form onSubmit={handleManualSubmit} className="relative">
               <input 
                  type="text" 
                  placeholder="Digite o modelo (ex: NSX)"
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
               />
               <button 
                type="submit"
                className="absolute right-2 top-2 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-600 transition-colors"
               >
                 <Search size={20} />
               </button>
             </form>
          </div>

        </div>
      </div>

      {/* Results Section */}
      {hasSearched && (
        <div className="animate-fade-in">
          {/* AI Analysis Recap */}
          {analyzedData && analyzedData.marca && (
             <div className="mb-6 bg-slate-100 p-4 rounded-lg border border-slate-200 flex items-center gap-3">
                <div className="p-2 bg-white rounded-md shadow-sm">
                   <ImageIcon size={20} className="text-slate-500" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase font-bold">Item Identificado</div>
                  <div className="text-slate-800 font-medium">
                    {analyzedData.marca} {analyzedData.modelo} <span className="text-slate-400 font-normal">({analyzedData.cor || 'Cor N/A'})</span>
                  </div>
                </div>
             </div>
          )}

          {matches.length > 0 ? (
            /* Match Found - Warning */
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl flex items-start gap-4">
                 <AlertCircle className="w-8 h-8 text-amber-500 shrink-0" />
                 <div>
                    <h3 className="text-lg font-bold text-amber-800">Cuidado! Você já tem itens parecidos.</h3>
                    <p className="text-amber-700">Encontramos <strong>{matches.length}</strong> itens na sua coleção que coincidem com a busca.</p>
                 </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                  Itens na sua coleção
                </div>
                {matches.map(car => (
                  <div key={car.id} className="p-4 border-b border-slate-100 last:border-0 flex justify-between items-center hover:bg-slate-50">
                     <div>
                        <div className="font-bold text-slate-800">{car.marca} {car.modelo}</div>
                        <div className="text-sm text-slate-500">{car.fabricante} • {car.cor} • {car.ano || 'Ano N/A'}</div>
                        {car.pack && <div className="text-xs text-blue-600 mt-1 bg-blue-50 inline-block px-2 py-0.5 rounded">{car.pack}</div>}
                     </div>
                     <div className="text-right text-xs text-slate-400">
                        Adicionado em:<br/>
                        {new Date(parseInt(car.id.substring(0, 13)) || Date.now()).toLocaleDateString()}
                     </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* No Match - Success */
            <div className="bg-green-50 border border-green-200 p-8 rounded-xl flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <div>
                   <h3 className="text-2xl font-bold text-green-800">Sinal Verde!</h3>
                   <p className="text-green-700 mt-2 text-lg">
                     Nenhum registro encontrado para <strong>{analyzedData?.modelo || manualSearch}</strong>.
                   </p>
                   <p className="text-green-600/80 text-sm mt-1">
                     Pode comprar sem medo de ser repetido.
                   </p>
                </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};