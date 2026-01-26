
import React, { useState, useMemo } from 'react';
import { Car } from '../types';
import { Search, Trash2, Edit2, Filter } from 'lucide-react';

interface CarListProps {
  cars: Car[];
  onEdit: (car: Car) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export const CarList: React.FC<CarListProps> = ({ cars, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterManufacturer, setFilterManufacturer] = useState('');

  // Extract unique values for dropdowns
  const brands = useMemo(() => Array.from(new Set(cars.map(c => String(c.marca || '')))).sort(), [cars]);
  const manufacturers = useMemo(() => Array.from(new Set(cars.map(c => String(c.fabricante || '')))).sort(), [cars]);

  const filteredCars = cars.filter(car => {
    const carModelo = String(car.modelo || '').toLowerCase();
    const carMarca = String(car.marca || '').toLowerCase();
    const carPack = String(car.pack || '').toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchesSearch = 
      carModelo.includes(term) ||
      carMarca.includes(term) ||
      carPack.includes(term) ||
      false;
    
    const matchesBrand = filterBrand ? carMarca === filterBrand.toLowerCase() : true;
    const matchesManufacturer = filterManufacturer ? String(car.fabricante || '').toLowerCase() === filterManufacturer.toLowerCase() : true;

    return matchesSearch && matchesBrand && matchesManufacturer;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Filters Section - Clean Panel */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-bold pb-2 border-b border-slate-100">
           <Filter size={16} className="text-emerald-600" />
           <span className="text-sm uppercase tracking-wide">Filtros</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por modelo ou série..."
              className="pl-10 pr-4 py-2.5 w-full bg-white border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm placeholder-slate-400 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
             <select 
               className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm cursor-pointer transition-all"
               value={filterBrand}
               onChange={(e) => setFilterBrand(e.target.value)}
             >
               <option value="">Todas as Marcas</option>
               {brands.map(b => <option key={b} value={b}>{b}</option>)}
             </select>
          </div>

          <div>
             <select 
               className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm cursor-pointer transition-all"
               value={filterManufacturer}
               onChange={(e) => setFilterManufacturer(e.target.value)}
             >
               <option value="">Todos os Fabricantes</option>
               {manufacturers.map(m => <option key={m} value={m}>{m}</option>)}
             </select>
          </div>
        </div>

        {(searchTerm || filterBrand || filterManufacturer) && (
           <div className="flex justify-between items-center text-xs text-slate-500 pt-2">
              <span>Resultados: <strong className="text-emerald-600">{filteredCars.length}</strong> encontrados</span>
              <button 
                 onClick={() => { setSearchTerm(''); setFilterBrand(''); setFilterManufacturer(''); }}
                 className="text-emerald-600 hover:text-emerald-700 underline font-medium"
              >
                 Limpar filtros
              </button>
           </div>
        )}
      </div>

      {/* Table Section - Clean White Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold border-b border-slate-200">
                <th className="p-4">Marca</th>
                <th className="p-4">Modelo</th>
                <th className="p-4">Fabricante</th>
                <th className="p-4">Cor</th>
                <th className="p-4 hidden md:table-cell">Ano</th>
                <th className="p-4 hidden lg:table-cell">Pack</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-slate-600 text-sm">
              {filteredCars.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 flex flex-col items-center justify-center w-full">
                    <Search size={32} className="mb-3 opacity-20" />
                    <p className="font-medium">Nenhum veículo encontrado.</p>
                  </td>
                </tr>
              ) : (
                filteredCars.map((car) => (
                  <tr key={car.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                    <td className="p-4 font-bold text-slate-800 align-middle">{car.marca}</td>
                    <td className="p-4 align-middle font-medium">{car.modelo}</td>
                    <td className="p-4 align-middle">
                      <span className="inline-flex items-center px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        {car.fabricante}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                       <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full border border-slate-200 shadow-sm"
                            style={{ backgroundColor: mapColorToHex(String(car.cor || '')) }}
                          />
                          <span className="truncate max-w-[100px] text-xs">{car.cor}</span>
                       </div>
                    </td>
                    <td className="p-4 hidden md:table-cell text-slate-400 align-middle font-mono text-xs">{car.ano || '-'}</td>
                    <td className="p-4 hidden lg:table-cell truncate max-w-[150px] text-xs text-slate-500 align-middle" title={car.pack}>
                      {car.pack || '-'}
                    </td>
                    <td className="p-4 text-right align-middle">
                      <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onEdit(car)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => onDelete(car.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Helper to guess a hex code for the dot based on color name
function mapColorToHex(colorName: string): string {
  if (!colorName) return '#cbd5e1';
  const c = colorName.toLowerCase();
  if (c.includes('vermelho') || c.includes('red') || c.includes('vinho') || c.includes('bordo')) return '#ef4444';
  if (c.includes('azul') || c.includes('blue')) return '#3b82f6';
  if (c.includes('verde') || c.includes('green')) return '#10b981';
  if (c.includes('amarelo') || c.includes('yellow')) return '#facc15';
  if (c.includes('preto') || c.includes('black')) return '#171717';
  if (c.includes('branco') || c.includes('white')) return '#f8fafc';
  if (c.includes('roxo') || c.includes('purple')) return '#a855f7';
  if (c.includes('laranja') || c.includes('orange')) return '#f97316';
  if (c.includes('prata') || c.includes('silver') || c.includes('cinza')) return '#94a3b8';
  if (c.includes('dourado') || c.includes('gold')) return '#eab308';
  return '#94a3b8'; 
}
