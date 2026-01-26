import React, { useState, useMemo } from 'react';
import { Car } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Factory, Palette, Database, ChevronDown, ChevronUp } from 'lucide-react';

interface DashboardProps {
  cars: Car[];
}

export const Dashboard: React.FC<DashboardProps> = ({ cars }) => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    if (openSection === section) {
      setOpenSection(null);
    } else {
      setOpenSection(section);
    }
  };

  const stats = useMemo(() => {
    const brandCounts: Record<string, number> = {};
    const manufacturerCounts: Record<string, number> = {};
    const colorCounts: Record<string, number> = {};

    cars.forEach(car => {
      const brand = car.marca.trim();
      const mfg = car.fabricante.trim();
      const color = car.cor.trim() || 'N/A'; 

      if (brand) brandCounts[brand] = (brandCounts[brand] || 0) + 1;
      if (mfg) manufacturerCounts[mfg] = (manufacturerCounts[mfg] || 0) + 1;
      if (color) colorCounts[color] = (colorCounts[color] || 0) + 1;
    });

    const toArray = (obj: Record<string, number>) => 
      Object.entries(obj)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return {
      topBrands: toArray(brandCounts),
      topManufacturers: toArray(manufacturerCounts),
      topColors: toArray(colorCounts),
      totalCars: cars.length,
      totalBrands: Object.keys(brandCounts).length,
    };
  }, [cars]);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* PERSONALIZED WELCOME */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-2">
         <div>
            <h2 className="text-4xl text-slate-800 font-display uppercase italic tracking-tighter">
              Fala, Leo!
            </h2>
            <p className="text-slate-500 font-medium">
              Sua coleção está brilhando hoje. Vamos ver os números?
            </p>
         </div>
         <div className="hidden md:block">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-widest">
              Status: Colecionador Pro
            </span>
         </div>
      </div>

      {/* TOTAL STATS CARD (Full Width) */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-8 rounded-3xl shadow-xl border-t-4 border-emerald-500 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 text-white/5 rotate-12">
            <Database size={250} />
          </div>
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Column 1: Total Inventory */}
            <div>
              <div className="p-3 bg-white/10 rounded-xl w-fit mb-4 backdrop-blur-sm border border-white/10">
                <Database size={28} className="text-emerald-400" />
              </div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-[0.2em] mb-1">Inventário Total</p>
              <h3 className="text-7xl font-display text-white tracking-tighter">
                {stats.totalCars}
                <span className="text-2xl text-emerald-500 ml-3 font-sans font-bold">Un.</span>
              </h3>
            </div>

            {/* Column 2: Additional Stats */}
            <div className="md:border-l md:border-white/10 md:pl-8 flex flex-col justify-center gap-6">
               <div className="flex justify-between items-center">
                 <div>
                   <span className="block text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Marcas Únicas</span>
                   <span className="text-3xl font-mono font-bold text-white">{stats.totalBrands}</span>
                 </div>
                 <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <Factory size={20} />
                 </div>
               </div>
               
               <div className="h-px bg-white/10 w-full"></div>

               <div className="flex justify-between items-center">
                 <div>
                   <span className="block text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Top Fabricante</span>
                   <span className="text-2xl font-display text-white uppercase">{stats.topManufacturers[0]?.name || '-'}</span>
                 </div>
                 <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Database size={20} />
                 </div>
               </div>
            </div>
          </div>
      </div>

      <h3 className="text-xl font-display text-slate-700 uppercase tracking-wide mt-8 border-l-4 border-emerald-500 pl-4">
        Análise de Frota
      </h3>

      <div className="grid grid-cols-1 gap-4">
        
        {/* 2. Expandable Card: Manufacturers */}
        <div className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${openSection === 'manufacturers' ? 'border-emerald-500 shadow-xl ring-1 ring-emerald-500/20' : 'border-slate-200 shadow-sm hover:border-emerald-300'}`}>
          <button 
            onClick={() => toggleSection('manufacturers')}
            className="w-full p-6 flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-xl transition-colors ${openSection === 'manufacturers' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600'}`}>
                <Factory size={28} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.15em] mb-0.5">Fabricante Dominante</p>
                <h3 className="text-2xl font-display text-slate-900 uppercase">
                  {stats.topManufacturers[0]?.name || 'N/A'} 
                </h3>
                <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500 border border-slate-200">
                    {stats.topManufacturers[0]?.value || 0} unidades
                </span>
              </div>
            </div>
            {openSection === 'manufacturers' ? <ChevronUp className="text-emerald-500" /> : <ChevronDown className="text-slate-300 group-hover:text-emerald-400" />}
          </button>
          
          {openSection === 'manufacturers' && (
            <div className="px-6 pb-8 animate-fade-in border-t border-slate-100 pt-8 bg-slate-50/50">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.topManufacturers}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => percent > 0.04 ? `${name}` : ''}
                      stroke="none"
                    >
                      {stats.topManufacturers.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={getManufacturerColor(entry.name)} 
                            strokeWidth={0}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                      itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* 3. Expandable Card: Brands */}
        <div className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${openSection === 'brands' ? 'border-purple-500 shadow-xl ring-1 ring-purple-500/20' : 'border-slate-200 shadow-sm hover:border-purple-300'}`}>
          <button 
            onClick={() => toggleSection('brands')}
            className="w-full p-6 flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-xl transition-colors ${openSection === 'brands' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500 group-hover:bg-purple-50 group-hover:text-purple-600'}`}>
                <Database size={28} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.15em] mb-0.5">Top Marca (Real)</p>
                <h3 className="text-2xl font-display text-slate-900 uppercase">
                   {stats.topBrands[0]?.name || 'Variadas'}
                </h3>
                <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500 border border-slate-200">
                    {stats.totalBrands} marcas no total
                </span>
              </div>
            </div>
            {openSection === 'brands' ? <ChevronUp className="text-purple-500" /> : <ChevronDown className="text-slate-300 group-hover:text-purple-400" />}
          </button>

          {openSection === 'brands' && (
            <div className="px-6 pb-8 animate-fade-in border-t border-slate-100 pt-8 bg-slate-50/50">
              <div className="h-[500px] overflow-y-auto pr-2 custom-scrollbar bg-white rounded-xl border border-slate-100 p-4 shadow-inner">
                <div style={{ height: `${Math.max(500, stats.totalBrands * 35)}px`, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={stats.topBrands} 
                      layout="vertical" 
                      margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#e2e8f0" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={140} 
                        tick={{fontSize: 12, fill: '#475569', fontWeight: 600}} 
                        stroke="none"
                        interval={0}
                      />
                      <Tooltip 
                        cursor={{fill: '#f3e8ff'}}
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="value" barSize={18} radius={[0, 4, 4, 0]}>
                        {stats.topBrands.map((entry, index) => (
                            <Cell key={index} fill={index < 5 ? '#9333ea' : '#cbd5e1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Expandable Card: Colors */}
        <div className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${openSection === 'colors' ? 'border-orange-500 shadow-xl ring-1 ring-orange-500/20' : 'border-slate-200 shadow-sm hover:border-orange-300'}`}>
          <button 
            onClick={() => toggleSection('colors')}
            className="w-full p-6 flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-xl transition-colors ${openSection === 'colors' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500 group-hover:bg-orange-50 group-hover:text-orange-600'}`}>
                <Palette size={28} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.15em] mb-0.5">Paleta de Cores</p>
                <h3 className="text-2xl font-display text-slate-900 uppercase">
                  {stats.topColors[0]?.name || 'N/A'}
                </h3>
                <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500 border border-slate-200">
                    A cor mais comum
                </span>
              </div>
            </div>
            {openSection === 'colors' ? <ChevronUp className="text-orange-500" /> : <ChevronDown className="text-slate-300 group-hover:text-orange-400" />}
          </button>

          {openSection === 'colors' && (
            <div className="px-6 pb-8 animate-fade-in border-t border-slate-100 pt-8 bg-slate-50/50">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.topColors.slice(0, 20)} layout="horizontal" margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                          dataKey="name" 
                          type="category" 
                          tick={{fontSize: 11, fill: '#475569', fontWeight: 600}} 
                          stroke="#cbd5e1" 
                          interval={0} 
                          angle={-45} 
                          textAnchor="end" 
                          height={60} 
                      />
                      <YAxis type="number" allowDecimals={false} tick={{fontSize: 11, fill: '#94a3b8'}} stroke="#cbd5e1" />
                      <Tooltip 
                          cursor={{fill: '#fff7ed'}}
                          contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {stats.topColors.slice(0, 20).map((entry, index) => (
                          <Cell 
                              key={`cell-${index}`} 
                              fill={getRealColorHex(entry.name)} 
                              stroke={getRealColorStroke(entry.name)}
                              strokeWidth={1}
                          />
                      ))}
                      </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

// --- COLOR MAPPING HELPERS ---

function getManufacturerColor(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('hot wheels')) return '#0072CE';
    if (n.includes('matchbox')) return '#F37021';
    if (n.includes('majorette')) return '#E3001B';
    if (n.includes('tomica')) return '#333333';
    if (n.includes('greenlight')) return '#009639';
    if (n.includes('maisto')) return '#005BBB';
    if (n.includes('siku')) return '#D00000';
    if (n.includes('johnny')) return '#FFD700';
    if (n.includes('welly')) return '#555555';
    if (n.includes('schuco')) return '#AA0000';
    if (n.includes('tarmac')) return '#000000';
    if (n.includes('mini gt')) return '#FF0000';
    
    const Fallbacks = ['#6b7280', '#475569', '#334155', '#1e293b'];
    return Fallbacks[name.length % Fallbacks.length];
}

function getRealColorHex(colorName: string): string {
    const c = colorName.toLowerCase();
    
    if (c.includes('azul escuro')) return '#1e3a8a';
    if (c.includes('azul claro')) return '#60a5fa';
    if (c.includes('azul')) return '#3b82f6';
    if (c.includes('vinho') || c.includes('bordô')) return '#881337';
    if (c.includes('rosa')) return '#ec4899';
    if (c.includes('vermelho')) return '#ef4444';
    if (c.includes('verde escuro')) return '#14532d';
    if (c.includes('verde claro')) return '#86efac';
    if (c.includes('verde')) return '#22c55e';
    if (c.includes('amarelo')) return '#facc15';
    if (c.includes('laranja')) return '#f97316';
    if (c.includes('dourado') || c.includes('gold')) return '#eab308';
    if (c.includes('preto')) return '#171717';
    if (c.includes('branco')) return '#f1f5f9';
    if (c.includes('prata') || c.includes('cinza') || c.includes('silver')) return '#94a3b8';
    if (c.includes('bege')) return '#d6d3d1';
    if (c.includes('marrom')) return '#78350f';
    if (c.includes('roxo')) return '#a855f7';
    if (c.includes('lilás')) return '#d8b4fe';

    return '#94a3b8'; 
}

function getRealColorStroke(colorName: string): string {
    const c = colorName.toLowerCase();
    if (c.includes('branco') || c.includes('white') || c.includes('amarelo') || c.includes('bege')) {
        return '#cbd5e1'; 
    }
    return 'none';
}