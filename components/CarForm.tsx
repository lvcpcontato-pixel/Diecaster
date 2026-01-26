
import React, { useState, useEffect, useRef } from 'react';
import { Car } from '../types';
import { Save, X, ImageIcon, Loader2 } from 'lucide-react';

interface CarFormProps {
  initialData?: Partial<Car> | null;
  onSave: (car: Car) => Promise<void>;
  onCancel: () => void;
}

export const CarForm: React.FC<CarFormProps> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Car>>({
    marca: '', modelo: '', fabricante: 'Hot Wheels', cor: '', ano: '', pack: '', observacoes: '', fotoBase64: ''
  });
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (initialData) setFormData(prev => ({ ...prev, ...initialData }));
  }, [initialData]);

  const resizeAndConvert = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const max_size = 1024; 

          if (width > height) {
            if (width > max_size) { height *= max_size / width; width = max_size; }
          } else {
            if (height > max_size) { width *= max_size / height; height = max_size; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7)); 
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingImage(true);
    try {
      const base64 = await resizeAndConvert(file);
      setFormData(prev => ({ ...prev, fotoBase64: base64 }));
    } catch (err) {
      console.error("Erro ao processar imagem", err);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.marca || !formData.modelo) {
      alert("Marca e Modelo são obrigatórios!");
      return;
    }
    setIsSaving(true);
    try {
      await onSave({
        id: initialData?.id || Date.now().toString(),
        ...formData
      } as Car);
    } catch (err) {
      alert("Erro ao salvar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const previewImage = formData.fotoBase64 || formData.fotoUrl?.replace('open?', 'uc?export=view&');

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-4xl mx-auto animate-fade-in relative overflow-hidden">
      {isSaving && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fade-in">
          <Loader2 size={48} className="text-emerald-600 animate-spin mb-4" />
          <p className="text-slate-800 font-display uppercase italic">Enviando para a Planilha...</p>
          <p className="text-slate-400 text-xs">Isso pode levar alguns segundos devido à foto.</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold text-slate-900">{initialData?.id ? 'Editar Veículo' : 'Novo Veículo'}</h2>
        <button onClick={onCancel} className="text-slate-400 hover:bg-slate-50 p-2 rounded-full"><X size={24} /></button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Foto do Item</label>
          <div 
            className="group relative aspect-square w-full rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-emerald-500 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
             {previewImage ? (
               <img src={previewImage} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Carro" />
             ) : (
               <div className="flex flex-col items-center text-slate-300">
                  <ImageIcon size={48} />
                  <span className="text-xs mt-2 font-medium">Clique para Adicionar</span>
               </div>
             )}
             
             {isProcessingImage && (
               <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                 <Loader2 className="animate-spin text-emerald-500" />
               </div>
             )}

             <div className="absolute inset-x-0 bottom-0 bg-slate-900/60 backdrop-blur-sm p-2 text-white text-[10px] font-bold uppercase text-center opacity-0 group-hover:opacity-100 transition-opacity">
                {previewImage ? 'Alterar Foto' : 'Selecionar Foto'}
             </div>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          <p className="text-[10px] text-slate-400 text-center italic">Fotos serão salvas no Google Drive.</p>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Marca *</label>
              <input required value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="Ex: Porsche" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Modelo *</label>
              <input required value={formData.modelo} onChange={e => setFormData({...formData, modelo: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="Ex: 911 GT3" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Fabricante</label>
              <input value={formData.fabricante} onChange={e => setFormData({...formData, fabricante: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Cor</label>
              <input value={formData.cor} onChange={e => setFormData({...formData, cor: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Série / Pack</label>
            <input value={formData.pack} onChange={e => setFormData({...formData, pack: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Observações</label>
            <textarea rows={3} value={formData.observacoes} onChange={e => setFormData({...formData, observacoes: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
            <button type="button" onClick={onCancel} className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600">Cancelar</button>
            <button type="submit" disabled={isProcessingImage || isSaving} className="px-10 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50">
               {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Salvar Tudo
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
